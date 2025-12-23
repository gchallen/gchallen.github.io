#!/usr/bin/env python3
"""Test that code blocks create section breaks in the hierarchical splitter."""

import sys

sys.path.insert(0, ".")

import os
import tempfile

from vector_db_builder import HierarchicalHTMLSplitter


def test_code_block_splitting():
    """Test that paragraphs are not mixed across code blocks."""

    # Create test HTML with paragraphs and code blocks
    test_html = """
    <!DOCTYPE html>
    <html>
    <body>
    <h2>Programming Example</h2>
    <p>This paragraph explains the concept before the code. It should be in its own section separate from the paragraph after the code block.</p>
    
    <pre><code>
    function example() {
        console.log("Hello World");
        return true;
    }
    </code></pre>
    
    <p>This paragraph explains the code after the example. It should be in a different section from the paragraph before the code block.</p>
    
    <p>This second paragraph after the code continues the explanation and should be in the same section as the previous paragraph.</p>
    
    <div class="code-block">
        <pre><code>
        const result = example();
        </code></pre>
    </div>
    
    <p>This final paragraph comes after another code block and should be in its own section.</p>
    </body>
    </html>
    """

    # Write to temp file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False) as f:
        f.write(test_html)
        temp_file = f.name

    try:
        # Test splitter
        splitter = HierarchicalHTMLSplitter(
            min_paragraph_length=50,  # Lower for testing
            max_paragraphs_per_chunk=2,
            overlap_paragraphs=0,  # No overlap for clearer testing
        )

        print("Testing code block section splitting:")
        print("=" * 60)

        chunks = splitter.split_html_file(temp_file)

        print(f"\nGenerated {len(chunks)} chunks:")
        for i, chunk in enumerate(chunks, 1):
            print(f"\n--- Chunk {i} ---")
            print(f"Section: {chunk.metadata.get('section', 'None')}")
            print(f"Content ({len(chunk.page_content)} chars):")
            print(chunk.page_content)

            # Check if chunk spans across code blocks (it shouldn't)
            has_before = "before the code" in chunk.page_content
            has_after = "after the example" in chunk.page_content
            has_final = "final paragraph" in chunk.page_content

            print(
                f"Debug: has_before={has_before}, has_after={has_after}, has_final={has_final}"
            )

            if has_before and has_after:
                print("❌ ERROR: Chunk spans across first code block!")
            elif has_after and has_final:
                print("❌ ERROR: Chunk spans across second code block!")
            else:
                print("✅ Chunk properly separated by code blocks")

    finally:
        # Clean up
        os.unlink(temp_file)


if __name__ == "__main__":
    test_code_block_splitting()
