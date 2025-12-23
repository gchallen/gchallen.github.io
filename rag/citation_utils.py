#!/usr/bin/env python3
"""
Utilities for extracting and managing citation information from HTML documents.
"""

from pathlib import Path

from bs4 import BeautifulSoup


def extract_page_metadata(html_file_path: str) -> dict[str, str]:
    """
    Extract citation metadata from HTML file.
    Returns dict with url, title, description, published, etc.
    """
    try:
        with open(html_file_path, encoding="utf-8") as f:
            content = f.read()

        soup = BeautifulSoup(content, "lxml")

        metadata = {}

        # Extract meta tags
        meta_tags = soup.find_all("meta")
        for tag in meta_tags:
            name = tag.get("name")
            content_val = tag.get("content")

            if name and content_val:
                metadata[name] = content_val

        # Get title from title tag if not in meta
        if "title" not in metadata:
            title_tag = soup.find("title")
            if title_tag:
                metadata["title"] = title_tag.get_text().strip()

        return metadata

    except Exception as e:
        print(f"Warning: Could not extract metadata from {html_file_path}: {e}")
        return {}


def get_citation_url(html_file_path: str) -> str:
    """
    Get the citation URL for a given HTML file.
    Returns relative URL suitable for citations.
    """
    metadata = extract_page_metadata(html_file_path)

    # Use URL from metadata if available
    if "url" in metadata:
        url = metadata["url"]
        # Ensure it starts with / for absolute path
        if not url.startswith("/"):
            url = "/" + url
        return url

    # Fallback: convert file path to URL
    file_path = Path(html_file_path)

    # Remove html/ prefix and .html suffix
    if file_path.name == "index.html":
        # index.html -> parent directory
        url = "/" + str(file_path.parent.relative_to("html"))
    else:
        # regular file -> remove .html extension
        url = "/" + str(file_path.relative_to("html")).replace(".html", "")

    # Clean up the URL
    url = url.replace("\\", "/")  # Windows compatibility
    if url == "/.":
        url = "/"

    return url


def format_citation(metadata: dict[str, str]) -> str:
    """
    Format citation information for display.
    Returns a human-readable citation string.
    """
    parts = []

    # Add title
    if "title" in metadata and metadata["title"]:
        parts.append(f'"{metadata["title"]}"')

    # Add URL
    if "citation_url" in metadata:
        parts.append(f"({metadata['citation_url']})")

    # Add publication date if available
    if "published" in metadata:
        try:
            from datetime import datetime

            pub_date = datetime.fromisoformat(
                metadata["published"].replace("Z", "+00:00")
            )
            parts.append(f"Published: {pub_date.strftime('%B %d, %Y')}")
        except Exception:
            pass

    return " - ".join(parts) if parts else "Unknown source"


def enrich_chunk_metadata(chunk_metadata: dict, html_file_path: str) -> dict:
    """
    Enrich chunk metadata with citation information.
    """
    # Get page metadata
    page_metadata = extract_page_metadata(html_file_path)

    # Add citation URL
    citation_url = get_citation_url(html_file_path)

    # Create enriched metadata
    enriched = {
        **chunk_metadata,
        "citation_url": citation_url,
        "page_title": page_metadata.get("title", ""),
        "page_description": page_metadata.get("description", ""),
    }

    # Add publication date if available
    if "published" in page_metadata:
        enriched["published"] = page_metadata["published"]

    # Add source file for debugging
    enriched["source_file"] = html_file_path

    return enriched
