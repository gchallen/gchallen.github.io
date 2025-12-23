#!/usr/bin/env python3
"""
Test script for build-time vector database approach.
Demonstrates: build embeddings -> save to disk -> load from disk -> query
"""

import json
import os
import pickle
from pathlib import Path

import faiss
import numpy as np
from dotenv import load_dotenv
from langchain_community.document_loaders import BSHTMLLoader
from langchain_openai import AzureOpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from citation_utils import enrich_chunk_metadata

load_dotenv()


class BuildTimeVectorDB:
    """A build-time vector database using FAISS."""

    def __init__(self, embeddings_model):
        self.embeddings_model = embeddings_model
        self.documents = []  # Store document chunks
        self.embeddings = []  # Store embeddings
        self.metadata = []  # Store metadata for each chunk
        self.index = None  # FAISS index

    def add_documents(self, docs_with_metadata):
        """Add documents to be embedded."""
        for doc, meta in docs_with_metadata:
            self.documents.append(doc.page_content)

            # Enrich metadata with citation information
            enriched_meta = enrich_chunk_metadata(
                {
                    "source": meta.get("source", ""),
                    "chunk_id": len(self.documents) - 1,
                    "length": len(doc.page_content),
                    **doc.metadata,
                },
                meta.get("source_file", meta.get("source", "")),
            )

            self.metadata.append(enriched_meta)

    def build_embeddings(self):
        """Generate embeddings for all documents."""
        print(f"🧮 Generating embeddings for {len(self.documents)} documents...")

        if not self.documents:
            raise ValueError("No documents to embed")

        # Generate embeddings in batches to be efficient
        batch_size = 10
        all_embeddings = []

        for i in range(0, len(self.documents), batch_size):
            batch = self.documents[i : i + batch_size]
            print(
                f"   Processing batch {i // batch_size + 1}/{(len(self.documents) + batch_size - 1) // batch_size}"
            )

            batch_embeddings = self.embeddings_model.embed_documents(batch)
            all_embeddings.extend(batch_embeddings)

        self.embeddings = np.array(all_embeddings, dtype=np.float32)
        print(f"✅ Generated embeddings shape: {self.embeddings.shape}")

    def build_faiss_index(self):
        """Build FAISS index from embeddings."""
        if self.embeddings is None or len(self.embeddings) == 0:
            raise ValueError("No embeddings to index")

        print("🏗️ Building FAISS index...")

        # Use a simple flat index for small datasets (exact search)
        dimension = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(
            dimension
        )  # Inner product (cosine similarity with normalized vectors)

        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(self.embeddings)

        # Add embeddings to index
        self.index.add(self.embeddings)

        print(
            f"✅ FAISS index built with {self.index.ntotal} vectors, dimension {dimension}"
        )

    def save_to_disk(self, base_path: str):
        """Save index and metadata to disk."""
        base_path = Path(base_path)
        base_path.mkdir(parents=True, exist_ok=True)

        print(f"💾 Saving vector database to {base_path}")

        # Save FAISS index
        index_path = base_path / "vector.index"
        faiss.write_index(self.index, str(index_path))

        # Save metadata
        metadata_path = base_path / "metadata.json"
        with open(metadata_path, "w") as f:
            json.dump(self.metadata, f, indent=2)

        # Save document texts (for retrieval)
        docs_path = base_path / "documents.pkl"
        with open(docs_path, "wb") as f:
            pickle.dump(self.documents, f)

        print("✅ Saved:")
        print(f"   Index: {index_path} ({index_path.stat().st_size:,} bytes)")
        print(f"   Metadata: {metadata_path} ({metadata_path.stat().st_size:,} bytes)")
        print(f"   Documents: {docs_path} ({docs_path.stat().st_size:,} bytes)")

    @classmethod
    def load_from_disk(cls, base_path: str, embeddings_model):
        """Load index and metadata from disk."""
        base_path = Path(base_path)

        print(f"📂 Loading vector database from {base_path}")

        # Create instance
        db = cls(embeddings_model)

        # Load FAISS index
        index_path = base_path / "vector.index"
        db.index = faiss.read_index(str(index_path))

        # Load metadata
        metadata_path = base_path / "metadata.json"
        with open(metadata_path) as f:
            db.metadata = json.load(f)

        # Load documents
        docs_path = base_path / "documents.pkl"
        with open(docs_path, "rb") as f:
            db.documents = pickle.load(f)

        print(f"✅ Loaded {db.index.ntotal} vectors, {len(db.documents)} documents")
        return db

    def search(self, query: str, k: int = 5):
        """Search for similar documents."""
        if self.index is None:
            raise ValueError("Index not built or loaded")

        # Get query embedding
        query_embedding = np.array(
            [self.embeddings_model.embed_query(query)], dtype=np.float32
        )
        faiss.normalize_L2(query_embedding)

        # Search
        scores, indices = self.index.search(query_embedding, k)

        # Format results
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents):  # Valid index
                result_meta = self.metadata[idx]
                results.append(
                    {
                        "score": float(score),
                        "content": self.documents[idx],
                        "metadata": result_meta,
                        "citation_url": result_meta.get("citation_url", ""),
                        "page_title": result_meta.get("page_title", ""),
                        "citation": f"{result_meta.get('page_title', 'Unknown')} ({result_meta.get('citation_url', 'Unknown URL')})",
                    }
                )

        return results


