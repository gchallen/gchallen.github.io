#!/usr/bin/env python3
"""
Production vector database builder for RAG system.
Builds embeddings from HTML files and saves to production vector database.
"""

import os
import json
import pickle
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Set, Tuple
import numpy as np
import faiss
import argparse
from dotenv import load_dotenv

from langchain_community.document_loaders import BSHTMLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import AzureOpenAIEmbeddings
from citation_utils import enrich_chunk_metadata

load_dotenv()

class ProductionVectorDB:
    """Production vector database builder with incremental updates."""
    
    def __init__(self, embeddings_model):
        self.embeddings_model = embeddings_model
        self.documents = []      # Store document chunks
        self.embeddings = []     # Store embeddings
        self.metadata = []       # Store metadata for each chunk
        self.content_hashes = {} # Map content_hash -> chunk_index for deduplication
        self.index = None        # FAISS index
        
    def compute_content_hash(self, content: str) -> str:
        """Compute SHA-256 hash of document content."""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
        
    def load_existing_database(self, base_path: str) -> bool:
        """Load existing database if it exists."""
        base_path = Path(base_path)
        
        if not (base_path.exists() and 
                (base_path / "vector.index").exists() and 
                (base_path / "metadata.json").exists() and 
                (base_path / "documents.pkl").exists()):
            print(f"📂 No existing database found at {base_path}")
            return False
            
        print(f"📂 Loading existing database from {base_path}")
        
        # Load FAISS index
        index_path = base_path / "vector.index"
        self.index = faiss.read_index(str(index_path))
        
        # Load metadata
        metadata_path = base_path / "metadata.json"
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
            
        # Load documents
        docs_path = base_path / "documents.pkl"
        with open(docs_path, 'rb') as f:
            self.documents = pickle.load(f)
            
        # Reconstruct embeddings from FAISS index
        if self.index.ntotal > 0:
            self.embeddings = np.zeros((self.index.ntotal, self.index.d), dtype=np.float32)
            self.index.reconstruct_n(0, self.index.ntotal, self.embeddings)
            
        # Build content hash lookup
        self.content_hashes = {}
        for i, metadata in enumerate(self.metadata):
            if 'content_hash' in metadata:
                self.content_hashes[metadata['content_hash']] = i
                
        print(f"✅ Loaded existing database:")
        print(f"   {len(self.documents)} documents")
        print(f"   {len(self.content_hashes)} unique content hashes")
        print(f"   {self.index.ntotal if self.index else 0} vectors in index")
        return True
        
    def add_documents_incremental(self, docs_with_metadata) -> Tuple[int, int]:
        """Add documents, skipping those that already exist."""
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
                'source': meta.get('source', ''),
                'chunk_id': len(self.documents) + len(new_docs),
                'length': len(doc.page_content),
                'content_hash': content_hash,
                **doc.metadata
            }
            
            # Enrich with citation information
            chunk_metadata = enrich_chunk_metadata(base_metadata, meta.get('source_file', meta.get('source', '')))
            
            new_docs.append(doc.page_content)
            new_metadata.append(chunk_metadata)
            
        # Add new documents to our collections
        start_index = len(self.documents)
        self.documents.extend(new_docs)
        self.metadata.extend(new_metadata)
        
        # Update content hash lookup
        for i, metadata in enumerate(new_metadata):
            self.content_hashes[metadata['content_hash']] = start_index + i
            
        return len(new_docs), skipped_count
    
    def build_embeddings_incremental(self) -> int:
        """Generate embeddings only for new documents."""
        existing_count = len(self.embeddings) if self.embeddings is not None else 0
        new_doc_count = len(self.documents) - existing_count
        
        if new_doc_count == 0:
            print("🧮 No new documents to embed")
            return 0
            
        print(f"🧮 Generating embeddings for {new_doc_count} new documents...")
        
        # Get only the new documents
        new_documents = self.documents[existing_count:]
        
        # Generate embeddings in batches
        batch_size = 20  # Larger batches for production efficiency
        new_embeddings = []
        
        for i in range(0, len(new_documents), batch_size):
            batch = new_documents[i:i + batch_size]
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
        """Rebuild FAISS index with all embeddings."""
        if self.embeddings is None or len(self.embeddings) == 0:
            raise ValueError("No embeddings to index")
            
        print(f"🏗️ Building FAISS index...")
        
        # Create new index
        dimension = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)
        
        # Normalize embeddings for cosine similarity
        embeddings_normalized = self.embeddings.copy()
        faiss.normalize_L2(embeddings_normalized)
        
        # Add all embeddings to index
        self.index.add(embeddings_normalized)
        
        print(f"✅ FAISS index built with {self.index.ntotal} vectors")
        
    def save_to_disk(self, base_path: str):
        """Save index and metadata to disk."""
        base_path = Path(base_path)
        base_path.mkdir(parents=True, exist_ok=True)
        
        print(f"💾 Saving production vector database to {base_path}")
        
        # Save FAISS index
        index_path = base_path / "vector.index"
        faiss.write_index(self.index, str(index_path))
        
        # Save metadata
        metadata_path = base_path / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)
            
        # Save document texts
        docs_path = base_path / "documents.pkl"
        with open(docs_path, 'wb') as f:
            pickle.dump(self.documents, f)
            
        # Save build info
        info_path = base_path / "build_info.json"
        with open(info_path, 'w') as f:
            json.dump({
                'total_documents': len(self.documents),
                'total_chunks': len(self.metadata),
                'embedding_dimension': self.embeddings.shape[1],
                'build_timestamp': str(pd.Timestamp.now()) if 'pd' in globals() else 'unknown'
            }, f, indent=2)
            
        print(f"✅ Saved production database:")
        print(f"   Index: {index_path} ({index_path.stat().st_size:,} bytes)")
        print(f"   Metadata: {metadata_path} ({metadata_path.stat().st_size:,} bytes)")
        print(f"   Documents: {docs_path} ({docs_path.stat().st_size:,} bytes)")


