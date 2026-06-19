import React, { useState, useEffect } from 'react';
import { Compass, AlertCircle } from 'lucide-react';
import TripForm from './components/TripForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import LiveMap from './components/LiveMap';
import RAGChatbot from './components/RAGChatbot';
import DashboardWidgets from './components/DashboardWidgets';

/*
App Component
=============
The main coordinator of our AI Travel Planner.
- Added support for automated weather lookup and Leaflet street maps.
- Stripped unnecessary emojis to match professional engineering guidelines.
*/

const BACKEND_URL = 'http://localhost:8000';

const FALLBACK_CITIES = [
  { id: 'kolkata', name: 'Kolkata', tagline: 'The City of Joy', description: 'Known for colonial architecture, hand-pulled trams, sweets (Rosogolla), and rich literary heritage.' },
  { id: 'delhi', name: 'Delhi', tagline: 'The Historic Capital', description: 'A massive metropolis combining ancient heritage bazaar lanes with the structured power of New Delhi.' },
  { id: 'mumbai', name: 'Mumbai', tagline: 'The City of Dreams', description: 'A fast-paced coastal city, home to Bollywood, local trains, and vibrant marine drives.' },
  { id: 'bengaluru', name: 'Bengaluru', tagline: 'The Silicon Valley', description: 'India\'s tech hub, famous for its perfect weather, microbreweries, and cafe culture.' },
  { id: 'jaipur', name: 'Jaipur', tagline: 'The Pink City', description: 'The regal capital of Rajasthan, filled with massive hill forts and pink sandstone palaces.' }
];

