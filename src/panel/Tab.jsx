import React, { useState } from 'react'
import './Tab.css'
function Tab({ primaryDestination, subDestinations, selectedCardId, setSelectedCardId, activeTab, setActiveTab }) {
    const cardClick = (evt) => {
        setSelectedCardId(evt.target.id);
    }
    return (
        <div class="tabinator">
            <h2>Geocoding Result</h2>
            <input className="tab" type="radio" id="tab1" name="tabs" checked={activeTab === 'tab1'} onClick={() => { setActiveTab('tab1') }} />
            <label className="tab-label" for="tab1">Primary</label>
            <input className="tab" type="radio" id="tab2" name="tabs" checked={activeTab === 'tab2'} onClick={() => { setActiveTab('tab2') }} />
            <label className="tab-label" for="tab2">Sub</label>

            <div id="content1">
                <div className="primary">
                    {primaryDestination.displayName ? <p><strong>Name: </strong> {primaryDestination.displayName.text}</p> : <></>}
                    <p><strong>Structure Type: </strong>{primaryDestination.structureType}</p>
                    <p><strong>Address: </strong> {primaryDestination.formattedAddress}</p>
                    <p><strong>Type: </strong> {primaryDestination.types.reduce((acc, cur) => acc + ', ' + cur)}</p>
                </div>
                <ul id="legend">
                    <li><span className='walk'></span>WALK</li>
                    <li><span className='drive'></span>DRIVE</li>
                    <li><span className='both'></span>BOTH</li>
                </ul>
            </div>
            <div id="content2">
                <div className="destinations-list">
                    {
                        subDestinations.map((dest, i) => {
                            return (
                                <div id={i} className={(selectedCardId === String(i)) ? "destination-card-selected" : "destination-card"} onClick={(evt) => cardClick(evt)}>
                                    {dest.displayName ? <p id={i}><strong>Name: </strong> {dest.displayName.text}</p> : <></>}
                                    <p id={i}><strong>Structure Type: </strong>{dest.structureType}</p>
                                    <p id={i}><strong>Address: </strong> {dest.formattedAddress}</p>
                                    <p id={i}><strong>Type: </strong> {dest.types.reduce((acc, cur) => acc + ', ' + cur)}</p>
                                </div>)
                        })
                    }
                </div>
            </div>
        </div>
    )
}

export default Tab