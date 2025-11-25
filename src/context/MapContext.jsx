import React, { createContext, useState, useContext } from 'react';

// 1. 创建 Context
const MapContext = createContext();

// 2. 创建一个 Provider 组件
export const MapProvider = ({ children }) => {
  const [primaryDestination, setPrimaryDestination] = useState(null);
  const [subDestinations, setSubDestinations] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [activeTab, setActiveTab] = useState('tab1');
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // 将所有 state 和 updater 函数打包到一个 value 对象中
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

// 3. 创建一个自定义 Hook，方便组件使用 Context
export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
