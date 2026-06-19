import React, { useState, useEffect, useRef } from 'react';
import { Map, ChevronDown, ChevronUp } from 'lucide-react';

/*
LiveMap Component
=================
Integrates Leaflet.js inside React to display an interactive street map.
- Responsive: Updates automatically when a new city is planned.
- Collapsible: Allows the user to toggle visibility to free up vertical space for the chatbot drawer.
- Cleanup: Properly removes Leaflet instances on unmount to prevent container reuse errors.
*/

export default function LiveMap({ latitude, longitude, cityName }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (isCollapsed || !latitude || !longitude || !mapRef.current) return;

    // Destruct existing map instance if it exists to prevent 'Map container is already initialized' error
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    if (window.L) {
      try {
        mapInstance.current = window.L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: false
        }).setView([latitude, longitude], 12);

        // Standard OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapInstance.current);

        // Drop a marker on the geocoded coordinates
        window.L.marker([latitude, longitude])
          .addTo(mapInstance.current)
          .bindPopup(`<b>${cityName}</b>`)
          .openPopup();
      } catch (error) {
        console.error("Leaflet initialization failed: ", error);
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [latitude, longitude, cityName, isCollapsed]);

  return (
    <div className="glass-panel widget-card" style={{ display: 'flex', flexDirection: 'column', gap: isCollapsed ? '0' : '0.75rem' }}>
      <h3 className="widget-title" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Map size={18} className="text-cyan-600" />
          Interactive Map
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '0.2rem',
            outline: 'none'
          }}
          title={isCollapsed ? "Expand Map" : "Collapse Map"}
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </h3>
      {!isCollapsed && (
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '220px', 
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(15, 23, 42, 0.08)'
          }}
        />
      )}
    </div>
  );
}