def test_build_time_approach():
    """Test the complete build-time vector database workflow."""

    print("🚀 Testing build-time vector database approach\n")

    # Set up embeddings model
    print("1️⃣ Setting up Azure OpenAI embeddings...")
    embeddings_endpoint = os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
    embeddings_api_key = os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY")

    if not embeddings_endpoint or not embeddings_api_key:
        print("❌ Missing Azure OpenAI embeddings credentials in .env")
        return

    # Extract deployment info
    import re

    match = re.search(r"/deployments/([^/]+)/", embeddings_endpoint)
    deployment_name = match.group(1) if match else "text-embedding-3-large"
    base_url = embeddings_endpoint.split("/openai/")[0]
    api_version_match = re.search(r"api-version=([^&]+)", embeddings_endpoint)
    api_version = api_version_match.group(1) if api_version_match else "2023-05-15"

    embeddings = AzureOpenAIEmbeddings(
        azure_endpoint=base_url,
        azure_deployment=deployment_name,
        api_key=embeddings_api_key,
        api_version=api_version,
    )

    print("✅ Embeddings model configured")

    # === BUILD PHASE ===
    print("\n🔨 BUILD PHASE: Processing documents and building index")

    # Load and process a small subset of HTML files for testing
    html_files = list(Path("../html").rglob("*.html"))[
        :2
    ]  # Just 2 files for faster testing
    print(f"📁 Processing {len(html_files)} HTML files...")

    # Set up text splitter with smaller chunks for fewer API calls
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,  # Larger chunks = fewer chunks = fewer API calls
        chunk_overlap=200,
        length_function=len,
    )

    # Create vector database
    vector_db = BuildTimeVectorDB(embeddings)

    # Process each file
    all_docs_with_meta = []
    for html_file in html_files:
        print(f"   Processing {html_file.name}...")

        # Load document
        loader = BSHTMLLoader(str(html_file))
        docs = loader.load()

        # Split into chunks
        chunks = text_splitter.split_documents(docs)

        # Add source info to metadata
        for chunk in chunks:
            chunk.metadata["source_file"] = str(html_file)
            all_docs_with_meta.append((chunk, chunk.metadata))

    print(f"📄 Total chunks: {len(all_docs_with_meta)}")

    # Add to vector database
    vector_db.add_documents(all_docs_with_meta)

    # Build embeddings and index
    vector_db.build_embeddings()
    vector_db.build_faiss_index()

    # Save to disk (in tests directory)
    save_path = "tests/test_build_time_vector_db"
    vector_db.save_to_disk(save_path)

    # === RUNTIME PHASE ===
    print("\n⚡ RUNTIME PHASE: Loading from disk and querying")

    # Load from disk (simulating application startup)
    loaded_db = BuildTimeVectorDB.load_from_disk(save_path, embeddings)

    # Test queries
    test_queries = [
        "teaching and education",
        "computer science courses",
        "student learning",
    ]

    print("\n🔍 Testing similarity search:")
    for i, query in enumerate(test_queries, 1):
        print(f"\n   Query {i}: '{query}'")
        results = loaded_db.search(query, k=3)

        for j, result in enumerate(results, 1):
            print(f"      Result {j} (score: {result['score']:.3f}):")
            print(f"         Citation: {result['citation']}")
            print(f"         Content: {result['content'][:150]}...")

    # Performance test
    print("\n📊 Performance test:")
    import time

    start_time = time.time()
    for _ in range(100):
        loaded_db.search("teaching", k=5)
    query_time = (time.time() - start_time) / 100

    print(f"   Average query time: {query_time * 1000:.1f}ms")
    print(f"   Queries per second: {1 / query_time:.0f}")

    print("\n✅ Build-time vector database test completed successfully!")
    print(
        "💡 Ready for production: build index during CI/CD, ship with container, load on startup"
    )


if __name__ == "__main__":
    test_build_time_approach()
