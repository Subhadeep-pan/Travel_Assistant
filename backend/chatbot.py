import os
from typing import List, Dict, Tuple
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from backend.rag_engine import SimpleTFIDFRetriever

"""
RAG Chatbot Module
==================
This module implements the chatbot conversation with Retrieval-Augmented Generation (RAG).

How it answers queries:
1. RAG Retrieval: It queries the `SimpleTFIDFRetriever` to fetch relevant paragraphs
   from the markdown city guide corresponding to the target city.
2. Contextual Prompt: It creates a system prompt containing:
   - The generated itinerary (the user's actual trip).
   - The retrieved travel guide chunks (the local knowledge base).
3. Groq Call: It sends the context, chat history, and new query to the Groq model.
4. UI Feedback: It returns the answer and the raw sources so the frontend can
   display expandable citation cards!
"""

# Initialize the RAG Retriever
# Assumes data is stored in 'backend/data/' relative to the project root
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
retriever = SimpleTFIDFRetriever(data_dir=DATA_DIR)

def handle_chat_query(
    query: str,
    history: List[Dict[str, str]],
    city: str,
    itinerary: str
) -> Tuple[str, List[Dict[str, str]]]:
    """
    Handles a user's chatbot query, retrieves relevant RAG chunks,
    invokes Llama via Groq, and returns the response with source documents.
    """
    # 1. Fetch GROQ API key from environment
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is missing. Please set it in your terminal.")

    # 2. Retrieve top 3 relevant paragraphs from our city guide database
    # We filter by the current city (e.g. "kolkata", "delhi") to avoid getting tips for other cities
    retrieved_chunks = retriever.retrieve(query=query, city_filter=city, top_k=3)

    # 3. Format the retrieved text as context
    context_str = ""
    sources_to_return = []
    
    for i, chunk in enumerate(retrieved_chunks):
        context_str += f"\n[Document {i+1} (Source: {chunk['source']})]:\n{chunk['text']}\n"
        sources_to_return.append({
            "text": chunk["text"],
            "source": chunk["source"]
        })

    # 4. Build the RAG system prompt
    system_prompt = f"""
You are an expert, local AI Travel Co-Pilot. You are helping the user refine their travel plan and answer questions about their trip to {city}.

Here is the current Generated Itinerary for their trip:
---
{itinerary}
---

Here is official travel guide information (RAG Context) retrieved from our local database:
---
{context_str if context_str else "No additional local guides found for this query."}
---

Guidelines:
1. Answer the user's question accurately using the Current Itinerary and the retrieved RAG Context (if relevant).
2. If the retrieved RAG Context does not contain the answer, or is empty, use your own extensive, built-in travel knowledge about {city} to answer the query. Do not limit yourself strictly to the context for general city questions.
3. If the user asks to modify their itinerary (e.g. "Add a restaurant to Day 1" or "Make Day 2 more relaxed"), revise the requested day's itinerary clearly and print the updated day.
4. Be polite, direct, and concise. Avoid typical conversational AI filler intros (like "Sure, I can help you with that!" or "Here is what you requested:") and do not use excessive emojis. Speak like an experienced local guide.
5. If the user asks questions completely unrelated to travel or the city of {city}, politely guide them back to their trip planner.
"""

    # 5. Format Chat History into LangChain messages
    messages = [SystemMessage(content=system_prompt)]
    
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    # Append the current query
    messages.append(HumanMessage(content=query))

    # 6. Call Groq
    llm = ChatGroq(
        temperature=0.5,
        groq_api_key=api_key,
        model_name="llama-3.3-70b-versatile"
    )

    response = llm.invoke(messages)
    
    return response.content, sources_to_return
