import { useRef } from "react";
import './Map.css';
import { useGoogleMap } from '../hooks/useGoogleMap';
import { useGeocodingAPI } from '../hooks/useGeocodingAPI';

export const Map = () => {
    const ref = useRef();
    
    // This hook handles map initialization
    useGoogleMap(ref);
    
    // This hook handles all API calls, drawing, and interactions
    useGeocodingAPI();

    return (
        <>
            <div className="place-autocomplete-card" id="place-autocomplete-card">
                <p>Search for a place here:</p>
            </div>
            <div ref={ref} id="map" />
        </>
    );
}
