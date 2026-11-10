import { useCallback, useEffect, useRef, useState } from 'react';
import { useMap } from '../context/MapContext';

const apiKey = import.meta.env.VITE_GOOGLEMAPS_API_KEY;

// Geocoding API v4 - Search Destinations
const DESTINATIONS_ENDPOINT = 'https://geocode.googleapis.com/v4/geocode/destinations';

// Only request the parts of the response this app actually renders
// (instead of '*'), which keeps payloads small and billing predictable.
const DESTINATIONS_FIELD_MASK = [
    'destinations.primary',
    'destinations.navigationPoints',
    'destinations.subDestinations',
    'destinations.containingPlaces',
    'destinations.entrances',
].join(',');

// Fields needed when a Sub / Upper Level item is clicked.
const ACCESS_POINTS_FIELD_MASK = 'destinations.navigationPoints,destinations.entrances';

const EMPTY_ACCESS_POINTS = { navigationPoints: [], entrances: [] };

// Colours match the legend in the panel (see index.css variables).
const USAGE_COLORS = {
    DROPOFF: 'var(--dropoff-color)',
    PICKUP: 'var(--pickup-color)',
    PARKING: 'var(--parking-color)',
    MULTIPLE: 'var(--multiple-usage-color)',
    NONE: 'var(--no-usage-color)',
};

/**
 * Converts a GeoJSON Polygon / MultiPolygon ([lng, lat] pairs) into
 * google.maps.Polygon `paths` ({ lat, lng } literals).
 */
const toLatLngPaths = (geoJson) => {
    if (!geoJson?.coordinates) return [];
    const toRing = (ring) => ring.map(([lng, lat]) => ({ lat, lng }));
    if (geoJson.type === 'MultiPolygon') {
        return geoJson.coordinates.flatMap((polygon) => polygon.map(toRing));
    }
    return geoJson.coordinates.map(toRing);
};

/**
 * Returns the legend category for a navigation point based on its `usages`:
 * 'DROPOFF', 'PICKUP' or 'PARKING' when it has exactly one usage,
 * 'MULTIPLE' when it has several, and 'NONE' when no usage is returned.
 */
const getUsageCategory = (navigationPoint) => {
    const usages = navigationPoint.usages ?? [];
    if (usages.length === 0) return 'NONE';
    if (usages.length > 1) return 'MULTIPLE';
    return USAGE_COLORS[usages[0]] ? usages[0] : 'NONE';
};

/**
 * Parses a "lat,lng" string (e.g. "35.6812, 139.7671").
 * Returns { lat, lng } or null when the input is not a valid coordinate pair.
 */
export const parseLatLng = (text) => {
    const match = text?.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
};

/**
 * Returns the `places/{placeId}` resource name for a destination / containing place.
 * PlaceView objects expose it as `place`; `placeId` / `id` are accepted as fallbacks.
 */
const getPlaceResourceName = (item) => {
    if (!item) return null;
    if (typeof item.place === 'string' && item.place) {
        return item.place.startsWith('places/') ? item.place : `places/${item.place}`;
    }
    const id = item.placeId ?? item.id;
    return id ? `places/${id}` : null;
};

/**
 * Calls Search Destinations and returns the first destination (or null).
 * `requestBody` is either { place: 'places/...' } or { locationQuery: { location: {...} } }.
 */
const searchDestinations = async (requestBody, fieldMask, signal) => {
    const response = await fetch(DESTINATIONS_ENDPOINT, {
        method: 'POST',
        signal,
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': fieldMask,
            'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1',
        },
        body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
    }
    const responseData = await response.json();
    return responseData?.destinations?.[0] ?? null;
};

