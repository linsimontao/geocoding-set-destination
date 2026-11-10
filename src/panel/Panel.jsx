import React from 'react'
import Tab from './Tab'
import styles from './Panel.module.css'
import { useMap } from '../context/MapContext'

function Panel() {
    const { primaryDestination, accessPoints, subDestinations, containingPlaces } = useMap();
    // Show the panel when there's anything to display. A lat,lng search can
    // return navigation points without a primary destination (e.g. rural areas).
    const hasResult =
        primaryDestination ||
        accessPoints.navigationPoints.length > 0 ||
        subDestinations.length > 0 ||
        containingPlaces.length > 0;
    return (
        hasResult ?
            <div className={styles.container}>
                <Tab />
            </div> : <></>
    )
}

export default Panel
