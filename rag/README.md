# RAG (Retrieval-Augmented Generation) System

This directory contains the RAG implementation for the geoffreychallen.com website, following the [LangChain RAG tutorial](https://python.langchain.com/docs/tutorials/rag/).

## Setup

### 1. Create and activate a Python virtual environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in this directory with your Azure OpenAI credentials:

```env
AZURE_OPENAI_CHAT_ENDPOINT=your_chat_endpoint_url
AZURE_OPENAI_CHAT_API_KEY=your_chat_api_key
AZURE_OPENAI_EMBEDDINGS_ENDPOINT=your_embeddings_endpoint_url
AZURE_OPENAI_EMBEDDINGS_API_KEY=your_embeddings_api_key
```

## Production Usage

### Build Vector Database

```bash
# Build production vector database (incremental)
python vector_db_builder.py

# Build with custom options
python vector_db_builder.py --html-dir ../html --output-dir vector_db --chunk-size 1000

# Clean build (ignore existing database)
python vector_db_builder.py --clean
```

### Load and Query Database

```python
from vector_db_loader import load_vector_db

# Load pre-built database
db = load_vector_db("vector_db")

# Search for similar content
results = db.search("teaching computer science", k=5)
for result in results:
    print(f"Citation: {result['citation']}")
    print(f"Content: {result['content'][:200]}...")
```

### Command Line Search

```bash
# Quick search from command line
python vector_db_loader.py "machine learning"
python vector_db_loader.py "student engagement" custom_vector_db
```

## RAG Server

The system includes a FastAPI server providing semantic search and conversational AI endpoints.

### Running the Server

```bash
# Development mode (localhost:8000)
python run_server.py

# Production mode (0.0.0.0:8000)
python run_server.py --production
```

### API Endpoints

#### Semantic Search
```bash
curl -X POST "http://localhost:8000/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "teaching programming", "k": 5}'
```

#### Conversational Chat
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What do you think about lecturing?", "session_id": "user123"}'
```

#### Session Management
```bash
# Get conversation history
curl "http://localhost:8000/sessions/user123/history"

# Clear conversation history
curl -X DELETE "http://localhost:8000/sessions/user123"
```

### Server Features

- **Semantic Search**: Vector similarity search over website content
- **Conversational RAG**: Chat with memory and context awareness
- **Session Management**: Per-user conversation histories
- **Citation Support**: All responses include source references
- **CORS Enabled**: Ready for web frontend integration

## Testing

### Quick Testing (Recommended)

```bash
# Run optimized test suite (minimal API usage)
cd tests && python run_fast_tests.py

# Run minimal test (fastest, 1-2 embedding calls)
cd tests && python test_minimal_embeddings.py
```

### Individual Tests

```bash
cd tests

# Basic functionality tests (no embeddings)
python test_endpoints.py                    # Test Azure OpenAI endpoints (~3s)
python test_document_processing.py          # Test HTML loading/splitting (~1s)

# Embedding tests (API usage)
python test_build_time_vector_db.py         # Build-time vector DB (~30s, optimized)
python test_incremental_embeddings.py       # Incremental updates (~60s, optimized)
```

### Using pytest

```bash
# Run all tests with pytest
pytest tests/

# Run with verbose output
pytest tests/ -v

# Run specific test file
pytest tests/test_endpoints.py -v

# Show print statements during tests
pytest tests/ -s
```

### Test Optimization

Tests have been optimized to reduce API usage:
- **Fewer files**: Process only 2-3 HTML files instead of all
- **Larger chunks**: 2000 character chunks instead of 1000 (fewer API calls)
- **Minimal test**: Single smallest file for quick validation
- **Isolated databases**: Test vector databases stored in `tests/` directory

## Project Structure

```
rag/
├── .env                    # Environment variables (not in git)
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── requirements.txt       # Python dependencies
├── pyproject.toml         # Pytest configuration
├── citation_utils.py      # Citation extraction utilities
├── vector_db_builder.py   # Production database builder
├── vector_db_loader.py    # Production database loader
├── rag_server.py          # FastAPI server with RAG endpoints
├── run_server.py          # Server launcher script
├── vector_db/             # Production vector database (created by builder)
├── html/                  # Generated HTML files (created by build)
├── tests/                 # Test files and test databases
│   ├── test_endpoints.py           # Test Azure OpenAI endpoints
│   ├── test_document_processing.py # Test HTML loading/splitting
│   ├── test_build_time_vector_db.py # Test build-time approach
│   ├── test_incremental_embeddings.py # Test incremental updates
│   ├── test_minimal_embeddings.py  # Test minimal pipeline
│   ├── test_citations.py           # Test citation extraction
│   ├── test_rag_server.py          # Test RAG server endpoints
│   ├── run_fast_tests.py           # Optimized test runner
│   └── *vector_db/                 # Test vector databases (git ignored)
└── venv/                  # Python virtual environment (not in git)
```

## Development Workflow

1. **Always activate the virtual environment** before working:
   ```bash
   source venv/bin/activate
   ```

2. **Run tests** to ensure everything is working:
   ```bash
   cd tests && python run_fast_tests.py
   ```

3. **Build production database** after content changes:
   ```bash
   python vector_db_builder.py
   ```

4. **Check installed packages**:
   ```bash
   pip list
   ```

5. **Install new packages** and update requirements:
   ```bash
   pip install package_name
   pip freeze > requirements.txt
   ```

6. **Deactivate virtual environment** when done:
   ```bash
   deactivate
   ```

## Production Deployment

1. **Build HTML from MDX**: `npm run build:mdx`
2. **Build vector database**: `python vector_db_builder.py`
3. **Ship with container**: Include `vector_db/` directory in Docker build
4. **Runtime loading**: Use `vector_db_loader.py` to load database on startup

The incremental approach means only changed content gets reprocessed, making CI/CD builds fast and cost-effective.

## Features

### ✅ **Implemented**

1. **✅ Document Loading**: Load and parse HTML content generated from MDX
2. **✅ Text Splitting**: Split documents into chunks with HTML-aware splitting
3. **✅ Vector Store**: FAISS-based in-memory vector database with disk persistence
4. **✅ Build-time Embeddings**: Generate embeddings during build, ship with container
5. **✅ Incremental Updates**: Only reprocess changed content using content hashing
6. **✅ Citation Support**: Every chunk maintains reference to source page with relative URLs

### ✅ **Recently Implemented**

7. **✅ RAG Server**: FastAPI server with semantic search and conversational endpoints
8. **✅ Memory Management**: Session-based conversation history with LangChain
9. **✅ Context-Aware Queries**: Intelligent query reformulation using conversation history

### 🚧 **Next Steps**

1. **Frontend Integration**: Create web UI to interact with RAG endpoints
2. **Production Deployment**: Deploy RAG server alongside main website
3. **Advanced Features**: Multi-step retrieval, query expansion, response ranking

## Citation Support

All document chunks maintain proper citation information:

```python
# Search results include citation data
results = vector_db.search("teaching", k=3)
for result in results:
    print(f"Citation: {result['citation']}")
    print(f"URL: {result['citation_url']}")
    print(f"Title: {result['page_title']}")
```

Citations are automatically extracted from HTML metadata:
- **Relative URLs**: `/bio`, `/essays/2021-06-10-chalkface-nostalgia`
- **Page titles**: From HTML `<title>` or `<meta name="title">`
- **Publication dates**: From `<meta name="published">` (for essays)

## Common Commands Reference

```bash
# Virtual environment
python3 -m venv venv              # Create venv
source venv/bin/activate          # Activate venv
deactivate                        # Deactivate venv

# Package management
pip install -r requirements.txt   # Install all dependencies
pip install package_name          # Install specific package
pip freeze > requirements.txt     # Update requirements file
pip list                          # List installed packages

# Testing
pytest                            # Run all tests
pytest -v                         # Verbose output
pytest -s                         # Show print statements
pytest test_file.py              # Run specific file
pytest -k "test_name"            # Run tests matching pattern

# Python
python script.py                 # Run a Python script
python -m module_name            # Run a Python module
python -c "print('hello')"       # Run inline Python code
```

## Troubleshooting

### Import errors
- Make sure virtual environment is activated
- Verify packages are installed: `pip list`
- Reinstall requirements: `pip install -r requirements.txt`

### Environment variable issues
- Check `.env` file exists and has correct values
- Verify variables are loaded: `python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('AZURE_OPENAI_CHAT_ENDPOINT'))"`

### API errors
- Verify API keys are correct
- Check endpoint URLs are complete (including `/openai/deployments/...`)
- Run endpoint tests: `python test_endpoints.py`