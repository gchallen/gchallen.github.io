#!/usr/bin/env python3
"""Test the hierarchical splitter on the Kotlin essay."""

import sys

sys.path.insert(0, ".")

from vector_db_builder import HierarchicalHTMLSplitter


def test_kotlin_file():
    """Test splitter on the Kotlin essay file."""

    splitter = HierarchicalHTMLSplitter(
        min_paragraph_length=100, max_paragraphs_per_chunk=3, overlap_paragraphs=1
    )

    kotlin_file = "html/essays/11-cs1-in-kotlin/index.html"
    print(f"Testing hierarchical splitter on {kotlin_file}")
    print("=" * 80)

    chunks = splitter.split_html_file(kotlin_file)

    # Look for chunks containing "step back"
    print(f"\nFound {len(chunks)} total chunks")
    print("\nLooking for chunks containing 'step back':")

    for i, chunk in enumerate(chunks):
        if "step back" in chunk.page_content.lower():
            print(f"\n--- Chunk {i + 1} ---")
            print(f"Section: {chunk.metadata.get('section', 'None')}")
            print(f"Length: {len(chunk.page_content)} chars")
            print(f"Content:\n{chunk.page_content}")
            print("\n" + "-" * 40)

            # Show paragraph boundaries
            paragraphs = chunk.page_content.split("\n\n")
            print(f"This chunk contains {len(paragraphs)} paragraphs:")
            for j, para in enumerate(paragraphs, 1):
                print(f"\nParagraph {j} ({len(para)} chars):")
                print(f"  {para}")


if __name__ == "__main__":
    test_kotlin_file()
