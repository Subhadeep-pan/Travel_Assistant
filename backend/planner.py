import os
from typing import List, TypedDict, Annotated
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

"""
Trip Planner Module
===================
This module integrates with the Groq API to generate highly personalized travel itineraries.
It reads the `GROQ_API_KEY` from your environment variables.
"""

# Define the state dictionary structure to keep the code clear
class PlannerState(TypedDict):
    city: str
    interests: List[str]
    weather: str
    budget: str
    days: int
    persona: str
    pace: str

# Create the Travel Agent prompt template
itinerary_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
You are a senior local travel planner in India with deep real-world experience.

Create a detailed, day-by-day travel itinerary for {city} for a duration of {days} days.

User Profile & Preferences:
- Interests: {interests}
- Expected Weather: {weather}
- Budget Level: {budget}
- Travel Persona: {persona}
- Travel Pace: {pace}

Rules:
1. Split the itinerary DAY-WISE (e.g. Day 1, Day 2).
2. For each day, divide activities into: Morning, Afternoon, Evening, and Dining/Snack stops.
3. Keep the locations geographically grouped (suggest places close to each other on the same day).
4. Recommend actual local spots, street foods, and restaurants.
5. Adapt the intensity (number of spots) to match the Travel Pace ({pace}).
6. Write in clean, professional, and readable Markdown. Do not use excessive emojis or symbols; keep it structured, concise, and realistic (as if written by a human tour guide).
7. Be practical, realistic, and include transit tips between spots (e.g. "Take Delhi Metro" or "Walk 10 mins").
"""
    ),
    ("human", "Generate my personalized travel plan for {city}.")
])

def enrich_interests(interests: List[str], weather: str, persona: str) -> List[str]:
    """
    Enriches the user's interests list based on weather and travel persona.
    For example, if it's rainy, we add indoor activities.
    """
    enriched = list(interests)
    
    if weather.lower() == "rainy":
        enriched.append("indoor attractions, museums, covered markets")
    elif weather.lower() == "hot":
        enriched.append("indoor air-conditioned places, early morning tours, evening walks")
        
    if persona.lower() == "family":
        enriched.append("kid-friendly places, parks, safe dining options")
    elif persona.lower() == "solo":
        enriched.append("backpacking-friendly spots, local culture, public transit, social spots")
        
    return enriched

def generate_itinerary(city: str, interests_str: str, days: int, weather: str, budget: str, persona: str, pace: str) -> str:
    """
    Validates inputs and calls the Groq LLM to generate the itinerary.
    """
    # 1. Check if the Groq API Key is set in the environment variables
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is missing. Please set it in your terminal before running.")

    # 2. Parse interests from comma-separated string
    parsed_interests = [i.strip() for i in interests_str.split(",") if i.strip()]
    if not parsed_interests:
        raise ValueError("Please provide at least one interest.")

    # 3. Enrich interests based on weather and persona
    enriched = enrich_interests(parsed_interests, weather, persona)

    # 4. Initialize the Groq LLM model
    # We use llama-3.3-70b-versatile, which is fast and smart
    llm = ChatGroq(
        temperature=0.4,
        groq_api_key=api_key,
        model_name="llama-3.3-70b-versatile"
    )

    # 5. Format the prompt and invoke the model
    formatted_messages = itinerary_prompt.format_messages(
        city=city.strip(),
        interests=", ".join(enriched),
        weather=weather,
        budget=budget,
        days=days,
        persona=persona,
        pace=pace
    )

    response = llm.invoke(formatted_messages)
    return response.content
