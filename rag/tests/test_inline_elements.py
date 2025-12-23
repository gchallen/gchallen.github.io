#!/usr/bin/env python3
"""Test that paragraph extraction works correctly with inline HTML elements."""

import sys

sys.path.insert(0, ".")

from bs4 import BeautifulSoup

from vector_db_builder import HierarchicalHTMLSplitter


def test_inline_elements():
    """Test paragraph extraction with various inline elements."""

    # Create test HTML with inline elements
    test_html = """
    <!DOCTYPE html>
    <html>
    <body>
    <h2>Test Section</h2>
    <p>This is a paragraph with <strong>bold text</strong> and <a href="/link">a link</a> and <code>inline code</code>.</p>
    <p>Another paragraph with <span class="custom">span element</span> and more text.</p>
    <p>Short paragraph.</p>
    <h2>Another Section</h2>
    <p>This paragraph has <em>emphasis</em> and <a href="/another">multiple</a> <a href="/links">links</a>.</p>
    </body>
    </html>
    """

    # Parse with BeautifulSoup to test extraction
    soup = BeautifulSoup(test_html, "html.parser")

    print("Testing paragraph extraction with inline elements:")
    print("=" * 60)

    # Test extraction of paragraphs
    paragraphs = soup.find_all("p")
    for i, p in enumerate(paragraphs, 1):
        # This is how our splitter extracts text
        text = p.get_text(separator=" ", strip=True)
        text = " ".join(text.split())
        # Apply the same regex fix as in the splitter
        import re

        text = re.sub(r"\s+([.,:;!?])", r"\1", text)
        print(f"\nParagraph {i}:")
        print(f"  Raw HTML: {str(p)[:100]}...")
        print(f"  Extracted text: {text}")
        print(f"  Length: {len(text)} chars")

    # Now test with actual splitter
    print("\n" + "=" * 60)
    print("Testing with HierarchicalHTMLSplitter:")
    print("=" * 60)

    # Write test HTML to temp file
    import tempfile

    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False) as f:
        f.write(test_html)
        temp_file = f.name

    # Test splitter
    splitter = HierarchicalHTMLSplitter(
        min_paragraph_length=20,  # Lower threshold for testing
        max_paragraphs_per_chunk=2,
        overlap_paragraphs=1,
    )

    chunks = splitter.split_html_file(temp_file)

    print(f"\nGenerated {len(chunks)} chunks:")
    for i, chunk in enumerate(chunks, 1):
        print(f"\nChunk {i}:")
        print(f"  Section: {chunk.metadata.get('section', 'None')}")
        print(f"  Content: {chunk.page_content}")

    # Clean up
    import os

    os.unlink(temp_file)


if __name__ == "__main__":
    test_inline_elements()
