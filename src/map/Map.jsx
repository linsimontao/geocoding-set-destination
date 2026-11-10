import { useEffect, useRef, useState } from "react";
import styles from './Map.module.css';
import { useMap } from '../context/MapContext';
import { useGoogleMap } from '../hooks/useGoogleMap';
import { useGeocodingAPI, parseLatLng } from '../hooks/useGeocodingAPI';

export const Map = () => {
    const ref = useRef();
    const [latLngText, setLatLngText] = useState('');
    const [latLngError, setLatLngError] = useState('');

    // This hook handles map initialization
    useGoogleMap(ref);

    // This hook handles all API calls, drawing, and interactions
    const { searchByLatLng } = useGeocodingAPI();
    const { map } = useMap();

    // Clicking the map searches destinations at the clicked lat,lng
    // and fills the coordinate input with it.
    useEffect(() => {
        if (!map) return;
        const listener = map.addListener('click', (evt) => {
            if (!evt.latLng) return;
            // Clicking a POI icon would open Google's default info window; suppress it.
            if (evt.placeId) evt.stop();
            const latLng = { lat: evt.latLng.lat(), lng: evt.latLng.lng() };
            setLatLngText(`${latLng.lat.toFixed(7)},${latLng.lng.toFixed(7)}`);
            setLatLngError('');
            searchByLatLng(latLng);
        });
        return () => listener.remove();
    }, [map, searchByLatLng]);

    const handleLatLngSubmit = (evt) => {
        evt.preventDefault();
        const latLng = parseLatLng(latLngText);
        if (!latLng) {
            setLatLngError('Enter coordinates as "lat,lng", e.g. 35.6812,139.7671');
            return;
        }
        setLatLngError('');
        searchByLatLng(latLng);
    };

    return (
        <>
            <div className={styles.placeAutocompleteCard} id="place-autocomplete-card">
                <p>Search for a place here:</p>
                {/* The PlaceAutocompleteElement is appended here by useGeocodingAPI */}
                <div id="place-autocomplete-container" />
                <p>Or enter coordinates (lat,lng), or click on the map:</p>
                <form className={styles.latLngForm} onSubmit={handleLatLngSubmit}>
                    <input
                        className={styles.latLngInput}
                        type="text"
                        placeholder="35.6812,139.7671"
                        value={latLngText}
                        onChange={(evt) => setLatLngText(evt.target.value)}
                    />
                    <button className={styles.latLngButton} type="submit">Search</button>
                </form>
                {latLngError && <p className={styles.latLngError}>{latLngError}</p>}
            </div>
            <div ref={ref} id="map" />
        </>
    );
}
