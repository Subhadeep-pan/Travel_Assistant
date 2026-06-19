import os
import sys
import json
import urllib.request
import urllib.parse
from typing import List, Dict

# Ensure parent directory is in sys.path so backend imports resolve correctly
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from backend.planner import generate_itinerary
from backend.chatbot import handle_chat_query

# Load .env file manually if it exists in the root folder (parent of backend/)
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

"""
FastAPI Server Entrypoint
=========================
Coordinates API routing and integrates geocoding/weather microservices.
"""

app = FastAPI(title="AeroTrip AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("FastAPI Validation Error:", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

def fetch_live_weather(city_name: str) -> Dict:
    """
    Looks up city coordinates using Open-Meteo Geocoding, 
    then retrieves the live weather and a 3-day forecast.
    """
    try:
        # 1. Geocode City Name -> Lat, Lon
        encoded_city = urllib.parse.quote(city_name.strip())
        geocode_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_city}&count=1&language=en&format=json"
        
        req = urllib.request.Request(geocode_url, headers={'User-Agent': 'AeroTripBackend/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            
        if not data.get("results"):
            return None
            
        result = data["results"][0]
        lat = result["latitude"]
        lon = result["longitude"]
        full_name = f"{result.get('name')}, {result.get('country', '')}"
        
        # 2. Fetch Forecast Data using Coordinates
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto"
        req_w = urllib.request.Request(weather_url, headers={'User-Agent': 'AeroTripBackend/1.0'})
        with urllib.request.urlopen(req_w, timeout=5) as response:
            w_data = json.loads(response.read().decode('utf-8'))
            
        current = w_data.get("current_weather", {})
        daily = w_data.get("daily", {})
        
        # Open-Meteo Weather Codes
        weather_codes = {
            0: "Sunny", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
            45: "Foggy", 48: "Depositing Rime Fog",
            51: "Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
            61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
            71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
            80: "Slight Showers", 81: "Moderate Showers", 82: "Violent Showers",
            95: "Thunderstorm"
        }
        
        w_code = current.get("weathercode", current.get("weather_code", 0))
        current_condition = weather_codes.get(w_code, "Sunny")
        temp = current.get("temperature", 25.0)
        
        # Determine simple category for Llama planner prompt
        simple_weather = "Sunny"
        if w_code in [51, 53, 55, 61, 63, 65, 80, 81, 82, 95]:
            simple_weather = "Rainy"
        elif temp > 32:
            simple_weather = "Hot"
        elif temp < 15:
            simple_weather = "Cold"
            
        # Parse 3-day forecast
        forecast = []
        if "time" in daily:
            for i in range(min(3, len(daily["time"]))):
                day_code = daily["weather_code"][i] if "weather_code" in daily else daily.get("weathercode", [0])[i]
                forecast.append({
                    "date": daily["time"][i],
                    "temp_max": daily["temperature_2m_max"][i],
                    "temp_min": daily["temperature_2m_min"][i],
                    "condition": weather_codes.get(day_code, "Sunny")
                })
                
        return {
            "latitude": lat,
            "longitude": lon,
            "full_name": full_name,
            "current_temp": temp,
            "current_condition": current_condition,
            "simple_category": simple_weather,
            "forecast": forecast
        }
    except Exception as e:
        print(f"Error fetching live weather for '{city_name}': {str(e)}")
        return None

# Supported Indian Cities and their Metadata to render in the frontend
INDIAN_CITIES = [
    {
        "id": "kolkata",
        "name": "Kolkata",
        "tagline": "The City of Joy",
        "description": "Known for colonial architecture, hand-pulled trams, mouthwatering sweets (Rosogolla), and rich literary heritage.",
        "spots": ["Victoria Memorial", "Howrah Bridge", "Dakshineswar Temple", "Park Street"]
    },
    {
        "id": "delhi",
        "name": "Delhi",
        "tagline": "The Historic Capital",
        "description": "A massive metropolis combining the ancient heritage of Old Delhi bazaar lanes with the structured power of New Delhi.",
        "spots": ["Red Fort", "Qutub Minar", "India Gate", "Chandni Chowk"]
    },
    {
        "id": "mumbai",
        "name": "Mumbai",
        "tagline": "The City of Dreams",
        "description": "A fast-paced coastal city, home to Bollywood, the iconic local trains, Gateway of India, and vibrant marine drives.",
        "spots": ["Gateway of India", "Marine Drive", "Bandra-Worli Sea Link", "Colaba Causeway"]
    },
    {
        "id": "bengaluru",
        "name": "Bengaluru",
        "tagline": "The Silicon Valley",
        "description": "India's tech hub, famous for its perfect year-round weather, beautiful gardens, microbreweries, and cafe culture.",
        "spots": ["Cubbon Park", "Bangalore Palace", "Lalbagh", "Indiranagar Brewery District"]
    },
    {
        "id": "jaipur",
        "name": "Jaipur",
        "tagline": "The Pink City",
        "description": "The regal capital of Rajasthan, filled with massive hill forts, pink sandstone palaces, and bustling handicraft markets.",
        "spots": ["Hawa Mahal", "Amber Fort", "City Palace", "Jantar Mantar"]
    }
]

class PlanRequest(BaseModel):
    city: str
    interests: str
    days: int
    budget: str
    persona: str
    pace: str
    weather: str = None

class ChatRequest(BaseModel):
    query: str
    history: List[Dict[str, str]]
    city: str
    itinerary: str

@app.get("/api/cities")
def get_cities():
    """
    Returns the list of supported Indian cities with their descriptions and metadata.
    """
    return INDIAN_CITIES

@app.post("/api/plan")
def plan_trip(request: PlanRequest):
    """
    Generates a day-by-day travel itinerary using Groq, enriched with live weather forecasts.
    """
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY environment variable is not set on the backend server."
        )
        
    # Get live weather of the destination city
    weather_info = fetch_live_weather(request.city)
    
    # Fallback to Sunny if geocoding fails
    weather_category = "Sunny"
    if weather_info:
        weather_category = weather_info["simple_category"]
        
    try:
        itinerary = generate_itinerary(
            city=request.city,
            interests_str=request.interests,
            days=request.days,
            weather=weather_category,
            budget=request.budget,
            persona=request.persona,
            pace=request.pace
        )
        return {
            "itinerary": itinerary,
            "weather": weather_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat_about_trip(request: ChatRequest):
    """
    Answers questions about the trip using local RAG context.
    """
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY environment variable is not set on the backend server."
        )
        
    try:
        answer, sources = handle_chat_query(
            query=request.query,
            history=request.history,
            city=request.city,
            itinerary=request.itinerary
        )
        return {
            "answer": answer,
            "sources": sources
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health_check():
    """
    Verifies server and API key configuration status.
    """
    return {
        "status": "healthy",
        "groq_api_key_configured": os.getenv("GROQ_API_KEY") is not None
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting AeroTrip AI Backend server...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
