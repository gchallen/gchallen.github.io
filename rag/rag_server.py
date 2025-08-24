#!/usr/bin/env python3

"""
RAG Server with semantic search and conversational capabilities.

Provides two main endpoints:
1. /search - Semantic search over the vector database
2. /chat - Conversational RAG with memory and context awareness
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.messages import HumanMessage, AIMessage, trim_messages
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from vector_db_loader import ProductionVectorLoader

# Request/Response models
class SearchRequest(BaseModel):
    query: str
    k: Optional[int] = 5

class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    query: str
    timestamp: str

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: str
    sources: List[Dict[str, Any]]

# Global variables
app = FastAPI(
    title="Geoffrey Challen RAG Server",
    description="Semantic search and conversational AI for geoffreychallen.com",
    version="1.0.0"
)

# CORS middleware for web access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
vector_loader: Optional[ProductionVectorLoader] = None
chat_model: Optional[AzureChatOpenAI] = None
embeddings: Optional[AzureOpenAIEmbeddings] = None
conversation_histories: Dict[str, List[HumanMessage | AIMessage]] = {}

def extract_azure_config(endpoint_url: str):
    """Extract Azure OpenAI configuration from endpoint URL."""
    import re
    
    # Extract base endpoint (remove /openai/deployments/... part)
    base_match = re.match(r'(https://[^/]+)', endpoint_url)
    if not base_match:
        raise ValueError(f"Invalid endpoint URL: {endpoint_url}")
    base_endpoint = base_match.group(1)
    
    # Extract deployment name
    deployment_match = re.search(r'/deployments/([^/]+)/', endpoint_url)
    if not deployment_match:
        raise ValueError(f"Could not extract deployment from URL: {endpoint_url}")
    deployment = deployment_match.group(1)
    
    # Extract API version
    api_version_match = re.search(r'api-version=([^&]+)', endpoint_url)
    api_version = api_version_match.group(1) if api_version_match else "2024-02-01"
    
    return base_endpoint, deployment, api_version

def initialize_services():
    """Initialize RAG services on startup."""
    global vector_loader, chat_model, embeddings
    
    # Load vector database
    vector_db_path = os.getenv("VECTOR_DB_PATH", "vector_db")
    vector_loader = ProductionVectorLoader(vector_db_path)
    print("✅ Vector database loaded")
    
    # Extract Azure OpenAI configuration from URLs
    chat_endpoint = os.getenv("AZURE_OPENAI_CHAT_ENDPOINT")
    chat_api_key = os.getenv("AZURE_OPENAI_CHAT_API_KEY")
    embeddings_endpoint = os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT") 
    embeddings_api_key = os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY")
    
    if not all([chat_endpoint, chat_api_key, embeddings_endpoint, embeddings_api_key]):
        raise ValueError("Missing required Azure OpenAI environment variables")
    
    # Parse chat configuration
    chat_base_endpoint, chat_deployment, chat_api_version = extract_azure_config(chat_endpoint)
    
    # Parse embeddings configuration  
    embeddings_base_endpoint, embeddings_deployment, embeddings_api_version = extract_azure_config(embeddings_endpoint)
    
    # Initialize Azure OpenAI services
    chat_model = AzureChatOpenAI(
        azure_endpoint=chat_base_endpoint,
        api_key=chat_api_key,
        api_version=chat_api_version,
        azure_deployment=chat_deployment,
        temperature=0.1,
        max_tokens=1000
    )
    
    embeddings = AzureOpenAIEmbeddings(
        azure_endpoint=embeddings_base_endpoint,
        api_key=embeddings_api_key,
        api_version=embeddings_api_version,
        azure_deployment=embeddings_deployment,
    )
    print("✅ Azure OpenAI services initialized")

def get_conversation_history(session_id: str) -> List[HumanMessage | AIMessage]:
    """Get conversation history for a session."""
    if session_id not in conversation_histories:
        conversation_histories[session_id] = []
    return conversation_histories[session_id]

def add_to_conversation_history(session_id: str, message: HumanMessage | AIMessage):
    """Add a message to conversation history and trim to keep window size."""
    if session_id not in conversation_histories:
        conversation_histories[session_id] = []
    
    conversation_histories[session_id].append(message)
    
    # Trim to keep only the last 20 messages (10 exchanges)
    conversation_histories[session_id] = trim_messages(
        conversation_histories[session_id],
        max_tokens=20,  # Keep last 20 messages (10 user + 10 assistant)
        strategy="last",
        token_counter=lambda msgs: len(msgs),
        start_on="human",
        allow_partial=False
    )

def create_context_aware_query(message: str, history: List[ChatMessage]) -> str:
    """Create a context-aware search query from the current message and history."""
    if not history:
        return message
    
    # Create a simple prompt to reformulate the query with context
    context_lines = []
    for msg in history[-4:]:  # Use last 4 messages for context
        role = "Human" if msg.role == "user" else "Assistant"
        context_lines.append(f"{role}: {msg.content}")
    
    context = "\n".join(context_lines)
    
    # For now, use a simple heuristic - if the message is very short or contains pronouns,
    # include more context. Otherwise, use the message as-is.
    pronouns = ["it", "this", "that", "they", "them", "he", "she", "his", "her", "their"]
    if len(message.split()) <= 3 or any(pronoun in message.lower() for pronoun in pronouns):
        return f"Previous context: {context}\n\nCurrent question: {message}"
    else:
        return message

@app.on_event("startup")
async def startup_event():
    """Initialize services when the server starts."""
    try:
        initialize_services()
    except Exception as e:
        print(f"❌ Failed to initialize services: {e}")
        raise

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Geoffrey Challen RAG Server", 
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """
    Perform semantic search over the knowledge base.
    
    Returns the most relevant documents without conversational context.
    Uses intelligent filtering based on similarity scores.
    """
    if not vector_loader:
        raise HTTPException(status_code=500, detail="Vector database not initialized")
    
    try:
        # Use adaptive search filtering
        results = vector_loader.search(
            request.query, 
            k=request.k or 5, 
            use_adaptive_threshold=True
        )
        
        return SearchResponse(
            results=results,
            query=request.query,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def conversational_rag(request: ChatRequest):
    """
    Conversational RAG with memory and context awareness.
    
    Maintains conversation history and provides contextually relevant responses.
    """
    if not vector_loader or not chat_model:
        raise HTTPException(status_code=500, detail="RAG services not initialized")
    
    try:
        # Get conversation history for this session
        history_messages = get_conversation_history(request.session_id)
        
        # Add history if provided (for session restoration)
        if request.history:
            conversation_histories[request.session_id] = []  # Clear existing history
            for msg in request.history:
                if msg.role == "user":
                    add_to_conversation_history(request.session_id, HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    add_to_conversation_history(request.session_id, AIMessage(content=msg.content))
            # Refresh history after adding
            history_messages = get_conversation_history(request.session_id)
        
        # Create context-aware search query
        search_query = create_context_aware_query(request.message, request.history)
        
        # Retrieve relevant documents with adaptive filtering
        retrieved_docs = vector_loader.search(search_query, k=5, use_adaptive_threshold=True)
        
        # Check if any relevant documents were found
        if not retrieved_docs:
            # No relevant documents found - refuse to answer
            refusal_response = "I don't have enough relevant information in my knowledge base to answer that question confidently. Could you try asking about something more specific related to my teaching, research, or work at the University of Illinois?"
            
            # Still add to conversation history for continuity
            add_to_conversation_history(request.session_id, HumanMessage(content=request.message))
            add_to_conversation_history(request.session_id, AIMessage(content=refusal_response))
            
            return ChatResponse(
                response=refusal_response,
                session_id=request.session_id,
                timestamp=datetime.now().isoformat(),
                sources=[]
            )
        
        # Build context from retrieved documents
        context_parts = []
        for doc in retrieved_docs:
            context_parts.append(f"From {doc['citation_url']}: {doc['content']}")
        context = "\n\n".join(context_parts)
        
        # Create the prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are Geoffrey Challen, a Teaching Professor at the University of Illinois. You're answering questions about your work, teaching, and thoughts based ONLY on your website content provided below.

IMPORTANT: Only use information from the context provided. Do not add information from your general knowledge or make assumptions beyond what's in the context. If the context doesn't fully answer the question, acknowledge the limitations.

Be conversational and engaging, as if you're speaking directly to the person asking. Reference specific details from the context when relevant, and feel free to connect ideas across different parts of your work.

Context from your website:
{context}"""),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{question}")
        ])
        
        # Use the conversation history we already retrieved
        
        # Create the chain
        chain = (
            {
                "context": lambda x: context,
                "question": RunnablePassthrough(),
                "history": lambda x: history_messages
            }
            | prompt
            | chat_model
            | StrOutputParser()
        )
        
        # Generate response
        response = chain.invoke(request.message)
        
        # Add to conversation history
        add_to_conversation_history(request.session_id, HumanMessage(content=request.message))
        add_to_conversation_history(request.session_id, AIMessage(content=response))
        
        # Extract source information
        sources = []
        for doc in retrieved_docs:
            # Use page_title from the enhanced search results
            title = doc.get("page_title", "").strip()
            if not title:
                title = doc.get("title", "Website Content").strip()
            
            sources.append({
                "url": doc["citation_url"],
                "title": title,
                "content_preview": doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"],
                "content_full": doc["content"],  # Full content for text fragments
                "similarity_score": doc.get("score", 0.0)  # Include similarity score for debugging
            })
        
        return ChatResponse(
            response=response,
            session_id=request.session_id,
            timestamp=datetime.now().isoformat(),
            sources=sources
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    """Get conversation history for a session."""
    if session_id not in conversation_histories:
        return {"session_id": session_id, "history": []}
    
    messages = []
    for msg in conversation_histories[session_id]:
        if isinstance(msg, HumanMessage):
            messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            messages.append({"role": "assistant", "content": msg.content})
    
    return {"session_id": session_id, "history": messages}

@app.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """Clear conversation history for a session."""
    if session_id in conversation_histories:
        conversation_histories[session_id] = []
        return {"message": f"Session {session_id} cleared"}
    else:
        return {"message": f"Session {session_id} not found"}

if __name__ == "__main__":
    import sys
    
    # Default configuration
    host = "127.0.0.1"
    port = 8000
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--production":
            host = "0.0.0.0"
            port = int(os.getenv("PORT", 8000))
    
    print(f"Starting RAG server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, reload=False, access_log=False)