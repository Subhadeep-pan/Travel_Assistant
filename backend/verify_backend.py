import os
import sys

# Add the project root to python path so we can import 'backend'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def run_tests():
    print("====================================================")
    print("           RUNNING BACKEND UNIT TESTS               ")
    print("====================================================")

    # Test 1: Verify data guides exist
    print("Test 1: Verifying data files exist...")
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    required_cities = ["delhi.md", "kolkata.md", "mumbai.md", "bengaluru.md", "jaipur.md"]
    
    if not os.path.exists(data_dir):
        print(f"Failed: Data directory '{data_dir}' does not exist.")
        sys.exit(1)
        
    for city in required_cities:
        path = os.path.join(data_dir, city)
        if not os.path.exists(path):
            print(f"Failed: Required file '{city}' is missing.")
            sys.exit(1)
        print(f"  - Verified: {city}")
    print("[SUCCESS] Test 1 Passed: All city files exist.")
    print("-" * 50)

    # Test 2: Test TF-IDF tokenizer and document indexing
    print("Test 2: Initializing and testing RAG Retriever...")
    try:
        from backend.rag_engine import SimpleTFIDFRetriever
        retriever = SimpleTFIDFRetriever(data_dir=data_dir)
        
        if retriever.num_docs == 0:
            print("Failed: No documents were indexed.")
            sys.exit(1)
            
        print(f"  - Indexed {retriever.num_docs} chunks.")
        print(f"  - Vocabulary size: {len(retriever.vocabulary)} words.")
    except Exception as e:
        print(f"Failed: RAG retriever initialization failed. Error: {str(e)}")
        sys.exit(1)
    print("[SUCCESS] Test 2 Passed: RAG Retriever initialized and loaded documents.")
    print("-" * 50)

    # Test 3: Test RAG search retrieval accuracy
    print("Test 3: Testing retrieval matching...")
    try:
        # Search for sweet treats in Kolkata
        query = "sweets rosogolla"
        results = retriever.retrieve(query=query, city_filter="kolkata", top_k=2)
        
        if not results:
            print("Failed: Search returned no results.")
            sys.exit(1)
            
        print(f"  - Query: '{query}'")
        print(f"  - Top matched source: {results[0]['source']}")
        print(f"  - Snippet: {results[0]['text'][:80]}...")
        
        # Verify that filtering by Kolkata works and doesn't return Delhi documents
        assert "kolkata" in results[0]['source'].lower(), "Returned document from wrong city!"
    except Exception as e:
        print(f"Failed: Search retrieval test failed. Error: {str(e)}")
        sys.exit(1)
    print("[SUCCESS] Test 3 Passed: RAG retrieval successfully returned relevant documents.")
    print("-" * 50)

    # Test 4: Verify Planner and Chatbot modules load correctly
    print("Test 4: Verifying planner and chatbot module imports...")
    try:
        from backend.planner import enrich_interests
        from backend.chatbot import handle_chat_query
        
        # Test enrich_interests logic
        enriched = enrich_interests(["food"], "rainy", "solo")
        assert "indoor attractions, museums, covered markets" in enriched, "Rainy enrichment failed"
        assert "backpacking-friendly spots, local culture, public transit, social spots" in enriched, "Solo enrichment failed"
        print("  - Module imports and utility functions work.")
    except Exception as e:
        print(f"Failed: Module imports failed. Error: {str(e)}")
        sys.exit(1)
    print("[SUCCESS] Test 4 Passed: All modules imported and utilities verified.")
    print("-" * 50)

    # Test 5: Live Weather API integration
    print("Test 5: Testing Open-Meteo Weather API fetch...")
    try:
        from backend.main import fetch_live_weather
        weather_info = fetch_live_weather("Delhi")
        
        if not weather_info:
            print("Failed: Weather API lookup returned None.")
            sys.exit(1)
            
        print(f"  - Geocoded City: {weather_info['full_name']}")
        print(f"  - Coordinates: ({weather_info['latitude']}, {weather_info['longitude']})")
        print(f"  - Current Temp: {weather_info['current_temp']} C")
        print(f"  - Condition: {weather_info['current_condition']}")
        print(f"  - 3-day forecast details: {len(weather_info['forecast'])} days loaded.")
        
        assert weather_info['latitude'] > 0, "Invalid latitude returned!"
        assert len(weather_info['forecast']) > 0, "Forecast list empty!"
    except Exception as e:
        print(f"Failed: Weather API verification failed. Error: {str(e)}")
        sys.exit(1)
    print("[SUCCESS] Test 5 Passed: Live Weather API loaded coordinates and forecast.")
    
    print("====================================================")
    print("           ALL BACKEND TESTS PASSED                 ")
    print("====================================================")

if __name__ == "__main__":
    run_tests()
