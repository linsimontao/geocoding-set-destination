import { useState, useEffect } from 'react';
import { Loader } from "@googlemaps/js-api-loader";
import { useMap } from '../context/MapContext';

const apiKey = import.meta.env.VITE_GOOGLEMAPS_API_KEY;

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

export const useGoogleMap = (ref) => {
    const { setMap, setMarker } = useMap();

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
                setMap(map);
                setMarker(markerView);
            })
            .catch(e => {
                console.error(e);
            });
    }, [ref, setMap, setMarker]);
};
