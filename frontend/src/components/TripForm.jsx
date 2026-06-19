import React from 'react';
import { Calendar, ShieldAlert } from 'lucide-react';

/*
TripForm Component
==================
Renders the form to customize the travel plan.
- Now with freeform city input and dynamic RAG guide status description.
- Removed the manual weather dropdown in favor of real-time API integrations.
- Minimalist, professional labels with no unnecessary emojis.
*/

export default function TripForm({
  cities,
  selectedCity,
  setSelectedCity,
  interests,
  setInterests,
  days,
  setDays,
  budget,
  setBudget,
  persona,
  setPersona,
  pace,
  setPace,
  onSubmit,
  loading,
  serverHealthy
}) {
  return (
    <div className="glass-panel planning-panel">
      <h2 className="panel-title">
        Configure Travel Planner
      </h2>

      {/* 1. Destination Input with Suggestions */}
      <div className="form-group">
        <label className="form-label">Destination City</label>
        <input
          type="text"
          className="text-input"
          placeholder="Enter any city (e.g. Darjeeling, London, Tokyo, Delhi...)"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        />
        
        {/* Quick Suggestion Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Suggested:</span>
          {cities.map((city) => (
            <button
              key={city.id}
              type="button"
              className="suggestion-pill"
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.7rem',
                border: selectedCity.toLowerCase() === city.name.toLowerCase() ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                background: selectedCity.toLowerCase() === city.name.toLowerCase() ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                color: selectedCity.toLowerCase() === city.name.toLowerCase() ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
              onClick={() => setSelectedCity(city.name)}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. City Guide Description Panel */}
      {selectedCity.trim() && (() => {
        const matchedCity = cities.find(c => c.name.toLowerCase() === selectedCity.trim().toLowerCase() || c.id.toLowerCase() === selectedCity.trim().toLowerCase());
        if (matchedCity) {
          return (
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              background: 'rgba(8, 145, 178, 0.05)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '2px solid var(--accent-cyan)'
            }}>
              <strong>Premium RAG Active:</strong> {matchedCity.description}
            </div>
          );
        } else {
          return (
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              background: 'rgba(15, 23, 42, 0.02)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '2px solid var(--text-muted)'
            }}>
              <strong>General Knowledge Mode:</strong> Chatbot will use the general knowledge base (No local guide document available for "{selectedCity}").
            </div>
          );
        }
      })()}

      {/* 3. Interests Input */}
      <div className="form-group">
        <label className="form-label">Interests (comma separated)</label>
        <input
          type="text"
          className="text-input"
          placeholder="e.g. food, history, nightlife, parks"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
        />
      </div>

      {/* 4. Duration Slider */}
      <div className="form-group">
        <label className="form-label">Trip Duration (Days)</label>
        <div className="slider-container">
          <input
            type="range"
            min="1"
            max="7"
            step="1"
            className="slider-input"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
          />
          <span className="slider-val">{days}</span>
        </div>
      </div>

      {/* 5. Travel Persona Selection */}
      <div className="form-group">
        <label className="form-label">Travel Persona</label>
        <select
          className="select-input"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
        >
          <option value="Solo">Solo Traveler</option>
          <option value="Couple">Couple Trip</option>
          <option value="Family">Family Vacation</option>
          <option value="Friends">Group Travel</option>
        </select>
      </div>

      {/* 6. Travel Pace Buttons */}
      <div className="form-group">
        <label className="form-label">Travel Pace</label>
        <div className="options-grid">
          {['Relaxed', 'Balanced', 'Fast'].map((p) => (
            <button
              key={p}
              type="button"
              className={`option-button-card ${pace === p ? 'active' : ''}`}
              onClick={() => setPace(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 7. Budget Buttons */}
      <div className="form-group">
        <label className="form-label">Budget Level</label>
        <div className="options-grid">
          {['Budget', 'Mid-range', 'Luxury'].map((b) => (
            <button
              key={b}
              type="button"
              className={`option-button-card ${budget === b ? 'active' : ''}`}
              onClick={() => setBudget(b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Server Health Warning */}
      {!serverHealthy && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#dc2626',
          padding: '0.5rem',
          borderRadius: 'var(--radius-sm)'
        }}>
          <ShieldAlert size={16} />
          <span>Backend offline or API key unconfigured</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        className="submit-btn"
        onClick={onSubmit}
        disabled={loading || !selectedCity.trim() || !interests.trim()}
      >
        {loading ? (
          <>Generating Plan...</>
        ) : (
          <>
            <Calendar size={18} />
            Generate Trip Plan
          </>
        )}
      </button>
    </div>
  );
}
