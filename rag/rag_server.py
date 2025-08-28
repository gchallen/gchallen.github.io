#!/usr/bin/env python3

"""
RAG Server with semantic search and conversational capabilities.

Provides two main endpoints:
1. /search - Semantic search over the vector database
2. /chat - Conversational RAG with memory and context awareness
"""

import os
import logging
import time
import threading
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import slowapi
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
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


# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)

# Global variables
app = FastAPI(
    title="Geoffrey Challen RAG Server",
    description="Semantic search and conversational AI for geoffreychallen.com",
    version="1.0.0",
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware for web access - secured for production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://geoffreychallen.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('rag_server.log', mode='a')
    ]
)
logger = logging.getLogger(__name__)

# Global instances
vector_loader: Optional[ProductionVectorLoader] = None
chat_model: Optional[AzureChatOpenAI] = None
embeddings: Optional[AzureOpenAIEmbeddings] = None
conversation_histories: Dict[str, List[HumanMessage | AIMessage]] = {}
session_timestamps: Dict[str, datetime] = {}  # Track when sessions were last accessed
cleanup_lock = threading.Lock()

# Configuration
MAX_CONVERSATION_HISTORY = 20  # Max messages per session
SESSION_TIMEOUT_HOURS = 24     # Clean up sessions after 24 hours
CLEANUP_INTERVAL_MINUTES = 60  # Run cleanup every hour


def extract_azure_config(endpoint_url: str):
    """Extract Azure OpenAI configuration from endpoint URL."""
    import re

    # Extract base endpoint (remove /openai/deployments/... part)
    base_match = re.match(r"(https://[^/]+)", endpoint_url)
    if not base_match:
        raise ValueError(f"Invalid endpoint URL: {endpoint_url}")
    base_endpoint = base_match.group(1)

    # Extract deployment name
    deployment_match = re.search(r"/deployments/([^/]+)/", endpoint_url)
    if not deployment_match:
        raise ValueError(f"Could not extract deployment from URL: {endpoint_url}")
    deployment = deployment_match.group(1)

    # Extract API version
    api_version_match = re.search(r"api-version=([^&]+)", endpoint_url)
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
    chat_base_endpoint, chat_deployment, chat_api_version = extract_azure_config(
        chat_endpoint
    )

    # Parse embeddings configuration
    embeddings_base_endpoint, embeddings_deployment, embeddings_api_version = (
        extract_azure_config(embeddings_endpoint)
    )

    # Initialize Azure OpenAI services
    chat_model = AzureChatOpenAI(
        azure_endpoint=chat_base_endpoint,
        api_key=chat_api_key,
        api_version=chat_api_version,
        azure_deployment=chat_deployment,
        temperature=0.1,
        max_tokens=1000,
    )

    embeddings = AzureOpenAIEmbeddings(
        azure_endpoint=embeddings_base_endpoint,
        api_key=embeddings_api_key,
        api_version=embeddings_api_version,
        azure_deployment=embeddings_deployment,
    )
    print("✅ Azure OpenAI services initialized")


def cleanup_old_sessions():
    """Clean up old conversation sessions to prevent memory leaks."""
    with cleanup_lock:
        current_time = datetime.now()
        cutoff_time = current_time - timedelta(hours=SESSION_TIMEOUT_HOURS)
        
        sessions_to_remove = []
        for session_id, last_access in session_timestamps.items():
            if last_access < cutoff_time:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            conversation_histories.pop(session_id, None)
            session_timestamps.pop(session_id, None)
        
        if sessions_to_remove:
            logger.info(f"Cleaned up {len(sessions_to_remove)} old conversation sessions")


def get_conversation_history(session_id: str) -> List[HumanMessage | AIMessage]:
    """Get conversation history for a session."""
    # Update last access time
    session_timestamps[session_id] = datetime.now()
    
    if session_id not in conversation_histories:
        conversation_histories[session_id] = []
    
    history = conversation_histories[session_id]
    
    # Limit conversation history to prevent memory issues
    if len(history) > MAX_CONVERSATION_HISTORY:
        # Keep the most recent messages
        conversation_histories[session_id] = history[-MAX_CONVERSATION_HISTORY:]
        logger.info(f"Trimmed conversation history for session {session_id} to {MAX_CONVERSATION_HISTORY} messages")
        return conversation_histories[session_id]
    
    return history


