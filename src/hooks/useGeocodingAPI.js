import { useEffect, useRef, useState } from 'react';
import { useMap } from '../context/MapContext';

const apiKey = import.meta.env.VITE_GOOGLEMAPS_API_KEY;

export const useGeocodingAPI = () => {
    const { map, marker, setPrimaryDestination, setSubDestinations, subDestinations, selectedCardId, activeTab } = useMap();
    const [autocompleteResult, setAutocompleteResult] = useState();
    const [displayPolygon, setDisplayPolygon] = useState();
    const [np, setNp] = useState([]);

    const displayPolygonRef = useRef();
    const navigationMarkers = useRef();
    const subDisplayPolygonRef = useRef();

    // Autocomplete setup effect
    useEffect(() => {
        if (!map) return;

        const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
            requestedLanguage: "ja",
            requestedRegion: "jp"
        });
        placeAutocomplete.id = "place-autocomplete-input";

        const card = document.getElementById("place-autocomplete-card");
        if (card && card.childElementCount === 1) { // Ensure it's not added multiple times
            card.appendChild(placeAutocomplete);
        }

        const handleSelect = async ({ placePrediction }) => {
            const place = placePrediction.toPlace();
            await place.fetchFields({
                fields: ["displayName", "formattedAddress", "location"],
            });
            setAutocompleteResult(place.Dg);
        };

        placeAutocomplete.addEventListener("gmp-select", handleSelect);

        return () => {
            // Cleanup: remove event listener and element
            // Note: direct DOM manipulation cleanup can be tricky in React
        };
    }, [map]);

    // Fetch geocoding data when autocomplete result changes
    useEffect(() => {
        if (!map || !marker || !autocompleteResult) return;

        if (autocompleteResult.location) {
            map.moveCamera({ center: autocompleteResult.location });
            marker.position = autocompleteResult.location;
        }

        const fetchData = async () => {
            try {
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-FieldMask': '*',
                        'X-Goog-Api-Key': apiKey,
                    },
                    body: JSON.stringify({
                        'place': `places/${autocompleteResult.id}`
                    })
                };
                const response = await fetch("https://geocode.googleapis.com/v4alpha/geocode/destinations", options);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const responseData = await response.json();
                if (responseData?.destinations?.length > 0) {
                    const destination = responseData.destinations[0];
                    if (destination?.primary) {
                        setPrimaryDestination(destination.primary);
                        if (destination.primary.displayPolygon) {
                            setDisplayPolygon(destination.primary.displayPolygon);
                        }
                    }
                    if (destination?.navigationPoints?.length > 0) {
                        setNp(destination.navigationPoints);
                    }
                    if (destination?.subDestinations?.length > 0) {
                        setSubDestinations(destination.subDestinations);
                    }
                }
            } catch (error) {
                console.error('Error during fetch operation:', error);
            }
        };

        fetchData();
    }, [map, marker, autocompleteResult, setPrimaryDestination, setSubDestinations]);

    // Draw primary destination polygon
    useEffect(() => {
        if (!map) return;
        if (displayPolygonRef.current) {
            displayPolygonRef.current.setMap(null);
        }
        if (displayPolygon?.coordinates) {
            const pathArr = displayPolygon.coordinates.map(item => 
                item.map(([lng, lat]) => ({ lat, lng }))
            );
            const poly = new window.google.maps.Polygon({
                paths: pathArr,
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 3,
                fillOpacity: 0,
            });
            poly.setMap(map);
            displayPolygonRef.current = poly;
        }
    }, [map, displayPolygon]);

    // Draw navigation points
    useEffect(() => {
        if (navigationMarkers.current?.length > 0) {
            navigationMarkers.current.forEach(m => m.setMap(null));
        }
        if (map && np?.length > 0) {
            const markerArr = np.map(navigationPoint => {
                const navigationPointElement = document.createElement("span");
                navigationPointElement.className = "dot";
                navigationPointElement.style.backgroundColor = 'black'; // default
                if (navigationPoint.restricted_travel_modes) {
                    switch (navigationPoint.restricted_travel_modes[0]) {
                        case 'DRIVE':
                            navigationPointElement.style.backgroundColor = 'blue';
                            break;
                        case 'WALK':
                            navigationPointElement.style.backgroundColor = 'green';
                            break;
                    }
                }
                return new window.google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: { "lat": navigationPoint.location.latitude, "lng": navigationPoint.location.longitude },
                    content: navigationPointElement,
                    title: "navigation_point"
                });
            });
            navigationMarkers.current = markerArr;
        }
    }, [map, np]);

    // Draw sub-destination polygons
    useEffect(() => {
        if (subDisplayPolygonRef.current?.length > 0) {
            subDisplayPolygonRef.current.forEach(m => m.setMap(null));
        }

        if (map && subDestinations?.length > 0 && activeTab === 'tab2') {
            const subDestinationsPolygons = subDestinations.map(subDestination => {
                if (subDestination.displayPolygon?.coordinates) {
                    const pathArr = subDestination.displayPolygon.coordinates.map(item =>
                        item.map(([lng, lat]) => ({ lat, lng }))
                    );
                    const poly = new window.google.maps.Polygon({
                        paths: pathArr,
                        strokeColor: "#FF00FF",
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillOpacity: 0,
                    });
                    poly.setMap(map);
                    return poly;
                }
                return null;
            }).filter(Boolean);
            subDisplayPolygonRef.current = subDestinationsPolygons;
        }
    }, [map, subDestinations, activeTab]);

    // Handle selected card change
    useEffect(() => {
        if (map && marker && selectedCardId && subDestinations.length > 0) {
            try {
                const idx = parseInt(selectedCardId);
                if (idx >= 0 && idx < subDestinations.length) {
                    marker.position = {
                        lat: subDestinations[idx].location.latitude,
                        lng: subDestinations[idx].location.longitude
                    };
                }
            } catch (error) {
                console.error('Error parsing selectedCardId:', error);
            }
        }
    }, [map, marker, selectedCardId, subDestinations]);
};
