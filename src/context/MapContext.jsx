import React, { createContext, useState, useContext } from 'react';

// 1. Create the Context
const MapContext = createContext();

// 2. Create a Provider component
export const MapProvider = ({ children }) => {
  const [primaryDestination, setPrimaryDestination] = useState(null);
  const [subDestinations, setSubDestinations] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [activeTab, setActiveTab] = useState('tab1');
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // Bundle all states and setters into a value object
  const value = {
    primaryDestination,
    setPrimaryDestination,
    subDestinations,
    setSubDestinations,
    selectedCardId,
    setSelectedCardId,
    activeTab,
    setActiveTab,
    map,
    setMap,
    marker,
    setMarker,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

// 3. Create a custom hook for easy context consumption
export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