def add_to_conversation_history(session_id: str, message: HumanMessage | AIMessage):
    """Add a message to conversation history and trim to keep window size."""
    # Update last access time
    session_timestamps[session_id] = datetime.now()
    
    if session_id not in conversation_histories:
        conversation_histories[session_id] = []

    conversation_histories[session_id].append(message)

    # Trim to keep only the configured maximum messages
    if len(conversation_histories[session_id]) > MAX_CONVERSATION_HISTORY:
        conversation_histories[session_id] = conversation_histories[session_id][-MAX_CONVERSATION_HISTORY:]


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
    pronouns = [
        "it",
        "this",
        "that",
        "they",
        "them",
        "he",
        "she",
        "his",
        "her",
        "their",
    ]
    if len(message.split()) <= 3 or any(
        pronoun in message.lower() for pronoun in pronouns
    ):
        return f"Previous context: {context}\n\nCurrent question: {message}"
    else:
        return message


async def retry_with_backoff(func, max_retries=3, base_delay=1.0, max_delay=30.0):
    """Retry a function with exponential backoff for transient failures."""
    for attempt in range(max_retries):
        try:
            if asyncio.iscoroutinefunction(func):
                return await func()
            else:
                return func()
        except Exception as e:
            error_str = str(e).lower()
            
            # Check if this is a retryable error
            is_retryable = (
                "rate limit" in error_str or
                "429" in error_str or
                "timeout" in error_str or
                "connection" in error_str or
                "temporary" in error_str or
                "throttl" in error_str
            )
            
            if not is_retryable or attempt == max_retries - 1:
                # Don't retry on non-retryable errors or last attempt
                raise e
            
            # Calculate delay with exponential backoff
            delay = min(base_delay * (2 ** attempt), max_delay)
            logger.warning(f"Retryable error on attempt {attempt + 1}/{max_retries}: {e}. Retrying in {delay:.1f}s...")
            
            await asyncio.sleep(delay)
    
    # This shouldn't be reached, but just in case
    raise Exception("Max retries exceeded")


def start_cleanup_task():
    """Start the background cleanup task."""
    import threading
    import time
    
    def cleanup_worker():
        while True:
            try:
                cleanup_old_sessions()
                time.sleep(CLEANUP_INTERVAL_MINUTES * 60)  # Convert minutes to seconds
            except Exception as e:
                logger.error(f"Error in cleanup worker: {e}")
                time.sleep(60)  # Wait 1 minute before retrying
    
    cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
    cleanup_thread.start()
    logger.info(f"Started background cleanup task (interval: {CLEANUP_INTERVAL_MINUTES} minutes)")


@app.on_event("startup")
async def startup_event():
    """Initialize services when the server starts."""
    try:
        initialize_services()
        start_cleanup_task()
    except Exception as e:
        print(f"❌ Failed to initialize services: {e}")
        raise


