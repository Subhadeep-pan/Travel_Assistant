# ✈️ AeroTrip AI – Intelligent Travel Planner

<p align="center">
  <img src="frontend/src/assets/hero.png" width="800" alt="AeroTrip AI Banner"/>
</p>

<p align="center">
  <b>AI-Powered Travel Planning Platform built with React, FastAPI, RAG, and Groq LLM.</b>
</p>

<p align="center">
  Generate personalized itineraries, explore destinations, chat with an AI travel assistant, view live weather forecasts, and discover local travel insights through Retrieval-Augmented Generation (RAG).
</p>

---

## 🌟 Overview

AeroTrip AI is a modern full-stack travel planning platform that combines Artificial Intelligence, Retrieval-Augmented Generation (RAG), live weather intelligence, and interactive mapping to create personalized travel experiences.

Instead of offering generic recommendations, AeroTrip AI generates dynamic itineraries tailored to:

* Destination
* Budget
* Travel Style
* Travel Pace
* Personal Interests
* Weather Conditions

The platform also includes an AI Travel Copilot capable of answering trip-related questions using both a curated travel knowledge base and LLM-powered reasoning.

---

## 🚀 Key Features

### 🧠 AI-Powered Trip Planning

Generate detailed day-by-day itineraries using Groq LLM.

* Morning plans
* Afternoon activities
* Evening recommendations
* Food & restaurant suggestions
* Transportation guidance

---

### 📚 Retrieval-Augmented Generation (RAG)

Built-in travel knowledge base for multiple Indian cities.

Supported Cities:

* Kolkata
* Delhi
* Mumbai
* Bengaluru
* Jaipur

The chatbot retrieves relevant travel information before generating answers, improving factual accuracy and local relevance.

---

### 🤖 AI Travel Copilot

Interactive conversational assistant that can:

* Explain itinerary details
* Suggest attractions
* Recommend local food
* Answer travel questions
* Provide destination insights

---

### 🌦 Live Weather Intelligence

Real-time weather integration using Open-Meteo APIs.

Features:

* Current temperature
* Weather conditions
* Multi-day forecast
* Weather-aware itinerary recommendations

---

### 🗺 Interactive Maps

Integrated Leaflet maps provide:

* Destination visualization
* Geographic exploration
* Better trip planning experience

---

### 🎯 Personalized Travel Profiles

Supports multiple traveler personas:

* Solo Traveler
* Family Traveler
* Explorer
* Leisure Traveler

Travel pace options:

* Relaxed
* Balanced
* Fast-Paced

Budget options:

* Budget
* Mid-Range
* Luxury

---

## 🏗 Architecture

```text
React Frontend
       │
       ▼
FastAPI Backend
       │
       ├── Groq LLM
       ├── RAG Engine
       ├── Open-Meteo API
       └── Travel Knowledge Base
```

---

## 🛠 Tech Stack

### Frontend

* React.js
* Vite
* CSS3
* Leaflet Maps
* Lucide React Icons

### Backend

* FastAPI
* Python
* LangChain
* Groq API
* Pydantic

### AI & RAG

* Groq LLM
* LangChain
* Custom TF-IDF Retrieval Engine
* Retrieval-Augmented Generation

### External APIs

* Open-Meteo Weather API
* Open-Meteo Geocoding API

---

## 📂 Project Structure

```text
Ai_Trip_Planer/
│
├── backend/
│   ├── chatbot.py
│   ├── planner.py
│   ├── rag_engine.py
│   ├── main.py
│   └── data/
│       ├── kolkata.md
│       ├── delhi.md
│       ├── mumbai.md
│       ├── bengaluru.md
│       └── jaipur.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── assets/
│   │
│   └── package.json
│
└── .env
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/AeroTrip-AI.git
cd AeroTrip-AI
```

### Backend Setup

```bash
pip install -r requirements.txt
```

Create `.env`

```env
GROQ_API_KEY=your_groq_api_key
```

Start Backend

```bash
uvicorn backend.main:app --reload
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔥 Example Workflow

1. Select a city
2. Choose travel interests
3. Set budget
4. Choose travel pace
5. Generate itinerary
6. View weather forecast
7. Explore map
8. Chat with AI Travel Copilot

---

## 🎓 What I Learned

This project helped strengthen skills in:

* Full Stack Development
* FastAPI
* React
* REST APIs
* AI Integration
* Retrieval-Augmented Generation
* LangChain
* Prompt Engineering
* API Integration
* Software Architecture

---

## 🚀 Future Enhancements

* Multi-City Trip Planning
* Hotel Recommendations
* Flight Search Integration
* User Authentication
* Saved Trips
* PDF Itinerary Export
* Voice Assistant
* Vector Database Integration
* Real-Time Travel Alerts

---

## 👨‍💻 Author

**Subhadeep Pan**

Computer Science Engineering Student

Passionate about AI, Full Stack Development, RAG Systems, and Intelligent Applications.

---

⭐ If you found this project useful, consider giving it a star.
