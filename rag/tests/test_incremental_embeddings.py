#!/usr/bin/env python3
"""
Test script for incremental embedding updates.
Demonstrates: load existing -> hash content -> skip unchanged -> process only new/changed documents
"""

import os
import json
import pickle
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Set, Tuple
import numpy as np
import faiss
from dotenv import load_dotenv

from langchain_community.document_loaders import BSHTMLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import AzureOpenAIEmbeddings
from citation_utils import enrich_chunk_metadata

load_dotenv()


class IncrementalVectorDB:
    """An incremental vector database that avoids reprocessing unchanged content."""

    def __init__(self, embeddings_model):
        self.embeddings_model = embeddings_model
        self.documents = []  # Store document chunks
        self.embeddings = []  # Store embeddings
        self.metadata = []  # Store metadata for each chunk
        self.content_hashes = {}  # Map content_hash -> chunk_index for deduplication
        self.index = None  # FAISS index

    def compute_content_hash(self, content: str) -> str:
        """Compute SHA-256 hash of document content."""
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def load_existing_database(self, base_path: str) -> bool:
        """Load existing database if it exists. Returns True if loaded, False if not found."""
        base_path = Path(base_path)

        if not (
            base_path.exists()
            and (base_path / "vector.index").exists()
            and (base_path / "metadata.json").exists()
            and (base_path / "documents.pkl").exists()
        ):
            print(f"📂 No existing database found at {base_path}")
            return False

        print(f"📂 Loading existing database from {base_path}")

        # Load FAISS index
        index_path = base_path / "vector.index"
        self.index = faiss.read_index(str(index_path))

        # Load metadata
        metadata_path = base_path / "metadata.json"
        with open(metadata_path, "r") as f:
            self.metadata = json.load(f)

        # Load documents
        docs_path = base_path / "documents.pkl"
        with open(docs_path, "rb") as f:
            self.documents = pickle.load(f)

        # Load embeddings (reconstruct from FAISS index)
        if self.index.ntotal > 0:
            # Get all vectors from FAISS index
            self.embeddings = np.zeros(
                (self.index.ntotal, self.index.d), dtype=np.float32
            )
            self.index.reconstruct_n(0, self.index.ntotal, self.embeddings)

        # Build content hash lookup
        self.content_hashes = {}
        for i, metadata in enumerate(self.metadata):
            if "content_hash" in metadata:
                self.content_hashes[metadata["content_hash"]] = i

        print(f"✅ Loaded existing database:")
        print(f"   {len(self.documents)} documents")
        print(f"   {len(self.content_hashes)} unique content hashes")
        print(f"   {self.index.ntotal if self.index else 0} vectors in index")
        return True

    def add_documents_incremental(self, docs_with_metadata) -> Tuple[int, int]:
        """
        Add documents, skipping those that already exist.
        Returns (new_documents_added, existing_documents_skipped)
        """
        new_docs = []
        new_metadata = []
        skipped_count = 0

        for doc, meta in docs_with_metadata:
            # Compute content hash
            content_hash = self.compute_content_hash(doc.page_content)

            # Check if we already have this content
            if content_hash in self.content_hashes:
                skipped_count += 1
                continue

            # New document - add to processing queue
            base_metadata = {
                "source": meta.get("source", ""),
                "chunk_id": len(self.documents) + len(new_docs),
                "length": len(doc.page_content),
                "content_hash": content_hash,
                **doc.metadata,
            }

            # Enrich with citation information
            chunk_metadata = enrich_chunk_metadata(
                base_metadata, meta.get("source_file", meta.get("source", ""))
            )

            new_docs.append(doc.page_content)
            new_metadata.append(chunk_metadata)

        # Add new documents to our collections
        start_index = len(self.documents)
        self.documents.extend(new_docs)
        self.metadata.extend(new_metadata)

        # Update content hash lookup
        for i, metadata in enumerate(new_metadata):
            self.content_hashes[metadata["content_hash"]] = start_index + i

        return len(new_docs), skipped_count

    def build_embeddings_incremental(self) -> int:
        """Generate embeddings only for new documents. Returns number of new embeddings created."""
        existing_count = len(self.embeddings) if self.embeddings is not None else 0
        new_doc_count = len(self.documents) - existing_count

        if new_doc_count == 0:
            print("🧮 No new documents to embed")
            return 0

        print(f"🧮 Generating embeddings for {new_doc_count} new documents...")

        # Get only the new documents
        new_documents = self.documents[existing_count:]

        # Generate embeddings in batches
        batch_size = 10
        new_embeddings = []

        for i in range(0, len(new_documents), batch_size):
            batch = new_documents[i : i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(new_documents) + batch_size - 1) // batch_size
            print(f"   Processing batch {batch_num}/{total_batches}")

            batch_embeddings = self.embeddings_model.embed_documents(batch)
            new_embeddings.extend(batch_embeddings)

        # Convert to numpy and combine with existing
        new_embeddings = np.array(new_embeddings, dtype=np.float32)

        if self.embeddings is not None and len(self.embeddings) > 0:
            self.embeddings = np.vstack([self.embeddings, new_embeddings])
        else:
            self.embeddings = new_embeddings

        print(f"✅ Total embeddings shape: {self.embeddings.shape}")
        return len(new_embeddings)

    def rebuild_faiss_index(self):
        """Rebuild FAISS index with all embeddings (existing + new)."""
        if self.embeddings is None or len(self.embeddings) == 0:
            raise ValueError("No embeddings to index")

        print(f"🏗️ Rebuilding FAISS index...")

        # Create new index
        dimension = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)

        # Normalize embeddings for cosine similarity
        embeddings_normalized = self.embeddings.copy()
        faiss.normalize_L2(embeddings_normalized)

        # Add all embeddings to index
        self.index.add(embeddings_normalized)

        print(f"✅ FAISS index rebuilt with {self.index.ntotal} vectors")

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

        # Save document texts
        docs_path = base_path / "documents.pkl"
        with open(docs_path, "wb") as f:
            pickle.dump(self.documents, f)

        print(f"✅ Saved database with {len(self.documents)} documents")

    def search(self, query: str, k: int = 5):
        """Search for similar documents."""
        if self.index is None:
            raise ValueError("Index not built")

        # Get query embedding
        query_embedding = np.array(
            [self.embeddings_model.embed_query(query)], dtype=np.float32
        )
        faiss.normalize_L2(query_embedding)

        # Search
        scores, indices = self.index.search(query_embedding, k)

        # Format results with citation information
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents):
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