export default function App() {
  // Connection states
  const [serverHealthy, setServerHealthy] = useState(true);
  const [cities, setCities] = useState(FALLBACK_CITIES);
  const [errorMessage, setErrorMessage] = useState('');

  // Planning Form inputs state (removed manual weather)
  const [selectedCity, setSelectedCity] = useState('Kolkata');
  const [interests, setInterests] = useState('sightseeing, street food, local culture');
  const [days, setDays] = useState(3);
  const [persona, setPersona] = useState('Solo');
  const [pace, setPace] = useState('Balanced');
  const [budget, setBudget] = useState('Mid-range');

  // Output results state
  const [itinerary, setItinerary] = useState(null);
  const [weatherData, setWeatherData] = useState(null); // holds geocoded coords and forecast
  const [chatMessages, setChatMessages] = useState([]);
  
  // Loading indicators
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' or 'specs'

  // Check health and load cities on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/cities`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch cities");
        return res.json();
      })
      .then((data) => {
        setCities(data);
        setServerHealthy(true);
      })
      .catch((err) => {
        console.warn("Backend server not reachable on localhost:8000, using local fallback data.");
        setServerHealthy(false);
      });
  }, []);

  // Generate Itinerary
  const handleGenerateTrip = async () => {
    setLoading(true);
    setErrorMessage('');
    setItinerary(null);
    setWeatherData(null);
    setChatMessages([]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: selectedCity,
          interests,
          days,
          budget,
          persona,
          pace
        })
      });

      const data = await response.json();

      if (!response.ok) {
        let errMsg = "Failed to generate itinerary. Check backend settings.";
        if (data && data.detail) {
          if (typeof data.detail === 'string') {
            errMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errMsg = data.detail.map(err => {
              const field = err.loc ? err.loc.join('.') : 'field';
              return `${field}: ${err.msg}`;
            }).join(', ');
          } else {
            errMsg = JSON.stringify(data.detail);
          }
        }
        throw new Error(errMsg);
      }

      setItinerary(data.itinerary);
      setWeatherData(data.weather); // store lat/lon & 3-day forecast
      
      // Load initial co-pilot greeting
      setChatMessages([
        {
          role: 'assistant',
          content: `Hello. I am your local Travel Co-Pilot. I have reviewed your itinerary for ${selectedCity}. You can ask me about local transport, safety warnings, dining guidelines, or request changes to your day schedules.`
        }
      ]);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Chatbot Messaging
  const handleSendMessage = async (text) => {
    const newUserMessage = { role: 'user', content: text };
    const updatedHistory = [...chatMessages, newUserMessage];
    setChatMessages(updatedHistory);
    setChatLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          history: updatedHistory.slice(0, -1),
          city: selectedCity,
          itinerary: itinerary
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to communicate with chatbot.");
      }

      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err.message}`
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Determine active city name
  const activeCityName = weatherData ? weatherData.full_name : selectedCity;

  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="glass-panel app-header">
        <div className="brand">
          <div className="brand-logo">A</div>
          <span className="brand-name">AeroTrip AI</span>
        </div>
        
        <div className={`server-badge ${serverHealthy ? '' : 'error'}`}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: serverHealthy ? 'var(--accent-green)' : '#dc2626',
            display: 'inline-block'
          }}></span>
          <span>{serverHealthy ? 'System Active' : 'System Offline'}</span>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="workspace-grid">
        
        {/* Left Configurator Form */}
        <TripForm
          cities={cities}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          interests={interests}
          setInterests={setInterests}
          days={days}
          setDays={setDays}
          budget={budget}
          setBudget={setBudget}
          persona={persona}
          setPersona={setPersona}
          pace={pace}
          setPace={setPace}
          onSubmit={handleGenerateTrip}
          loading={loading}
          serverHealthy={serverHealthy}
        />

        {/* Right Output Workspace */}
        <div className="right-panel">
          
          {/* Error Message Box */}
          {errorMessage && (
            <div className="glass-panel" style={{
              padding: '1.5rem',
              borderLeft: '4px solid #ef4444',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              background: 'rgba(239, 68, 68, 0.05)'
            }}>
              <AlertCircle className="text-red-500" size={24} style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ color: '#ef4444', fontWeight: 600, marginBottom: '0.25rem' }}>Generation Error</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {errorMessage}
                </p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ensure the backend API server is active and the GROQ_API_KEY environment variable is configured.
                </div>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="glass-panel loader-container">
              <div className="spinner"></div>
              <div className="loading-text">
                Analyzing Live Weather & Designing Timeline for {selectedCity}...
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Structuring day itinerary logs and loading RAG search documents
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !itinerary && !errorMessage && (
            <div className="glass-panel empty-state">
              <div className="empty-icon">
                <Compass size={36} />
              </div>
              <div className="empty-headline">Custom Travel Planning</div>
              <p className="empty-subtext">
                Configure your destination city, travel duration, and interests in the left panel to generate a live weather-aware itinerary.
              </p>
            </div>
          )}

          {/* Active Workspace */}
          {!loading && itinerary && (
            <div className="itinerary-dashboard">
              
              {/* Timeline Output Column */}
              <ItineraryDisplay
                itinerary={itinerary}
                cityName={activeCityName}
              />

              {/* Chatbot & Visual Map Column */}
              <div className="sidebar-container">
                
                {/* Geocoded Street Map */}
                {weatherData && (
                  <LiveMap 
                    latitude={weatherData.latitude} 
                    longitude={weatherData.longitude} 
                    cityName={activeCityName} 
                  />
                )}

                {/* Sidebar Tab Switcher */}
                <div className="sidebar-tabs">
                  <button
                    className={`sidebar-tab-btn ${sidebarTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setSidebarTab('chat')}
                  >
                    Chat Assistant
                  </button>
                  <button
                    className={`sidebar-tab-btn ${sidebarTab === 'specs' ? 'active' : ''}`}
                    onClick={() => setSidebarTab('specs')}
                  >
                    Checklist & Budget
                  </button>
                </div>

                {/* Tab Contents */}
                {sidebarTab === 'chat' ? (
                  <RAGChatbot
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    loading={chatLoading}
                    cityName={activeCityName}
                  />
                ) : (
                  <div className="scrollable-sidebar-widget">
                    <DashboardWidgets
                      days={days}
                      budget={budget}
                      persona={persona}
                      weatherData={weatherData}
                    />
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </main>
    </div>
  );
}
