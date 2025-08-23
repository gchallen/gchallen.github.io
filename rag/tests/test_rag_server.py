#!/usr/bin/env python3

"""
Tests for the RAG server endpoints.

Tests both semantic search and conversational RAG functionality.
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

# Add the parent directory to the path so we can import the modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from rag_server import app
from vector_db_builder import ProductionVectorDB
from citation_utils import extract_page_metadata, get_citation_url

class TestRAGServer:
    """Test suite for the RAG server."""
    
    @pytest.fixture(scope="class")
    def setup_test_env(self):
        """Set up test environment with vector database."""
        # Create temporary directories
        self.temp_dir = Path(tempfile.mkdtemp())
        self.html_dir = self.temp_dir / "html"
        self.vector_db_dir = self.temp_dir / "test_vector_db"
        
        print(f"Using temp directory: {self.temp_dir}")
        
        # Copy test HTML files
        test_html_dir = Path(__file__).parent.parent / "html"
        if test_html_dir.exists():
            shutil.copytree(test_html_dir, self.html_dir)
        else:
            # Create minimal test HTML if the real HTML doesn't exist
            self.html_dir.mkdir(parents=True)
            self.create_test_html_files()
        
        # Build vector database with test data
        builder = ProductionVectorDB()
        builder.build_database(str(self.html_dir), str(self.vector_db_dir))
        
        # Update the vector database path for the server
        os.environ['VECTOR_DB_PATH'] = str(self.vector_db_dir)
        
        yield
        
        # Cleanup
        shutil.rmtree(self.temp_dir)
    
    def create_test_html_files(self):
        """Create minimal test HTML files for testing."""
        # Test bio page
        bio_html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="source" content="mdx/bio.mdx">
    <meta name="title" content="Test Bio">
    <meta name="description" content="Test bio description">
    <meta name="url" content="bio">
</head>
<body>
    <h1>About Geoffrey Challen</h1>
    <p>Geoffrey Challen is a Teaching Professor at the University of Illinois who teaches programming and computer science.</p>
</body>
</html>"""
        
        # Test essay
        essay_html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="source" content="mdx/essays/test-essay.mdx">
    <meta name="title" content="Test Essay">
    <meta name="description" content="A test essay about education">
    <meta name="url" content="essays/test-essay">
</head>
<body>
    <h1>Teaching and Learning</h1>
    <p>Education is fundamental to society. Good teaching involves active learning and student engagement.</p>
    <p>Traditional lecturing is often ineffective for learning outcomes.</p>
