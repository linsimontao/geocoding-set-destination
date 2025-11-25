import React from 'react'
import Tab from './Tab'
import styles from './Panel.module.css'
import { useMap } from '../context/MapContext'

function Panel() {
    const { primaryDestination } = useMap();
    return (
        primaryDestination ?
            <div className={styles.container}>
                <Tab />
            </div > : <></>
    )
}

export default Panel