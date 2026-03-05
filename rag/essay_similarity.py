#!/usr/bin/env python3
"""
Compute essay similarity using embeddings and output navigation data.
Generates output/essay-navigation.json with prev/next and similar/dissimilar links.
"""

import hashlib
import json
import os
import re
from datetime import datetime
from pathlib import Path

import numpy as np
from bs4 import BeautifulSoup
from dateutil import parser as dateparser
from dotenv import load_dotenv
from langchain_openai import AzureOpenAIEmbeddings

from citation_utils import extract_page_metadata

load_dotenv()

CACHE_FILE = "essay_embeddings_cache.json"
OUTPUT_FILE = "../output/essay-navigation.json"
HTML_DIR = "html/essays"


def get_essay_text(html_path: str) -> str:
    """Extract plain text from an HTML essay file."""
    with open(html_path, encoding="utf-8") as f:
        content = f.read()
    soup = BeautifulSoup(content, "html.parser")
    body = soup.find("body")
    if not body:
        return ""
    return body.get_text(separator=" ", strip=True)


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def main():
    html_dir = Path(HTML_DIR)
    html_files = sorted(html_dir.rglob("*.html"))

    if not html_files:
        print("No HTML essay files found, writing empty navigation")
        output_path = Path(OUTPUT_FILE)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump({}, f)
        return

    # Extract metadata and text for each essay
    essays = []
    for html_file in html_files:
        meta = extract_page_metadata(str(html_file))
        # Skip drafts
        if meta.get("draft") == "true":
            continue
        # Skip essays without a published date
        if not meta.get("published"):
            continue

        text = get_essay_text(str(html_file))
        if not text:
            continue

        url = meta.get("url", "")
        essays.append(
            {
                "title": meta.get("title", ""),
                "url": "/" + url if not url.startswith("/") else url,
                "published": meta["published"],
                "text": text,
                "hash": content_hash(text),
            }
        )

    print(f"Found {len(essays)} published essays")

    if not essays:
        output_path = Path(OUTPUT_FILE)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump({}, f)
        return

    # Sort chronologically by published date (parse JS date strings)
    def parse_date(date_str: str) -> datetime:
        # Remove timezone name in parentheses: "(Central Standard Time)" etc.
        cleaned = re.sub(r"\s*\([^)]*\)\s*$", "", date_str)
        return dateparser.parse(cleaned)

    essays.sort(key=lambda e: parse_date(e["published"]))

    # Load embedding cache
    cache = {}
    if Path(CACHE_FILE).exists():
        with open(CACHE_FILE) as f:
            cache = json.load(f)

    # Set up embeddings model
    embeddings_endpoint = os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
    embeddings_api_key = os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY")
    if not embeddings_endpoint or not embeddings_api_key:
        raise ValueError("Missing Azure OpenAI embeddings credentials in .env")

    match = re.search(r"/deployments/([^/]+)/", embeddings_endpoint)
    deployment_name = match.group(1) if match else "text-embedding-3-large"
    base_url = embeddings_endpoint.split("/openai/")[0]
    api_version_match = re.search(r"api-version=([^&]+)", embeddings_endpoint)
    api_version = api_version_match.group(1) if api_version_match else "2023-05-15"

    embeddings_model = AzureOpenAIEmbeddings(
        azure_endpoint=base_url,
        azure_deployment=deployment_name,
        api_key=embeddings_api_key,
        api_version=api_version,
    )

    # Compute embeddings, using cache where possible
    vectors = []
    texts_to_embed = []
    embed_indices = []

    for i, essay in enumerate(essays):
        if essay["hash"] in cache:
            vectors.append(np.array(cache[essay["hash"]], dtype=np.float32))
        else:
            vectors.append(None)
            texts_to_embed.append(essay["text"])
            embed_indices.append(i)

    if texts_to_embed:
        print(
            f"Embedding {len(texts_to_embed)} new essays (cached: {len(essays) - len(texts_to_embed)})"
        )
        import time

        batch_size = 5
        new_embeddings = []
        for batch_start in range(0, len(texts_to_embed), batch_size):
            batch = texts_to_embed[batch_start : batch_start + batch_size]
            for attempt in range(5):
                try:
                    batch_embeddings = embeddings_model.embed_documents(batch)
                    new_embeddings.extend(batch_embeddings)
                    break
                except Exception as e:
                    if "429" in str(e) and attempt < 4:
                        wait = 60 * (attempt + 1)
                        print(f"Rate limited, waiting {wait}s...")
                        time.sleep(wait)
                    else:
                        raise
        for idx, embedding in zip(embed_indices, new_embeddings):
            vectors[idx] = np.array(embedding, dtype=np.float32)
            cache[essays[idx]["hash"]] = embedding
    else:
        print("All essays cached, no new embeddings needed")

    # Save updated cache
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)

    # Normalize vectors for cosine similarity
    matrix = np.array(vectors, dtype=np.float32)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    normalized = matrix / norms

    # Pairwise cosine similarity
    similarity = normalized @ normalized.T

    # Build navigation JSON
    navigation = {}
    for i, essay in enumerate(essays):
        # Strip leading slash for the key to match frontmatter url format
        key = essay["url"].lstrip("/")

        # Previous/next (chronological)
        prev_essay = essays[i - 1] if i > 0 else None
        next_essay = essays[i + 1] if i < len(essays) - 1 else None

        # Similar: top 3 most similar (excluding self)
        sim_scores = similarity[i].copy()
        sim_scores[i] = -1  # exclude self
        similar_indices = np.argsort(sim_scores)[::-1][:3]

        # Dissimilar: top 3 least similar
        dissimilar_indices = np.argsort(sim_scores)[:3]
        # Filter out the -1 (self) entry
        dissimilar_indices = [idx for idx in dissimilar_indices if sim_scores[idx] >= 0][:3]

        navigation[key] = {
            "previous": {"title": prev_essay["title"], "url": prev_essay["url"]}
            if prev_essay
            else None,
            "next": {"title": next_essay["title"], "url": next_essay["url"]}
            if next_essay
            else None,
            "similar": [
                {"title": essays[j]["title"], "url": essays[j]["url"]} for j in similar_indices
            ],
            "dissimilar": [
                {"title": essays[j]["title"], "url": essays[j]["url"]} for j in dissimilar_indices
            ],
        }

    # Write output
    output_path = Path(OUTPUT_FILE)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(navigation, f, indent=2)

    print(f"Wrote navigation data for {len(navigation)} essays to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
