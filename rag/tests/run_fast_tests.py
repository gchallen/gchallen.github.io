#!/usr/bin/env python3
"""
Fast test runner with minimal API usage.
Runs a subset of tests optimized for speed and reduced API calls.
"""

import subprocess
import sys
import time
from pathlib import Path


def run_command(cmd, description):
    """Run a command and report timing."""
    print(f"\n🧪 {description}")
    print(f"Command: {cmd}")

    start_time = time.time()
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, check=True
        )
        duration = time.time() - start_time

        print(f"✅ Completed in {duration:.1f}s")
        if result.stdout:
            # Show last few lines of output for context
            lines = result.stdout.strip().split("\n")
            relevant_lines = [
                line
                for line in lines[-10:]
                if "✅" in line or "📊" in line or "💰" in line
            ]
            if relevant_lines:
                for line in relevant_lines:
                    print(f"   {line}")
        return True
    except subprocess.CalledProcessError as e:
        duration = time.time() - start_time
        print(f"❌ Failed in {duration:.1f}s")
        if e.stderr:
            print("Error:", e.stderr[-500:])  # Last 500 chars
        return False


def main():
    """Run optimized test suite."""
    print("🚀 Running RAG System Tests (Fast Mode)")
    print("=" * 50)

    # Check prerequisites
    if not Path("../html").exists():
        print("❌ HTML files not found. Run 'npm run build:mdx' first.")
        sys.exit(1)

    if not Path("../.env").exists():
        print("❌ .env file not found. Add Azure OpenAI credentials.")
        sys.exit(1)

    print("✅ Prerequisites check passed")

    total_start = time.time()
    passed = 0
    failed = 0

    # Test suite (in order of increasing complexity/time)
    tests = [
        {
            "cmd": "python test_endpoints.py",
            "desc": "Testing Azure OpenAI endpoints (quick)",
            "estimated": "3s",
        },
        {
            "cmd": "python test_document_processing.py",
            "desc": "Testing document loading and splitting (quick)",
            "estimated": "1s",
        },
        {
            "cmd": "python test_build_time_vector_db.py",
            "desc": "Testing build-time vector database (2 files, larger chunks)",
            "estimated": "15-30s",
        },
        {
            "cmd": "python test_incremental_embeddings.py",
            "desc": "Testing incremental embedding updates (optimized)",
            "estimated": "30-45s",
        },
    ]

    # Run tests
    for i, test in enumerate(tests, 1):
        print(f"\n{'=' * 50}")
        print(f"Test {i}/{len(tests)}: {test['desc']}")
        print(f"Estimated time: {test['estimated']}")
        print(f"{'=' * 50}")

        if run_command(test["cmd"], test["desc"]):
            passed += 1
        else:
            failed += 1

    # Summary
    total_time = time.time() - total_start

    print(f"\n{'=' * 50}")
    print("🎯 TEST SUMMARY")
    print(f"{'=' * 50}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⏱️  Total time: {total_time:.1f}s")

    if failed == 0:
        print("\n🎉 All tests passed! RAG system is ready.")
        print("💡 Optimizations used:")
        print("   - Only 2-3 files processed per test")
        print("   - Larger chunk sizes (fewer API calls)")
        print("   - Incremental processing demonstrated")
    else:
        print("\n⚠️  Some tests failed. Check output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
