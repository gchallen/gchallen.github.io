#!/usr/bin/env python3
"""
Test script to process HTML files for RAG.
Tests document loading and splitting without computing embeddings.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_community.document_loaders import BSHTMLLoader
from langchain_text_splitters import HTMLHeaderTextSplitter, RecursiveCharacterTextSplitter

load_dotenv()

def test_document_processing():
    """Test loading and splitting an HTML file."""
    
    # Choose a test file - let's try a longer essay that might have more structure
    html_file = Path("html/essays/07-quantifying-cs1.html")
    
    if not html_file.exists():
        print(f"❌ HTML file not found: {html_file}")
        return
        
    print(f"🔍 Testing document processing with: {html_file}")
    print(f"📁 File size: {html_file.stat().st_size:,} bytes")
    
    # Step 1: Load the HTML document
    print("\n1️⃣ Loading HTML document...")
    try:
        loader = BSHTMLLoader(str(html_file))
        documents = loader.load()
        
        print(f"✅ Loaded {len(documents)} document(s)")
        if documents:
            doc = documents[0]
            print(f"📄 Document content length: {len(doc.page_content):,} characters")
            print(f"🏷️ Document metadata: {doc.metadata}")
            
            # Show a preview of the content
            preview = doc.page_content[:500] + "..." if len(doc.page_content) > 500 else doc.page_content
            print(f"📝 Content preview:\n{preview}\n")
            
    except Exception as e:
        print(f"❌ Failed to load document: {e}")
        return
    
    # Step 2: Set up HTML header-based splitting
    print("2️⃣ Setting up HTML header text splitter...")
    try:
        # Define headers to split on (h1, h2, h3, etc.)
        headers_to_split_on = [
            ("h1", "Header 1"),
            ("h2", "Header 2"), 
            ("h3", "Header 3"),
            ("h4", "Header 4"),
        ]
        
        html_splitter = HTMLHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on
        )
        
        # Split based on HTML headers first
        html_header_splits = html_splitter.split_text(doc.page_content)
        
        print(f"✅ HTML header splitting created {len(html_header_splits)} sections")
        
        # Show stats for each section
        for i, split in enumerate(html_header_splits):
            print(f"  Section {i+1}: {len(split.page_content):,} chars, metadata: {split.metadata}")
            
    except Exception as e:
        print(f"❌ Failed to split by HTML headers: {e}")
        html_header_splits = [doc]  # Fallback to original document
    
    # Step 3: Further split with RecursiveCharacterTextSplitter
    print("\n3️⃣ Setting up recursive character text splitter...")
    try:
        # Set up the recursive splitter for smaller chunks
        chunk_size = 1000  # Target chunk size in characters
        chunk_overlap = 200  # Overlap between chunks
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )
        
        # Apply recursive splitting to each HTML header section
        all_splits = []
        for section in html_header_splits:
            section_splits = text_splitter.split_documents([section])
            all_splits.extend(section_splits)
        
        print(f"✅ Recursive splitting created {len(all_splits)} total chunks")
        
        # Analyze the chunks
        chunk_lengths = [len(chunk.page_content) for chunk in all_splits]
        
        print(f"\n📊 Chunk Statistics:")
        print(f"   Total chunks: {len(all_splits)}")
        print(f"   Average chunk size: {sum(chunk_lengths) / len(chunk_lengths):.1f} characters")
        print(f"   Min chunk size: {min(chunk_lengths)} characters")
        print(f"   Max chunk size: {max(chunk_lengths)} characters")
        print(f"   Total content: {sum(chunk_lengths):,} characters")
        
        # Show details of first few chunks
        print(f"\n🔍 Sample chunks:")
        for i, chunk in enumerate(all_splits[:3]):
            print(f"\n   Chunk {i+1} ({len(chunk.page_content)} chars):")
            print(f"   Metadata: {chunk.metadata}")
            preview = chunk.page_content[:200] + "..." if len(chunk.page_content) > 200 else chunk.page_content
            print(f"   Content: {repr(preview)}")
            
        # Check for empty chunks
        empty_chunks = [i for i, chunk in enumerate(all_splits) if not chunk.page_content.strip()]
        if empty_chunks:
            print(f"\n⚠️ Found {len(empty_chunks)} empty chunks at indices: {empty_chunks}")
        
    except Exception as e:
        print(f"❌ Failed to do recursive splitting: {e}")
        return
    
    print(f"\n✅ Document processing test completed successfully!")
    print(f"🎯 Ready for embedding: {len(all_splits)} chunks from {html_file}")


if __name__ == "__main__":
    print("Testing HTML document processing for RAG...\n")
    test_document_processing()