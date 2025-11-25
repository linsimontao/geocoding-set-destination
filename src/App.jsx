import { useState } from 'react'
import { Map } from './map/Map'
import Panel from './panel/Panel'
function App() {
  const [primaryDestination, setPrimaryDestination] = useState(null)
  const [subDestinations, setSubDestinations] = useState([])
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [activeTab, setActiveTab] = useState('tab1');
  return (
    <div className="App">
      <Map setPrimaryDestination={setPrimaryDestination} subDestinations={subDestinations} setSubDestinations={setSubDestinations} selectedCardId={selectedCardId} activeTab={activeTab}/>
      <Panel primaryDestination={primaryDestination} subDestinations={subDestinations} selectedCardId={selectedCardId} setSelectedCardId={setSelectedCardId} activeTab={activeTab} setActiveTab={setActiveTab}/>
    </div>
  )
}

export default App