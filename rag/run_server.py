#!/usr/bin/env python3

"""
Simple script to run the RAG server with proper environment setup.
"""

import os
import sys
from dotenv import load_dotenv


def main():
    """Run the RAG server."""
    # Load environment variables
    load_dotenv()

    # Check required environment variables
    required_vars = [
        "AZURE_OPENAI_CHAT_ENDPOINT",
        "AZURE_OPENAI_CHAT_API_KEY",
        "AZURE_OPENAI_EMBEDDINGS_ENDPOINT",
        "AZURE_OPENAI_EMBEDDINGS_API_KEY",
    ]

    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease check your .env file.")
        sys.exit(1)

    # Check if vector database exists
    if not os.path.exists("vector_db"):
        print("❌ Vector database not found!")
        print("Run the build pipeline first: npm run build:mdx")
        sys.exit(1)

    print("✅ Environment check passed")
    print("🚀 Starting RAG server...")

    import uvicorn

    # Determine host and port
    host = "0.0.0.0"  # Use 0.0.0.0 for Docker container accessibility
    port = 8000
    reload = True
    workers = 1

    if len(sys.argv) > 1 and sys.argv[1] == "--production":
        port = int(os.getenv("PORT", 8000))
        reload = False  # Disable reload in production
        workers = int(os.getenv("WORKERS", 4))  # 4 workers for production
        print(f"Production mode: {host}:{port} with {workers} workers")
    else:
        print(f"Development mode: {host}:{port}")
        print("Add --production flag for production mode")

    # Use import string format for reload to work properly
    if reload:
        # Development mode - single worker with reload
        uvicorn.run(
            "rag_server:app", host=host, port=port, reload=reload, access_log=False
        )
    else:
        # Production mode - multiple workers, no reload
        uvicorn.run(
            "rag_server:app",
            host=host,
            port=port,
            workers=workers,
            reload=False,
            access_log=False,
            log_level="info",
        )


if __name__ == "__main__":
    main()
