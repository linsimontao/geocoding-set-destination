import React from 'react';
import styles from './Tab.module.css';
import { useMap } from '../context/MapContext';

function Tab() {
    const {
        primaryDestination,
        subDestinations,
        selectedCardId,
        setSelectedCardId,
        activeTab,
        setActiveTab
    } = useMap();

    const cardClick = (evt) => {
        // Get the id from the dataset attribute
        setSelectedCardId(evt.currentTarget.dataset.id);
    }

    return (
        <div className={styles.tabinator}>
            <h2>Geocoding Result</h2>
            <div className={styles.tabs}>
                <input 
                    className={styles.tabInput} 
                    type="radio" 
                    id="tab1" 
                    name="tabs" 
                    checked={activeTab === 'tab1'} 
                    onChange={() => setActiveTab('tab1')} 
                />
                <label className={styles.tabLabel} htmlFor="tab1">Primary</label>
                
                <input 
                    className={styles.tabInput} 
                    type="radio" 
                    id="tab2" 
                    name="tabs" 
                    checked={activeTab === 'tab2'} 
                    onChange={() => setActiveTab('tab2')} 
                />
                <label className={styles.tabLabel} htmlFor="tab2">Sub</label>
            </div>

            {activeTab === 'tab1' && (
                <div className={styles.content}>
                    <div className={styles.primary}>
                        {primaryDestination.displayName && <p><strong>Name: </strong> {primaryDestination.displayName.text}</p>}
                        <p><strong>Structure Type: </strong>{primaryDestination.structureType}</p>
                        <p><strong>Address: </strong> {primaryDestination.formattedAddress}</p>
                        <p><strong>Type: </strong> {primaryDestination.types.join(', ')}</p>
                    </div>
                    <ul className={styles.legend}>
                        <li><span className={styles.walk}></span>WALK</li>
                        <li><span className={styles.drive}></span>DRIVE</li>
                        <li><span className={styles.both}></span>BOTH</li>
                    </ul>
                </div>
            )}

            {activeTab === 'tab2' && (
                <div className={styles.content}>
                    <div className={styles.destinationsList}>
                        {subDestinations.map((dest, i) => (
                            <div 
                                key={i} 
                                data-id={i} // Use data-id for non-string identifiers
                                className={selectedCardId === String(i) ? styles.destinationCardSelected : styles.destinationCard} 
                                onClick={cardClick}
                            >
                                {dest.displayName && <p><strong>Name: </strong> {dest.displayName.text}</p>}
                                <p><strong>Structure Type: </strong>{dest.structureType}</p>
                                <p><strong>Address: </strong> {dest.formattedAddress}</p>
                                <p><strong>Type: </strong> {dest.types.join(', ')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tab;