@app.get("/")
@limiter.limit("60/minute")  # Allow 60 health checks per minute
async def root(request: Request):
    """Health check endpoint."""
    logger.info("Health check requested")
    return {
        "message": "Geoffrey Challen RAG Server",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/search", response_model=SearchResponse)
@limiter.limit("30/minute")  # Allow 30 searches per minute per IP
async def semantic_search(request: Request, search_request: SearchRequest):
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
            search_request.query, k=search_request.k or 5, use_adaptive_threshold=True
        )

        return SearchResponse(
            results=results, query=search_request.query, timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")  # Allow 10 chat messages per minute per IP (reduced due to Azure rate limits)
async def conversational_rag(request: Request, chat_request: ChatRequest):
    """
    Conversational RAG with memory and context awareness.

    Maintains conversation history and provides contextually relevant responses.
    """
    start_time = time.time()
    logger.info(f"Chat request received - Session: {chat_request.session_id}, Message length: {len(chat_request.message)}")
    
    if not vector_loader or not chat_model:
        logger.error("RAG services not initialized")
        raise HTTPException(status_code=500, detail="RAG services not initialized")

    try:
        # Get conversation history for this session
        history_messages = get_conversation_history(chat_request.session_id)

        # Add history if provided (for session restoration)
        if chat_request.history:
            conversation_histories[chat_request.session_id] = []  # Clear existing history
            for msg in chat_request.history:
                if msg.role == "user":
                    add_to_conversation_history(
                        chat_request.session_id, HumanMessage(content=msg.content)
                    )
                elif msg.role == "assistant":
                    add_to_conversation_history(
                        chat_request.session_id, AIMessage(content=msg.content)
                    )
            # Refresh history after adding
            history_messages = get_conversation_history(chat_request.session_id)

        # Create context-aware search query
        search_query = create_context_aware_query(chat_request.message, chat_request.history)
        search_start = time.time()
        logger.info(f"Starting vector search for query: {search_query[:100]}...")

        # Retrieve relevant documents with adaptive filtering
        retrieved_docs = vector_loader.search(
            search_query, k=5, use_adaptive_threshold=True
        )
        search_time = time.time() - search_start
        logger.info(f"Vector search completed in {search_time:.2f}s, found {len(retrieved_docs)} documents")

        # Check if any relevant documents were found
        if not retrieved_docs:
            # No relevant documents found - refuse to answer
            refusal_response = "I don't have enough relevant information in my knowledge base to answer that question confidently. Could you try asking about something more specific related to my teaching, research, or work at the University of Illinois?"

            # Still add to conversation history for continuity
            add_to_conversation_history(
                chat_request.session_id, HumanMessage(content=chat_request.message)
            )
            add_to_conversation_history(
                chat_request.session_id, AIMessage(content=refusal_response)
            )

            return ChatResponse(
                response=refusal_response,
                session_id=chat_request.session_id,
                timestamp=datetime.now().isoformat(),
                sources=[],
            )

        # Build context from retrieved documents
        context_parts = []
        for doc in retrieved_docs:
            context_parts.append(f"From {doc['citation_url']}: {doc['content']}")
        context = "\n\n".join(context_parts)

        # Create the prompt template
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are Geoffrey Challen, a Teaching Professor at the University of Illinois. You're answering questions about your work, teaching, and thoughts based ONLY on your website content provided below.

IMPORTANT: Only use information from the context provided. Do not add information from your general knowledge or make assumptions beyond what's in the context. If the context doesn't fully answer the question, acknowledge the limitations.

Be conversational and engaging, as if you're speaking directly to the person asking. Reference specific details from the context when relevant, and feel free to connect ideas across different parts of your work.

Context from your website:
{context}""",
                ),
                MessagesPlaceholder(variable_name="history"),
                ("human", "{question}"),
            ]
        )

        # Use the conversation history we already retrieved

        # Create the chain
        chain = (
            {
                "context": lambda x: context,
                "question": RunnablePassthrough(),
                "history": lambda x: history_messages,
            }
            | prompt
            | chat_model
            | StrOutputParser()
        )

        # Generate response with retry logic
        llm_start = time.time()
        logger.info("Starting LLM generation...")
        
        async def llm_call():
            return chain.invoke(chat_request.message)
        
        response = await retry_with_backoff(llm_call, max_retries=3, base_delay=2.0)
        llm_time = time.time() - llm_start
        logger.info(f"LLM generation completed in {llm_time:.2f}s, response length: {len(response)}")

        # Add to conversation history
        add_to_conversation_history(
            chat_request.session_id, HumanMessage(content=chat_request.message)
        )
        add_to_conversation_history(chat_request.session_id, AIMessage(content=response))

        # Extract source information
        sources = []
        for doc in retrieved_docs:
            # Use page_title from the enhanced search results
            title = doc.get("page_title", "").strip()
            if not title:
                title = doc.get("title", "Website Content").strip()

            sources.append(
                {
                    "url": doc["citation_url"],
                    "title": title,
                    "content_preview": doc["content"][:200] + "..."
                    if len(doc["content"]) > 200
                    else doc["content"],
                    "content_full": doc["content"],  # Full content for text fragments
                    "similarity_score": doc.get(
                        "score", 0.0
                    ),  # Include similarity score for debugging
                }
            )

        total_time = time.time() - start_time
        logger.info(f"Chat request completed in {total_time:.2f}s total (search: {search_time:.2f}s, LLM: {llm_time:.2f}s)")
        
        return ChatResponse(
            response=response,
            session_id=chat_request.session_id,
            timestamp=datetime.now().isoformat(),
            sources=sources,
        )

    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"Chat request failed after {total_time:.2f}s - Session: {chat_request.session_id}, Error: {str(e)}", exc_info=True)
        
        # Check for specific Azure OpenAI errors
        error_message = str(e)
        if "429" in error_message or "rate limit" in error_message.lower():
            logger.warning(f"Rate limit detected: {error_message}")
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again in a moment.")
        elif "timeout" in error_message.lower():
            logger.warning(f"Timeout detected: {error_message}")
            raise HTTPException(status_code=504, detail="Request timed out. Please try again.")
        else:
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
