import React from 'react';
import styles from './Tab.module.css';
import { useMap } from '../context/MapContext';
import { USAGE_COLORS, getUsageCategory } from '../hooks/useGeocodingAPI';

// Renders a destination's details, skipping any field the API didn't return.
function DestinationDetails({ destination }) {
    const { displayName, structureType, formattedAddress, types } = destination ?? {};
    return (
        <>
            {displayName?.text && <p><strong>Name: </strong> {displayName.text}</p>}
            {structureType && <p><strong>Structure Type: </strong>{structureType}</p>}
            {formattedAddress && <p><strong>Address: </strong> {formattedAddress}</p>}
            {types?.length > 0 && <p><strong>Type: </strong> {types.join(', ')}</p>}
        </>
    );
}

// Sub-cards for the navigation points currently drawn on the map.
// Clicking a card highlights that navigation point on the map; clicking it again clears it.
function NavigationPointCards() {
    const { accessPoints, selectedNavPointId, setSelectedNavPointId } = useMap();
    const { navigationPoints } = accessPoints;

    const navPointClick = (evt, i) => {
        // Don't let the click toggle the parent Sub / Upper Level card.
        evt.stopPropagation();
        const id = String(i);
        setSelectedNavPointId(selectedNavPointId === id ? null : id);
    };

    return (
        <div className={styles.navPoints}>
            <h4>Navigation Points ({navigationPoints.length})</h4>
            {navigationPoints.length === 0 && (
                <p className={styles.navPointEmpty}>No navigation points.</p>
            )}
            {navigationPoints.map((point, i) => {
                const usages = point.usages ?? [];
                const travelModes = point.travelModes ?? [];
                return (
                    <div
                        key={i}
                        className={selectedNavPointId === String(i) ? styles.navPointCardSelected : styles.navPointCard}
                        onClick={(evt) => navPointClick(evt, i)}
                    >
                        <p className={styles.navPointTitle}>
                            <span
                                className={styles.navPointDot}
                                style={{ backgroundColor: USAGE_COLORS[getUsageCategory(point)] }}
                            ></span>
                            Navigation point {i + 1}
                        </p>
                        <p><strong>Usage: </strong>{usages.length > 0 ? usages.join(', ') : 'None'}</p>
                        <p><strong>Travel Mode: </strong>{travelModes.length > 0 ? travelModes.join(', ') : 'Not specified'}</p>
                    </div>
                );
            })}
        </div>
    );
}

function Tab() {
    const {
        primaryDestination,
        subDestinations,
        containingPlaces,
        selectedContainingId,
        setSelectedContainingId,
        selectedCardId,
        setSelectedCardId,
        activeTab,
        setActiveTab
    } = useMap();

    const cardClick = (evt) => {
        // Get the id from the dataset attribute
        setSelectedCardId(evt.currentTarget.dataset.id);
    }

    // Clicking a containing place shows its polygon; clicking it again hides it.
    const containingCardClick = (i) => {
        const id = String(i);
        setSelectedContainingId(selectedContainingId === id ? null : id);
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

                <input 
                    className={styles.tabInput} 
                    type="radio" 
                    id="tab3" 
                    name="tabs" 
                    checked={activeTab === 'tab3'} 
                    onChange={() => setActiveTab('tab3')} 
                />
                <label className={styles.tabLabel} htmlFor="tab3">Upper Level</label>
            </div>

            {activeTab === 'tab1' && (
                <div className={styles.content}>
                    <div className={styles.destinationsList}>
                        <div className={styles.primary}>
                            {primaryDestination
                                ? <DestinationDetails destination={primaryDestination} />
                                : <p className={styles.empty}>No primary destination for this location.</p>}
                        </div>
                        <ul className={styles.legend}>
                            <li><span className={styles.dropoff}></span>DROPOFF</li>
                            <li><span className={styles.pickup}></span>PICKUP</li>
                            <li><span className={styles.parking}></span>PARKING</li>
                            <li><span className={styles.multipleUsage}></span>MULTIPLE USAGES</li>
                            <li><span className={styles.noUsage}></span>NO USAGE</li>
                            <li><span className={styles.entrance}></span>ENTRANCE</li>
                        </ul>
                        <NavigationPointCards />
                    </div>
                </div>
            )}

            {activeTab === 'tab2' && (
                <div className={styles.content}>
                    <div className={styles.destinationsList}>
                        {subDestinations.length === 0 && (
                            <p className={styles.empty}>No sub-destinations for this place.</p>
                        )}
                        {subDestinations.map((dest, i) => (
                            <div 
                                key={i} 
                                data-id={i} // Use data-id for non-string identifiers
                                className={selectedCardId === String(i) ? styles.destinationCardSelected : styles.destinationCard} 
                                onClick={cardClick}
                            >
                                <DestinationDetails destination={dest} />
                                {selectedCardId === String(i) && <NavigationPointCards />}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'tab3' && (
                <div className={styles.content}>
                    {/* Left blank when the response has no containingPlaces */}
                    <div className={styles.destinationsList}>
                        {containingPlaces.map((place, i) => (
                            <div
                                key={i}
                                className={selectedContainingId === String(i) ? styles.containingCardSelected : styles.containingCard}
                                onClick={() => containingCardClick(i)}
                            >
                                {place.structureType && <p><strong>Structure Type: </strong>{place.structureType}</p>}
                                {place.formattedAddress && <p><strong>Address: </strong> {place.formattedAddress}</p>}
                                {selectedContainingId === String(i) && <NavigationPointCards />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tab;