def test_incremental_embeddings():
    """Test incremental embedding updates."""

    print("🔄 Testing incremental embedding updates\n")

    # Setup embeddings model
    print("1️⃣ Setting up Azure OpenAI embeddings...")
    embeddings_endpoint = os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
    embeddings_api_key = os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY")

    if not embeddings_endpoint or not embeddings_api_key:
        print("❌ Missing Azure OpenAI embeddings credentials")
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

    # Set up text splitter with larger chunks for fewer API calls during testing
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,  # Larger chunks = fewer chunks = fewer API calls
        chunk_overlap=200,
        length_function=len,
    )

    save_path = "tests/incremental_vector_db"

    # === FIRST BUILD ===
    print("\n🏗️ FIRST BUILD: Processing initial documents")

    vector_db = IncrementalVectorDB(embeddings)

    # Try to load existing (should fail first time)
    vector_db.load_existing_database(save_path)

    # Process just 2 files for faster testing
    html_files = list(Path("../html").rglob("*.html"))[:2]
    print(f"📁 Processing {len(html_files)} HTML files...")

    all_docs_with_meta = []
    for html_file in html_files:
        loader = BSHTMLLoader(str(html_file))
        docs = loader.load()
        chunks = text_splitter.split_documents(docs)

        for chunk in chunks:
            chunk.metadata["source_file"] = str(html_file)
            all_docs_with_meta.append((chunk, chunk.metadata))

    new_added, skipped = vector_db.add_documents_incremental(all_docs_with_meta)
    print(f"📊 Added: {new_added}, Skipped: {skipped}")

    new_embeddings = vector_db.build_embeddings_incremental()
    print(f"🧮 Generated {new_embeddings} new embeddings")

    vector_db.rebuild_faiss_index()
    vector_db.save_to_disk(save_path)

    # === SECOND BUILD (INCREMENTAL) ===
    print("\n🔄 SECOND BUILD: Testing incremental update")

    vector_db2 = IncrementalVectorDB(embeddings)

    # Load existing database
    loaded = vector_db2.load_existing_database(save_path)
    assert loaded, "Should have loaded existing database"

    # Process same files plus 1 new one (3 total)
    html_files_expanded = list(Path("../html").rglob("*.html"))[:3]  # Add 1 more file
    print(
        f"📁 Processing {len(html_files_expanded)} HTML files (including previous ones)..."
    )

    all_docs_with_meta2 = []
    for html_file in html_files_expanded:
        loader = BSHTMLLoader(str(html_file))
        docs = loader.load()
        chunks = text_splitter.split_documents(docs)

        for chunk in chunks:
            chunk.metadata["source_file"] = str(html_file)
            all_docs_with_meta2.append((chunk, chunk.metadata))

    new_added2, skipped2 = vector_db2.add_documents_incremental(all_docs_with_meta2)
    print(f"📊 Added: {new_added2}, Skipped: {skipped2}")

    print(f"✅ Verification:")
    print(f"   Should skip documents from first build: {skipped2 > 0}")
    print(f"   Should add only new documents: {new_added2 > 0}")

    new_embeddings2 = vector_db2.build_embeddings_incremental()
    print(f"🧮 Generated {new_embeddings2} new embeddings (should be less than total)")

    if new_embeddings2 > 0:
        vector_db2.rebuild_faiss_index()
        vector_db2.save_to_disk(save_path)

    # === THIRD BUILD (NO CHANGES) ===
    print("\n🚫 THIRD BUILD: No new content (should skip everything)")

    vector_db3 = IncrementalVectorDB(embeddings)
    vector_db3.load_existing_database(save_path)

    # Process same files again
    new_added3, skipped3 = vector_db3.add_documents_incremental(all_docs_with_meta2)
    print(f"📊 Added: {new_added3}, Skipped: {skipped3}")

    new_embeddings3 = vector_db3.build_embeddings_incremental()
    print(f"🧮 Generated {new_embeddings3} new embeddings")

    print(f"✅ Verification:")
    print(f"   Should skip all documents: {skipped3 > 0 and new_added3 == 0}")
    print(f"   Should generate no new embeddings: {new_embeddings3 == 0}")

    # Test search still works
    print(f"\n🔍 Testing search after incremental updates:")
    results = vector_db3.search("teaching", k=3)
    for i, result in enumerate(results, 1):
        print(f"   Result {i} (score: {result['score']:.3f}): {result['citation']}")

    # Performance comparison
    print(f"\n📊 Performance Summary:")
    print(
        f"   First build: {len(all_docs_with_meta)} chunks, {new_embeddings} embeddings"
    )
    print(f"   Second build: {new_added2} new chunks, {new_embeddings2} new embeddings")
    print(f"   Third build: {new_added3} new chunks, {new_embeddings3} new embeddings")
    print(f"   💰 Embedding API calls saved: {skipped2 + skipped3}")

    print(f"\n✅ Incremental embedding test completed!")
    print(f"🎯 Ready for production: Only changed content gets reprocessed!")


if __name__ == "__main__":
    test_incremental_embeddings()
