#!/usr/bin/env python3
"""
Minimal embedding test - uses only 1 small document to verify the pipeline works.
Perfect for quick validation with minimal API usage.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

from langchain_community.document_loaders import BSHTMLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import AzureOpenAIEmbeddings
from test_build_time_vector_db import BuildTimeVectorDB
from citation_utils import enrich_chunk_metadata

load_dotenv()


def test_minimal_pipeline():
    """Test the complete pipeline with minimal content."""

    print("⚡ Testing RAG pipeline with minimal content (fastest test)")
    print("🎯 Goal: Verify pipeline works with minimal API usage\n")

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

    # Find the smallest HTML file for testing
    html_files = list(Path("../html").rglob("*.html"))
    if not html_files:
        print("❌ No HTML files found. Run 'npm run build:mdx' first.")
        return

    # Sort by file size and pick the smallest
    html_files_with_size = [(f, f.stat().st_size) for f in html_files]
    html_files_with_size.sort(key=lambda x: x[1])
    smallest_file = html_files_with_size[0][0]

    print(
        f"📁 Using smallest file: {smallest_file.name} ({smallest_file.stat().st_size:,} bytes)"
    )

    # Process the single small file
    print("\n2️⃣ Processing document...")
    loader = BSHTMLLoader(str(smallest_file))
    docs = loader.load()

    # Use very large chunks to minimize the number of chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=5000,  # Very large chunks
        chunk_overlap=100,  # Minimal overlap
        length_function=len,
    )

    chunks = text_splitter.split_documents(docs)
    print(f"📄 Created {len(chunks)} chunk(s) from document")

    for i, chunk in enumerate(chunks):
        print(f"   Chunk {i + 1}: {len(chunk.page_content)} characters")

    # Add metadata
    docs_with_meta = []
    for chunk in chunks:
        chunk.metadata["source_file"] = str(smallest_file)
        docs_with_meta.append((chunk, chunk.metadata))

    # Build vector database
    print(f"\n3️⃣ Building vector database...")
    vector_db = BuildTimeVectorDB(embeddings)
    vector_db.add_documents(docs_with_meta)

    print(f"🧮 Generating embeddings for {len(chunks)} chunk(s)...")
    vector_db.build_embeddings()
    vector_db.build_faiss_index()

    # Test search
    print(f"\n4️⃣ Testing search...")
    test_queries = ["teaching", "computer science", "learning"]

    for query in test_queries:
        results = vector_db.search(query, k=min(2, len(chunks)))
        print(
            f"   Query '{query}': {len(results)} result(s), top score: {results[0]['score']:.3f}"
        )

    print(f"\n✅ Minimal pipeline test completed successfully!")
    print(f"📊 Summary:")
    print(f"   File processed: {smallest_file.name}")
    print(f"   Chunks created: {len(chunks)}")
    print(f"   Embeddings generated: {len(chunks)}")
    print(f"   💰 Minimal API usage: Only {len(chunks)} embedding call(s)")

    # Cleanup
    save_path = "minimal_vector_db"
    vector_db.save_to_disk(save_path)
    print(f"💾 Saved test database to {save_path}/")

    return True


if __name__ == "__main__":
    test_minimal_pipeline()
