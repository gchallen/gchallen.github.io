#!/usr/bin/env python3

"""
Production server runner with enhanced monitoring and management.
"""

import os
import signal
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv


def check_production_requirements():
    """Check that all production requirements are met."""
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
        print("\nPlease check your .env file or environment configuration.")
        return False

    # Check if vector database exists
    if not os.path.exists("vector_db"):
        print("❌ Vector database not found!")
        print("Run the build pipeline first to create the vector database.")
        return False

    # Check if gunicorn is installed
    try:
        import gunicorn  # noqa: F401
    except ImportError:
        print("❌ Gunicorn not installed!")
        print("Install requirements: pip install -r requirements.txt")
        return False

    return True


def setup_signal_handlers():
    """Set up signal handlers for graceful shutdown."""

    def signal_handler(sig, frame):
        print(f"\n🛑 Received signal {sig}, shutting down gracefully...")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)


def main():
    """Run the production server."""
    print("🚀 Starting RAG server in production mode...")

    # Check requirements
    if not check_production_requirements():
        sys.exit(1)

    print("✅ Production requirements check passed")

    # Set up signal handlers
    setup_signal_handlers()

    # Configuration
    port = int(os.getenv("PORT", 8000))
    workers = int(os.getenv("WORKERS", 4))
    log_level = os.getenv("LOG_LEVEL", "info")

    print("📊 Configuration:")
    print(f"   - Port: {port}")
    print(f"   - Workers: {workers}")
    print(f"   - Log level: {log_level}")

    # Create logs directory
    Path("logs").mkdir(exist_ok=True)

    # Build gunicorn command
    cmd = ["gunicorn", "--config", "gunicorn.conf.py", "rag_server:app"]

    print(f"🎯 Starting with command: {' '.join(cmd)}")

    try:
        # Run gunicorn
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Received keyboard interrupt, shutting down...")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed with exit code {e.returncode}")
        sys.exit(e.returncode)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