def build_production_database(html_dir: str, output_dir: str, chunk_size: int = 1000, chunk_overlap: int = 200):
    """Build production vector database from HTML files."""
    
    print("🏭 Building Production Vector Database")
    print("=" * 50)
    
    # Setup embeddings model
    print("1️⃣ Setting up Azure OpenAI embeddings...")
    embeddings_endpoint = os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
    embeddings_api_key = os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY")
    
    if not embeddings_endpoint or not embeddings_api_key:
        raise ValueError("Missing Azure OpenAI embeddings credentials in .env")
        
    # Extract deployment info
    import re
    match = re.search(r'/deployments/([^/]+)/', embeddings_endpoint)
    deployment_name = match.group(1) if match else "text-embedding-3-large"
    base_url = embeddings_endpoint.split('/openai/')[0]
    api_version_match = re.search(r'api-version=([^&]+)', embeddings_endpoint)
    api_version = api_version_match.group(1) if api_version_match else "2023-05-15"
    
    embeddings = AzureOpenAIEmbeddings(
        azure_endpoint=base_url,
        azure_deployment=deployment_name,
        api_key=embeddings_api_key,
        api_version=api_version
    )
    
    print("✅ Embeddings model configured")
    
    # Create vector database
    vector_db = ProductionVectorDB(embeddings)
    
    # Try to load existing database for incremental updates
    vector_db.load_existing_database(output_dir)
    
    # Find all HTML files
    html_files = list(Path(html_dir).rglob("*.html"))
    print(f"📁 Found {len(html_files)} HTML files")
    
    # Set up text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    
    # Process files
    all_docs_with_meta = []
    for html_file in html_files:
        print(f"   Processing {html_file.relative_to(html_dir)}")
        
        try:
            # Load document
            loader = BSHTMLLoader(str(html_file))
            docs = loader.load()
            
            # Split into chunks
            chunks = text_splitter.split_documents(docs)
            
            # Add source info to metadata
            for chunk in chunks:
                chunk.metadata['source_file'] = str(html_file)
                all_docs_with_meta.append((chunk, chunk.metadata))
                
        except Exception as e:
            print(f"   ⚠️ Error processing {html_file}: {e}")
            continue
    
    print(f"📄 Total chunks: {len(all_docs_with_meta)}")
    
    # Add documents (incremental)
    new_added, skipped = vector_db.add_documents_incremental(all_docs_with_meta)
    print(f"📊 Added: {new_added}, Skipped: {skipped}")
    
    # Build embeddings (incremental)
    new_embeddings = vector_db.build_embeddings_incremental()
    
    # Rebuild index if we have new embeddings
    if new_embeddings > 0 or not hasattr(vector_db, 'index') or vector_db.index is None:
        vector_db.rebuild_faiss_index()
    
    # Save to disk
    vector_db.save_to_disk(output_dir)
    
    print(f"\n✅ Production vector database built successfully!")
    print(f"📊 Final stats:")
    print(f"   Total documents: {len(vector_db.documents)}")
    print(f"   New embeddings: {new_embeddings}")
    print(f"   Skipped (unchanged): {skipped}")
    print(f"   Database location: {output_dir}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Build production vector database")
    parser.add_argument("--html-dir", default="../html", help="Directory containing HTML files")
    parser.add_argument("--output-dir", default="vector_db", help="Output directory for vector database")
    parser.add_argument("--chunk-size", type=int, default=1000, help="Text chunk size")
    parser.add_argument("--chunk-overlap", type=int, default=200, help="Text chunk overlap")
    parser.add_argument("--clean", action="store_true", help="Start with clean database (ignore existing)")
    
    args = parser.parse_args()
    
    # Clean existing database if requested
    if args.clean:
        import shutil
        if Path(args.output_dir).exists():
            shutil.rmtree(args.output_dir)
            print(f"🧹 Cleaned existing database at {args.output_dir}")
    
    # Build database
    build_production_database(
        html_dir=args.html_dir,
        output_dir=args.output_dir,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap
    )


if __name__ == "__main__":
    main()