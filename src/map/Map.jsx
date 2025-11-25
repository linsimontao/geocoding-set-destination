import { Loader } from "@googlemaps/js-api-loader"
import { useRef, useEffect, useState } from "react"
import './Map.css'
import { act } from "react";
const apiKey = import.meta.env.VITE_GOOGLEMAPS_API_KEY

const loader = new Loader({
    apiKey,
    libraries: ["places", "marker"]
});

const mapOptions = {
    center: {
        lat: 35.6819677,
        lng: 139.7614256
    },

    mapTypeControl: false,
    fullscreenControl: false,
    zoom: 16.5,
    mapId: '9702a25b19eb451b',
};

export const Map = ({ setPrimaryDestination, subDestinations, setSubDestinations, selectedCardId, activeTab }) => {
    const ref = useRef()
    const displayPolygonRef = useRef()
    const navigationMarkers = useRef()
    const subDisplayPolygonRef = useRef()

    const [map, setMap] = useState()
    const [marker, setMarker] = useState()
    const [autocompleteResult, setAutocompleteResult] = useState()
    const [displayPolygon, setDisplayPolygon] = useState()
    const [np, setNp] = useState([])

    useEffect(() => {
        loader
            .load()
            .then(google => {
                const map = new window.google.maps.Map(ref.current, mapOptions);
                const markerView = new google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: mapOptions.center,
                    title: 'Tokyo',
                });
                setMap(map)
                setMarker(markerView)
                map.addListener("click", (evt) => {
                    // console.log(evt.latLng.lat(), evt.latLng.lng())
                    setClickCenter(evt.latLng)
                })
                const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
                    requestedLanguage: "ja",
                    requestedRegion: "jp"
                });
                placeAutocomplete.id = "place-autocomplete-input";
                const card = document.getElementById("place-autocomplete-card");
                if (card.childElementCount === 1) {
                    card.appendChild(placeAutocomplete);
                }
                placeAutocomplete.addEventListener("gmp-select", async ({ placePrediction }) => {
                    const place = placePrediction.toPlace();
                    // console.log(place)
                    await place.fetchFields({
                        fields: ["displayName", "formattedAddress", "location"],
                    });
                    setAutocompleteResult(place.Dg)
                })
            })
            .catch(e => {
                console.error(e)
            })
    }, [])
    useEffect(() => {
        if (map && autocompleteResult && marker) {
            console.log(autocompleteResult)
            if (autocompleteResult.location) {
                // console.log(autocompleteResult)
                map.moveCamera({ center: autocompleteResult.location })
                marker.position = autocompleteResult.location
                console.log(autocompleteResult.location)
            }

            const fetchData = async () => {
                try {
                    const options = {
                        method: 'POST', // Specify the HTTP method as POST
                        headers: {
                            'Content-Type': 'application/json', // Indicate that the body contains JSON data
                            'X-Goog-FieldMask': '*',
                            'X-Goog-Api-Key': apiKey,
                        },
                        body: JSON.stringify({
                            'place': `places/${autocompleteResult.id}`
                        })
                    };
                    // console.log(options);

                    try {
                        const response = await fetch("https://geocode.googleapis.com/v4alpha/geocode/destinations", options); // Make the fetch request

                        // Check if the request was successful
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const responseData = await response.json(); // Parse the JSON response
                        if (responseData && responseData.destinations && responseData.destinations.length > 0) {
                            const destination = responseData.destinations[0]
                            // console.log(destination)
                            if (destination?.primary) {
                                setPrimaryDestination(destination.primary)
                            }

                            if (destination?.primary?.displayPolygon) {
                                setDisplayPolygon(destination.primary.displayPolygon)
                            }

                            if (destination?.navigationPoints && destination?.navigationPoints.length > 0) {
                                setNp(destination.navigationPoints)
                            }

                            if (destination && destination.subDestinations.length > 0) {
                                setSubDestinations(destination.subDestinations)
                            }
                        }

                    } catch (error) {
                        console.error('Error during fetch operation:', error);
                        throw error; // Re-throw the error for further handling
                    }

                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            };

            fetchData()
        }
    }, [map, autocompleteResult, marker])

    useEffect(() => {
        // console.log(displayPolygon)
        if (map && displayPolygon) {
            if (displayPolygonRef.current) {
                displayPolygonRef.current.setMap(null)
                displayPolygonRef.current = null
            }
            if (displayPolygon && displayPolygon.coordinates) {
                const coord = displayPolygon.coordinates
                if (coord && coord.length > 0) {
                    const pathArr = []
                    coord.map(item => {
                        const subPath = []
                        item.map((lngLat) => {
                            subPath.push({ lat: lngLat[1], lng: lngLat[0] })
                        })
                        pathArr.push(subPath)
                    })
                    const poly = new google.maps.Polygon({
                        paths: pathArr,
                        strokeColor: "#FF0000",
                        strokeOpacity: 0.8,
                        strokeWeight: 3,
                        // fillColor: "#FF0000",
                        fillOpacity: 0,
                    });
                    poly.setMap(map)
                    displayPolygonRef.current = poly
                }
            }
        }
    }, [map, displayPolygon])

    useEffect(() => {
        // console.log(np)

        if (navigationMarkers.current && navigationMarkers.current.length > 0) {
            navigationMarkers.current.map(m => m.setMap(null))
            navigationMarkers.current = null
        }

        if (map && np) {
            const markerArr = []
            np.map(navigationPoint => {
                // console.log(navigationPoint)
                const navigationPointElement = document.createElement("span");
                navigationPointElement.className = "dot"
                navigationPointElement.style = "background-color: black"
                if (navigationPoint.restricted_travel_modes) {
                    switch (navigationPoint.restricted_travel_modes[0]) {
                        case 'DRIVE':
                            navigationPointElement.style = "background-color: blue"
                            break;
                        case 'WALK':
                            navigationPointElement.style = "background-color: green"
                            break;
                        default:
                            break;
                    }
                }

                const marker = new google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: { "lat": navigationPoint.location.latitude, "lng": navigationPoint.location.longitude },
                    content: navigationPointElement,
                    title: "navigation_point"
                })
                markerArr.push(marker)
            })
            navigationMarkers.current = markerArr
        }
    }, [map, np])

    useEffect(() => {
        if (subDisplayPolygonRef.current && subDisplayPolygonRef.current.length > 0) {
            subDisplayPolygonRef.current.map(m => m.setMap(null))
            subDisplayPolygonRef.current = null
        }

        if (map && subDestinations && activeTab === 'tab2') {
            const subDestinationsPolygons = []
            subDestinations.map(subDestination => {
                // console.log(subDestination)
                if (subDestination.displayPolygon && subDestination.displayPolygon.coordinates) {
                    const coord = subDestination.displayPolygon.coordinates
                    if (coord && coord.length > 0) {
                        const pathArr = []
                        coord.map(item => {
                            const subPath = []
                            item.map((lngLat) => {
                                subPath.push({ lat: lngLat[1], lng: lngLat[0] })
                            })
                            pathArr.push(subPath)
                        })
                        const poly = new google.maps.Polygon({
                            paths: pathArr,
                            strokeColor: "#FF00FF",
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillOpacity: 0,
                        });
                        poly.setMap(map)
                        subDestinationsPolygons.push(poly)
                    }
                }
            })
            subDisplayPolygonRef.current = subDestinationsPolygons
        }

        if (activeTab === 'tab1' && subDisplayPolygonRef.current && subDisplayPolygonRef.current.length > 0) {
            subDisplayPolygonRef.current.map(m => m.setMap(null))
        }
    }, [map, subDestinations, activeTab])

    useEffect(() => {
        if (map && selectedCardId && subDisplayPolygonRef.current && subDisplayPolygonRef.current.length > 0) {
            console.log(selectedCardId)
            try {
                const idx = parseInt(selectedCardId)
                if (idx >= 0 && idx < subDestinations.length) {
                    marker.position = {
                        lat: subDestinations[idx].location.latitude,
                        lng: subDestinations[idx].location.longitude
                    }
                }
            } catch (error) {
                console.error('Error parsing selectedCardId:', error);
            }
        }
    }, [map, selectedCardId])

    return (
        <>
            <div className="place-autocomplete-card" id="place-autocomplete-card">
                <p>Search for a place here:</p>
            </div>
            < div ref={ref} id="map" />
        </>)
}
