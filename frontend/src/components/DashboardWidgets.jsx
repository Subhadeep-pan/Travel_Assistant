import React, { useState, useEffect } from 'react';
import { Briefcase, CreditCard, CloudSun, Calendar } from 'lucide-react';

/*
DashboardWidgets Component
==========================
Renders supplementary widgets:
1. Live Weather Forecast: Renders real-time Open-Meteo current temp and a 3-day forecast.
2. Packing Checklist: Auto-generates items based on current weather condition and persona.
3. Budget Breakdown: Calculates accommodation, food, transit, and sightseeing costs in INR.
*/

export default function DashboardWidgets({ days, budget, persona, weatherData }) {
  const [checklist, setChecklist] = useState([]);

  // Determine weather category to adjust packing list
  const weatherCategory = weatherData ? weatherData.simple_category : 'Sunny';

  // Generate packing list items dynamically based on weather and persona
  useEffect(() => {
    const items = [
      { id: '1', text: 'Identity cards and travel tickets', checked: false },
      { id: '2', text: 'Phone charger and power bank', checked: false },
      { id: '3', text: 'Basic toiletries and medicines', checked: false }
    ];

    if (weatherCategory === 'Rainy') {
      items.push({ id: 'w1', text: 'Umbrella or raincoat', checked: false });
      items.push({ id: 'w2', text: 'Water-resistant footwear', checked: false });
    } else if (weatherCategory === 'Sunny' || weatherCategory === 'Hot') {
      items.push({ id: 'w1', text: 'Sunglasses and sunscreen', checked: false });
      items.push({ id: 'w2', text: 'Reusable water bottle', checked: false });
    } else if (weatherCategory === 'Cold') {
      items.push({ id: 'w1', text: 'Thermal innerwear / Sweaters', checked: false });
      items.push({ id: 'w2', text: 'Lip balm and moisturizer', checked: false });
    }

    if (persona === 'Family') {
      items.push({ id: 'p1', text: 'First-aid kit and kids essentials', checked: false });
      items.push({ id: 'p2', text: 'Snacks for transit', checked: false });
    } else if (persona === 'Solo') {
      items.push({ id: 'p1', text: 'Compact daypack / backpack', checked: false });
      items.push({ id: 'p2', text: 'Emergency offline cash', checked: false });
    } else if (persona === 'Couple') {
      items.push({ id: 'p1', text: 'Camera or travel tripod', checked: false });
      items.push({ id: 'p2', text: 'Evening dinner outfits', checked: false });
    }

    setChecklist(items);
  }, [weatherCategory, persona]);

  const handleToggle = (id) => {
    setChecklist(prev =>
      prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  // Budget calculations (Daily rates in INR)
  const rates = {
    Budget: { hotel: 1500, food: 600, transport: 250, leisure: 400 },
    'Mid-range': { hotel: 4500, food: 1800, transport: 800, leisure: 1200 },
    Luxury: { hotel: 12000, food: 4500, transport: 2500, leisure: 5000 }
  };

  const currentRates = rates[budget] || rates['Mid-range'];
  const hotelTotal = currentRates.hotel * Math.max(1, days - 1);
  const foodTotal = currentRates.food * days;
  const transportTotal = currentRates.transport * days;
  const leisureTotal = currentRates.leisure * days;
  const grandTotal = hotelTotal + foodTotal + transportTotal + leisureTotal;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper to format date strings for forecast preview (e.g. 2026-06-11 -> Jun 11)
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="widgets-container">
      
      {/* 1. Live Weather Forecast Widget */}
      {weatherData && (
        <div className="glass-panel widget-card">
          <h3 className="widget-title">
            <CloudSun size={18} className="text-cyan-600" />
            Live Weather Conditions
          </h3>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(15, 23, 42, 0.05)'
          }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {Math.round(weatherData.current_temp)}°C
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {weatherData.current_condition}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              <strong>Location:</strong><br/>
              {weatherData.full_name}
            </div>
          </div>

          {/* 3-day forecast details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {weatherData.forecast.map((day, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '70px' }}>
                  <Calendar size={12} className="text-muted" />
                  <span>{formatDate(day.date)}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1, paddingLeft: '0.5rem' }}>
                  {day.condition}
                </span>
                <span style={{ fontWeight: 600 }}>
                  {Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°C
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Packing Checklist */}
      <div className="glass-panel widget-card">
        <h3 className="widget-title">
          <Briefcase size={18} className="text-purple-400" />
          Packing Checklist
        </h3>
        <div className="checklist-list">
          {checklist.map(item => (
            <label
              key={item.id}
              className={`checklist-item ${item.checked ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                className="checklist-checkbox"
                checked={item.checked}
                onChange={() => handleToggle(item.id)}
              />
              <span>{item.text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Estimated Budget breakdown */}
      <div className="glass-panel widget-card">
        <h3 className="widget-title">
          <CreditCard size={18} className="text-cyan-600" />
          Estimated Budget ({budget})
        </h3>
        <div className="budget-widget-list">
          <div className="budget-item">
            <span className="budget-item-label">Lodging ({Math.max(1, days - 1)} nights)</span>
            <span className="budget-item-value">{formatCurrency(hotelTotal)}</span>
          </div>
          <div className="budget-item">
            <span className="budget-item-label">Meals & Food ({days} days)</span>
            <span className="budget-item-value">{formatCurrency(foodTotal)}</span>
          </div>
          <div className="budget-item">
            <span className="budget-item-label">Local Transport</span>
            <span className="budget-item-value">{formatCurrency(transportTotal)}</span>
          </div>
          <div className="budget-item">
            <span className="budget-item-label">Sightseeing & Shopping</span>
            <span className="budget-item-value">{formatCurrency(leisureTotal)}</span>
          </div>
          <div className="budget-total">
            <span>Total Cost</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
        <p style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginTop: '0.75rem',
          textAlign: 'center'
        }}>
          *Estimated standard rates for tourist activities in India.
        </p>
      </div>
    </div>
  );
}
