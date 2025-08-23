#!/usr/bin/env python3
"""
Test script to verify citation functionality.
"""

import json
from citation_utils import extract_page_metadata, get_citation_url, format_citation

def test_citations():
    """Test citation extraction and formatting."""
    
    print("📄 Testing citation functionality\n")
    
    # Test a few HTML files
    test_files = [
        "html/bio.html",
        "html/about.html", 
        "html/essays/02-chalkface-nostalgia.html"
    ]
    
    for file_path in test_files:
        try:
            print(f"🔍 Testing: {file_path}")
            
            # Extract metadata
            metadata = extract_page_metadata(file_path)
            citation_url = get_citation_url(file_path)
            
            # Add citation URL to metadata for formatting
            metadata['citation_url'] = citation_url
            citation = format_citation(metadata)
            
            print(f"   📖 Title: {metadata.get('title', 'No title')}")
            print(f"   🔗 URL: {citation_url}")
            print(f"   📝 Description: {metadata.get('description', 'No description')[:100]}...")
            print(f"   📚 Citation: {citation}")
            
            if 'published' in metadata:
                print(f"   📅 Published: {metadata['published']}")
                
            print()
            
        except Exception as e:
            print(f"   ❌ Error: {e}\n")
    
    print("✅ Citation testing completed!")

if __name__ == "__main__":
    test_citations()