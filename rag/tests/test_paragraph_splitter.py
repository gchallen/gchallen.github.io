#!/usr/bin/env python3
"""Test the HTML paragraph splitter to verify it's working correctly."""

import sys

sys.path.insert(0, ".")

from vector_db_builder import HierarchicalHTMLSplitter
from pathlib import Path


def test_splitter():
    """Test the paragraph splitter on a sample HTML file."""

    # Create splitter with default settings
    splitter = HierarchicalHTMLSplitter(
        min_paragraph_length=100, max_paragraphs_per_chunk=3, overlap_paragraphs=1
    )

    # Test on about.html
    test_file = "html/about.html"

    print(f"Testing paragraph splitter on {test_file}")
    print("=" * 60)

    chunks = splitter.split_html_file(test_file)

    print(f"\nSummary:")
    print(f"  Total chunks: {len(chunks)}")

    print(f"\nFirst 3 chunks in detail:")
    for i, chunk in enumerate(chunks[:3]):
        print(f"\n--- Chunk {i + 1} ---")
        print(f"Length: {len(chunk.page_content)} characters")
        print(f"Content:\n{chunk.page_content}\n")


if __name__ == "__main__":
    test_splitter()
