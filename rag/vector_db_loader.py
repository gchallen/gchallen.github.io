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

        match = re.search(r"/deployments/([^/]+)/", embeddings_endpoint)
        deployment_name = match.group(1) if match else "text-embedding-3-large"
        base_url = embeddings_endpoint.split("/openai/")[0]
        api_version_match = re.search(r"api-version=([^&]+)", embeddings_endpoint)
        api_version = api_version_match.group(1) if api_version_match else "2023-05-15"

        self.embeddings_model = AzureOpenAIEmbeddings(
            azure_endpoint=base_url,
            azure_deployment=deployment_name,
            api_key=embeddings_api_key,
            api_version=api_version,
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
        with open(metadata_path, "r") as f:
            self.metadata = json.load(f)

        # Load documents
        docs_path = self.db_path / "documents.pkl"
        with open(docs_path, "rb") as f:
            self.documents = pickle.load(f)

        # Load build info if available
        info_path = self.db_path / "build_info.json"
        if info_path.exists():
            with open(info_path, "r") as f:
                self.build_info = json.load(f)

        print(f"✅ Loaded production vector database:")
        print(f"   Documents: {len(self.documents)}")
        print(f"   Index vectors: {self.index.ntotal}")
        print(f"   Embedding dimension: {self.index.d}")

    def search(
        self,
        query: str,
        k: int = 10,
        use_adaptive_threshold: bool = True,
        min_threshold: float = 0.3,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents with adaptive filtering.

        Args:
            query: Search query
            k: Maximum number of results to retrieve (default 10)
            use_adaptive_threshold: Use adaptive similarity filtering based on best result (default True)
            min_threshold: Minimum absolute threshold to prevent very low quality results (default 0.3)
        """
        if self.index is None or self.embeddings_model is None:
            raise ValueError("Database not properly loaded")

        # Get query embedding
        query_embedding = np.array(
            [self.embeddings_model.embed_query(query)], dtype=np.float32
        )
        faiss.normalize_L2(query_embedding)

        # Search with higher k to allow filtering
        search_k = min(
            k * 3, len(self.documents)
        )  # Get more candidates for adaptive filtering
        scores, indices = self.index.search(query_embedding, search_k)

        # Format all candidate results
        all_results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents) and idx >= 0:  # Valid index
                # Apply minimum threshold to prevent very poor matches
                if score < min_threshold:
                    continue

                result_meta = self.metadata[idx]

                # Get proper title with fallback hierarchy
                page_title = result_meta.get("page_title", "").strip()
                if not page_title:
                    # Try to extract from citation_url
                    citation_url = result_meta.get("citation_url", "")
                    if citation_url and citation_url != "/":
                        # Convert URL to readable title
                        url_parts = citation_url.strip("/").split("/")
                        page_title = url_parts[-1].replace("-", " ").title()

                # Final fallback
                if not page_title:
                    page_title = "Website Content"

                all_results.append(
                    {
                        "score": float(score),
                        "content": self.documents[idx],
                        "metadata": result_meta,
                        "citation_url": result_meta.get("citation_url", ""),
                        "page_title": page_title,
                        "citation": f"{page_title} ({result_meta.get('citation_url', '/')})",
                    }
                )

        # Sort by score (higher is better)
        all_results.sort(key=lambda x: x["score"], reverse=True)

        if not all_results:
            return []

        # Apply adaptive filtering if enabled
        if use_adaptive_threshold and len(all_results) > 1:
            best_score = all_results[0]["score"]
            adaptive_threshold = best_score / 2.0  # Use half of the best score

            # Filter results using adaptive threshold
            filtered_results = []
            for result in all_results:
                if result["score"] >= adaptive_threshold:
                    filtered_results.append(result)
                else:
                    # Stop adding results once we hit the threshold
                    break

            # Always include at least the best result, but cap at k results
            results = filtered_results[:k] if filtered_results else [all_results[0]]
        else:
            # No adaptive filtering, just return top k
            results = all_results[:k]

        return results

    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        return {
            "total_documents": len(self.documents),
            "total_vectors": self.index.ntotal if self.index else 0,
            "embedding_dimension": self.index.d if self.index else 0,
            "database_path": str(self.db_path),
            **self.build_info,
        }


# Convenience functions for easy integration


def load_vector_db(db_path: str = "vector_db") -> ProductionVectorLoader:
    """Load production vector database."""
    return ProductionVectorLoader(db_path)


def search_documents(
    query: str,
    db_path: str = "vector_db",
    k: int = 5,
    use_adaptive_threshold: bool = True,
) -> List[Dict[str, Any]]:
    """Quick search function with adaptive filtering."""
    loader = ProductionVectorLoader(db_path)
    return loader.search(query, k, use_adaptive_threshold)


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
        results = search_documents(query, db_path, k=3, use_adaptive_threshold=True)

        if results:
            best_score = results[0]["score"]
            adaptive_threshold = best_score / 2.0
            print(
                f"\n🎯 Adaptive filtering: best score {best_score:.3f}, threshold {adaptive_threshold:.3f}"
            )
            print(f"📊 Showing {len(results)} relevant results:")

            for i, result in enumerate(results, 1):
                print(f"\nResult {i} (score: {result['score']:.3f}):")
                print(f"Citation: {result['citation']}")
                print(f"Content: {result['content'][:200]}...")
        else:
            print("\n❌ No results found above minimum quality threshold")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
