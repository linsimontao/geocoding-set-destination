import React from 'react'
import Tab from './Tab'
import './Panel.css'

function Panel({ primaryDestination, subDestinations, selectedCardId, setSelectedCardId, activeTab, setActiveTab }) {
    return (
        primaryDestination? 
            <div id = "container">
                <Tab primaryDestination={primaryDestination} subDestinations = {subDestinations} selectedCardId={selectedCardId} setSelectedCardId={setSelectedCardId} activeTab={activeTab} setActiveTab={setActiveTab}/> 
            </div >:<></>
    )
}

export default Panel