export const useGeocodingAPI = () => {
    const {
        map,
        marker,
        setPrimaryDestination,
        subDestinations,
        setSubDestinations,
        containingPlaces,
        setContainingPlaces,
        selectedContainingId,
        setSelectedContainingId,
        selectedCardId,
        setSelectedCardId,
        activeTab,
    } = useMap();
    // The current search: { requestBody, location } built from either an
    // Autocomplete selection (place ID) or a typed "lat,lng" (location query).
    const [query, setQuery] = useState(null);
    const [displayPolygon, setDisplayPolygon] = useState(null);
    // Navigation points + entrances of the searched (primary) place.
    const [primaryAccessPoints, setPrimaryAccessPoints] = useState(EMPTY_ACCESS_POINTS);
    // Navigation points + entrances currently drawn on the map.
    const [accessPoints, setAccessPoints] = useState(EMPTY_ACCESS_POINTS);
    const { navigationPoints, entrances } = accessPoints;
    // Cache of access points fetched for clicked items, keyed by place resource name.
    const accessPointsCache = useRef(new Map());

    // Autocomplete setup effect
    useEffect(() => {
        if (!map) return;
        const container = document.getElementById('place-autocomplete-container');
        if (!container) return;

        const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
            // requestedLanguage: "ja"
            // requestedRegion: "jp"
        });
        placeAutocomplete.id = 'place-autocomplete-input';

        const handleSelect = async ({ placePrediction }) => {
            try {
                const place = placePrediction.toPlace();
                await place.fetchFields({
                    fields: ['displayName', 'formattedAddress', 'location'],
                });
                const { id, location } = place.toJSON();
                setQuery({ requestBody: { place: `places/${id}` }, location });
            } catch (error) {
                console.error('Error fetching place details:', error);
            }
        };

        placeAutocomplete.addEventListener('gmp-select', handleSelect);
        container.appendChild(placeAutocomplete);

        // Cleanup also makes StrictMode's double-invoke safe (no duplicate inputs).
        return () => {
            placeAutocomplete.removeEventListener('gmp-select', handleSelect);
            placeAutocomplete.remove();
        };
    }, [map]);

    // Fetch destinations when a new search (place or lat,lng) is submitted
    useEffect(() => {
        if (!map || !marker || !query) return;

        if (query.location) {
            map.moveCamera({ center: query.location });
            marker.position = query.location;
        }

        // Clear the previous result so nothing stale stays on the map or panel.
        setPrimaryDestination(null);
        setDisplayPolygon(null);
        setPrimaryAccessPoints(EMPTY_ACCESS_POINTS);
        setAccessPoints(EMPTY_ACCESS_POINTS);
        setSubDestinations([]);
        setContainingPlaces([]);
        setSelectedContainingId(null);
        setSelectedCardId(null);
        accessPointsCache.current.clear();

        // Abort the request if another place is selected before it returns.
        const controller = new AbortController();

        const fetchDestinations = async () => {
            try {
                const destination = await searchDestinations(
                    query.requestBody,
                    DESTINATIONS_FIELD_MASK,
                    controller.signal,
                );
                if (!destination) {
                    console.warn('No destinations returned for', query.requestBody);
                    return;
                }
                setPrimaryDestination(destination.primary ?? null);
                setDisplayPolygon(destination.primary?.displayPolygon ?? null);
                setPrimaryAccessPoints({
                    navigationPoints: destination.navigationPoints ?? [],
                    entrances: destination.entrances ?? [],
                });
                setSubDestinations(destination.subDestinations ?? []);
                setContainingPlaces(destination.containingPlaces ?? []);
            } catch (error) {
                if (error.name === 'AbortError') return;
                console.error('Error during fetch operation:', error);
            }
        };

        fetchDestinations();
        return () => controller.abort();
    }, [map, marker, query, setPrimaryDestination, setSubDestinations, setContainingPlaces, setSelectedContainingId, setSelectedCardId]);

    // The item clicked in the active tab (Sub or Upper Level), if any.
    const selectedItem =
        activeTab === 'tab2' && selectedCardId != null ? subDestinations[Number(selectedCardId)]
        : activeTab === 'tab3' && selectedContainingId != null ? containingPlaces[Number(selectedContainingId)]
        : null;
    const hasSelectedItem = Boolean(selectedItem);
    const selectedItemPlace = getPlaceResourceName(selectedItem);

    // Show the clicked item's navigation points + entrances (fetched by its place ID),
    // or the primary place's ones when nothing is selected.
    useEffect(() => {
        if (!hasSelectedItem) {
            setAccessPoints(primaryAccessPoints);
            return;
        }

        // Remove the previously displayed navigation points / entrances right away.
        setAccessPoints(EMPTY_ACCESS_POINTS);
        if (!selectedItemPlace) {
            console.warn('Selected item has no place id; cannot fetch navigation points / entrances.');
            return;
        }

        const cached = accessPointsCache.current.get(selectedItemPlace);
        if (cached) {
            setAccessPoints(cached);
            return;
        }

        const controller = new AbortController();
        searchDestinations({ place: selectedItemPlace }, ACCESS_POINTS_FIELD_MASK, controller.signal)
            .then((destination) => {
                const result = {
                    navigationPoints: destination?.navigationPoints ?? [],
                    entrances: destination?.entrances ?? [],
                };
                accessPointsCache.current.set(selectedItemPlace, result);
                setAccessPoints(result);
            })
            .catch((error) => {
                if (error.name === 'AbortError') return;
                console.error('Error fetching navigation points / entrances for', selectedItemPlace, error);
            });
        return () => controller.abort();
    }, [hasSelectedItem, selectedItemPlace, primaryAccessPoints]);

    // Draw primary destination polygon
    useEffect(() => {
        if (!map || !displayPolygon) return;
        const polygon = new window.google.maps.Polygon({
            map,
            paths: toLatLngPaths(displayPolygon),
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillOpacity: 0,
        });
        return () => polygon.setMap(null);
    }, [map, displayPolygon]);

    // Draw navigation points
    useEffect(() => {
        if (!map || navigationPoints.length === 0) return;
        const markers = navigationPoints
            .filter((point) => point.location)
            .map((point) => {
                const category = getUsageCategory(point);
                const usages = point.usages ?? [];
                const travelModes = point.travelModes ?? [];
                const dot = document.createElement('span');
                dot.style.cssText = 'height: 10px; width: 10px; border-radius: 50%; display: inline-block;';
                dot.style.backgroundColor = USAGE_COLORS[category];
                return new window.google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: { lat: point.location.latitude, lng: point.location.longitude },
                    content: dot,
                    title:
                        `Navigation point (usages: ${usages.length > 0 ? usages.join(', ') : 'none'}` +
                        (travelModes.length > 0 ? `; travel modes: ${travelModes.join(', ')})` : ')'),
                });
            });
        // AdvancedMarkerElement has no setMap(); remove it by clearing `map`.
        return () => markers.forEach((m) => { m.map = null; });
    }, [map, navigationPoints]);

    // Draw entrances (red squares; entrances tagged PREFERRED are drawn larger)
    useEffect(() => {
        if (!map || entrances.length === 0) return;
        const markers = entrances
            .filter((entrance) => entrance.location)
            .map((entrance) => {
                const tags = entrance.tags ?? [];
                const size = tags.includes('PREFERRED') ? 14 : 10;
                const square = document.createElement('span');
                square.style.cssText =
                    `height: ${size}px; width: ${size}px; display: inline-block; border-radius: 2px;` +
                    'background-color: var(--entrance-color); border: 2px solid #fff;' +
                    'box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);';
                return new window.google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: { lat: entrance.location.latitude, lng: entrance.location.longitude },
                    content: square,
                    title: tags.length > 0 ? `Entrance (${tags.join(', ')})` : 'Entrance',
                    zIndex: 1,
                });
            });
        return () => markers.forEach((m) => { m.map = null; });
    }, [map, entrances]);

    // Draw sub-destination polygons (only while the "Sub" tab is active)
    useEffect(() => {
        if (!map || activeTab !== 'tab2' || subDestinations.length === 0) return;
        const polygons = subDestinations
            .filter((subDestination) => subDestination.displayPolygon?.coordinates)
            .map((subDestination) => new window.google.maps.Polygon({
                map,
                paths: toLatLngPaths(subDestination.displayPolygon),
                strokeColor: '#FF00FF',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillOpacity: 0,
            }));
        return () => polygons.forEach((p) => p.setMap(null));
    }, [map, subDestinations, activeTab]);

    // Draw the polygon of the clicked containing place (only while the "Upper Level" tab is active)
    useEffect(() => {
        if (!map || activeTab !== 'tab3' || selectedContainingId == null) return;
        const place = containingPlaces[Number(selectedContainingId)];
        if (!place?.displayPolygon?.coordinates) return;

        const paths = toLatLngPaths(place.displayPolygon);
        const polygon = new window.google.maps.Polygon({
            map,
            paths,
            strokeColor: '#FF8C00',
            strokeOpacity: 0.9,
            strokeWeight: 3,
            fillColor: '#FF8C00',
            fillOpacity: 0.1,
        });

        // Zoom to the polygon, leaving room for the search box (top) and panel (right).
        const bounds = new window.google.maps.LatLngBounds();
        paths.flat().forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, { top: 80, right: 380, bottom: 40, left: 40 });

        return () => polygon.setMap(null);
    }, [map, containingPlaces, selectedContainingId, activeTab]);

    // Move the marker to the selected sub-destination card
    useEffect(() => {
        if (!map || !marker || selectedCardId == null) return;
        const location = subDestinations[Number(selectedCardId)]?.location;
        if (!location) return;
        marker.position = { lat: location.latitude, lng: location.longitude };
    }, [map, marker, selectedCardId, subDestinations]);

    // Search Destinations by coordinates (locationQuery).
    const searchByLatLng = useCallback(({ lat, lng }) => {
        setQuery({
            requestBody: { locationQuery: { location: { latitude: lat, longitude: lng } } },
            location: { lat, lng },
        });
    }, []);

    return { searchByLatLng };
};
