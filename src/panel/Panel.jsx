import React from 'react'
import Tab from './Tab'
import './Panel.css'
import { useMap } from '../context/MapContext'

function Panel() {
    const { primaryDestination } = useMap();
    return (
        primaryDestination ?
            <div id="container">
                <Tab />
            </div > : <></>
    )
}

export default Panel