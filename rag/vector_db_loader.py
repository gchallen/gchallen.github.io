#!/usr/bin/env python3
"""
Production vector database loader for RAG system.
Loads pre-built vector database for fast runtime queries.
"""

import os
import json
import pickle
from pathlib import Path
from typing import List, Dict, Any
import numpy as np
import faiss
from dotenv import load_dotenv

from langchain_openai import AzureOpenAIEmbeddings

load_dotenv()

class ProductionVectorLoader:
    """Production vector database loader for runtime queries."""
    
    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.embeddings_model = None
        self.documents = []
        self.metadata = []
        self.index = None
        self.build_info = {}
        
        # Auto-load on initialization
        self._load_database()
        self._setup_embeddings()
    
    def _setup_embeddings(self):
        """Setup Azure OpenAI embeddings model."""
        embeddings_endpoint = os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
        embeddings_api_key = os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY")
        
        if not embeddings_endpoint or not embeddings_api_key:
            raise ValueError("Missing Azure OpenAI embeddings credentials")
            
        # Extract deployment info
        import re
        match = re.search(r'/deployments/([^/]+)/', embeddings_endpoint)
        deployment_name = match.group(1) if match else "text-embedding-3-large"
        base_url = embeddings_endpoint.split('/openai/')[0]
        api_version_match = re.search(r'api-version=([^&]+)', embeddings_endpoint)
        api_version = api_version_match.group(1) if api_version_match else "2023-05-15"
        
        self.embeddings_model = AzureOpenAIEmbeddings(
            azure_endpoint=base_url,
            azure_deployment=deployment_name,
            api_key=embeddings_api_key,
            api_version=api_version
        )
        
    def _load_database(self):
        """Load the pre-built vector database."""
        if not self.db_path.exists():
            raise FileNotFoundError(f"Vector database not found at {self.db_path}")
            
        # Load FAISS index
        index_path = self.db_path / "vector.index"
        if not index_path.exists():
            raise FileNotFoundError(f"FAISS index not found at {index_path}")
        self.index = faiss.read_index(str(index_path))
        
        # Load metadata
        metadata_path = self.db_path / "metadata.json"
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
            
        # Load documents
        docs_path = self.db_path / "documents.pkl"
        with open(docs_path, 'rb') as f:
            self.documents = pickle.load(f)
            
        # Load build info if available
        info_path = self.db_path / "build_info.json"
        if info_path.exists():
            with open(info_path, 'r') as f:
                self.build_info = json.load(f)
        
        print(f"✅ Loaded production vector database:")
        print(f"   Documents: {len(self.documents)}")
        print(f"   Index vectors: {self.index.ntotal}")
        print(f"   Embedding dimension: {self.index.d}")
        
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        if self.index is None or self.embeddings_model is None:
            raise ValueError("Database not properly loaded")
            
        # Get query embedding
        query_embedding = np.array([self.embeddings_model.embed_query(query)], dtype=np.float32)
        faiss.normalize_L2(query_embedding)
        
        # Search
        scores, indices = self.index.search(query_embedding, k)
        
        # Format results with citation information
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents) and idx >= 0:  # Valid index
                result_meta = self.metadata[idx]
                results.append({
                    'score': float(score),
                    'content': self.documents[idx],
                    'metadata': result_meta,
                    'citation_url': result_meta.get('citation_url', ''),
                    'page_title': result_meta.get('page_title', ''),
                    'citation': f"{result_meta.get('page_title', 'Unknown')} ({result_meta.get('citation_url', 'Unknown URL')})"
                })
                
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        return {
            'total_documents': len(self.documents),
            'total_vectors': self.index.ntotal if self.index else 0,
            'embedding_dimension': self.index.d if self.index else 0,
            'database_path': str(self.db_path),
            **self.build_info
        }


# Convenience functions for easy integration

def load_vector_db(db_path: str = "vector_db") -> ProductionVectorLoader:
    """Load production vector database."""
    return ProductionVectorLoader(db_path)

def search_documents(query: str, db_path: str = "vector_db", k: int = 5) -> List[Dict[str, Any]]:
    """Quick search function."""
    loader = ProductionVectorLoader(db_path)
    return loader.search(query, k)


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python vector_db_loader.py 'search query'")
        sys.exit(1)
    
    query = sys.argv[1]
    db_path = sys.argv[2] if len(sys.argv) > 2 else "vector_db"
    
    print(f"Searching for: '{query}'")
    
    try:
        results = search_documents(query, db_path, k=3)
        
        for i, result in enumerate(results, 1):
            print(f"\nResult {i} (score: {result['score']:.3f}):")
            print(f"Citation: {result['citation']}")
            print(f"Content: {result['content'][:200]}...")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)