import { useEffect } from 'react';
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
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
};

export const useGoogleMap = (ref) => {
    const { setMap, setMarker } = useMap();

    useEffect(() => {
        // StrictMode runs effects twice in development. The flag makes sure only
        // the latest run creates a map, so we never end up with two maps on one div.
        let cancelled = false;
        let markerView;

        loader
            .load()
            .then(google => {
                if (cancelled || !ref.current) return;
                const map = new google.maps.Map(ref.current, mapOptions);
                markerView = new google.maps.marker.AdvancedMarkerElement({
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

        return () => {
            cancelled = true;
            if (markerView) markerView.map = null;
            setMarker(null);
            setMap(null);
        };
    }, [ref, setMap, setMarker]);
};