</body>
</html>"""
        
        (self.html_dir / "bio.html").write_text(bio_html)
        
        essays_dir = self.html_dir / "essays"
        essays_dir.mkdir(parents=True)
        (essays_dir / "test-essay.html").write_text(essay_html)
    
    @pytest.fixture(scope="class")
    def client(self, setup_test_env):
        """Create test client for the FastAPI app."""
        # Mock the vector loader path
        import rag_server
        rag_server.vector_loader = None  # Force re-initialization
        
        with TestClient(app) as client:
            # Initialize services with test data
            rag_server.initialize_services()
            yield client
    
    def test_root_endpoint(self, client):
        """Test the root health check endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "status" in data
        assert data["status"] == "running"
    
    def test_semantic_search_basic(self, client):
        """Test basic semantic search functionality."""
        # Skip if no Azure OpenAI credentials
        if not os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT"):
            pytest.skip("No Azure OpenAI credentials for testing")
        
        search_request = {
            "query": "teaching programming",
            "k": 3
        }
        
        response = client.post("/search", json=search_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        assert "query" in data
        assert "timestamp" in data
        assert data["query"] == "teaching programming"
        assert len(data["results"]) <= 3
        
        # Check result structure
        if data["results"]:
            result = data["results"][0]
            assert "content" in result
            assert "citation_url" in result
    
    def test_semantic_search_empty_results(self, client):
        """Test search with query that should return no results."""
        # Skip if no Azure OpenAI credentials
        if not os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT"):
            pytest.skip("No Azure OpenAI credentials for testing")
        
        search_request = {
            "query": "quantum physics molecular biology astronomy",
            "k": 5
        }
        
        response = client.post("/search", json=search_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        # Results may still be returned due to semantic similarity
    
    def test_chat_basic(self, client):
        """Test basic conversational RAG."""
        # Skip if no Azure OpenAI credentials
        if not all([
            os.getenv("AZURE_OPENAI_CHAT_ENDPOINT"),
            os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
        ]):
            pytest.skip("No Azure OpenAI credentials for testing")
        
        chat_request = {
            "message": "What do you teach?",
            "session_id": "test_session_1"
        }
        
        response = client.post("/chat", json=chat_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert "timestamp" in data
        assert "sources" in data
        assert data["session_id"] == "test_session_1"
        
        # Check sources structure
        if data["sources"]:
            source = data["sources"][0]
            assert "url" in source
            assert "title" in source
            assert "content_preview" in source
    
    def test_chat_with_history(self, client):
        """Test conversational RAG with message history."""
        # Skip if no Azure OpenAI credentials
        if not all([
            os.getenv("AZURE_OPENAI_CHAT_ENDPOINT"),
            os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
        ]):
            pytest.skip("No Azure OpenAI credentials for testing")
        
        # First message
        chat_request = {
            "message": "Tell me about your teaching philosophy",
            "session_id": "test_session_2"
        }
        
        response1 = client.post("/chat", json=chat_request)
        assert response1.status_code == 200
        first_response = response1.json()["response"]
        
        # Follow-up message with context
        chat_request2 = {
            "message": "What specific techniques do you use?",
            "session_id": "test_session_2",
            "history": [
                {"role": "user", "content": "Tell me about your teaching philosophy"},
                {"role": "assistant", "content": first_response}
            ]
        }
        
        response2 = client.post("/chat", json=chat_request2)
        assert response2.status_code == 200
        
        data2 = response2.json()
        assert "response" in data2
        assert data2["session_id"] == "test_session_2"
    
    def test_session_history(self, client):
        """Test session history retrieval."""
        session_id = "test_session_3"
        
        # Send a message to create history
        if all([
            os.getenv("AZURE_OPENAI_CHAT_ENDPOINT"),
            os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
        ]):
            chat_request = {
                "message": "Hello, what do you do?",
                "session_id": session_id
            }
            client.post("/chat", json=chat_request)
        
        # Get session history
        response = client.get(f"/sessions/{session_id}/history")
        assert response.status_code == 200
        
        data = response.json()
        assert "session_id" in data
        assert "history" in data
        assert data["session_id"] == session_id
    
    def test_clear_session(self, client):
        """Test session clearing."""
        session_id = "test_session_4"
        
        # Create some history first
        if all([
            os.getenv("AZURE_OPENAI_CHAT_ENDPOINT"),
            os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
        ]):
            chat_request = {
                "message": "Test message",
                "session_id": session_id
            }
            client.post("/chat", json=chat_request)
        
        # Clear the session
        response = client.delete(f"/sessions/{session_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_search_validation(self, client):
        """Test request validation for search endpoint."""
        # Empty query should still work
        response = client.post("/search", json={"query": ""})
        assert response.status_code in [200, 422]  # Either works or validation error
        
        # Missing query
        response = client.post("/search", json={})
        assert response.status_code == 422
    
    def test_chat_validation(self, client):
        """Test request validation for chat endpoint."""
        # Missing message
        response = client.post("/chat", json={})
        assert response.status_code == 422
        
        # Empty message should still work
        response = client.post("/chat", json={"message": ""})
        if all([
            os.getenv("AZURE_OPENAI_CHAT_ENDPOINT"),
            os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
        ]):
            assert response.status_code == 200
        else:
            assert response.status_code == 500  # Service not initialized

# Test running
if __name__ == "__main__":
    # Install dependencies if running directly
    os.system("pip install httpx")
    
    # Run tests
    pytest.main([__file__, "-v"])