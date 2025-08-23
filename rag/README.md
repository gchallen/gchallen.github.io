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

## Testing

### Run all tests

```bash
# Using pytest
pytest

# Or run specific test file
pytest test_endpoints.py

# With verbose output
pytest -v

# Show print statements during tests
pytest -s
```

### Run individual test functions

```bash
# Test only the chat endpoint
pytest test_endpoints.py::test_chat_endpoint -v

# Test only the embeddings endpoint
pytest test_endpoints.py::test_embeddings_endpoint -v
```

### Run tests directly with Python

```bash
python test_endpoints.py
```

## Project Structure

```
rag/
├── .env                    # Environment variables (not in git)
├── README.md              # This file
├── requirements.txt       # Python dependencies
├── test_endpoints.py      # Tests for Azure OpenAI endpoints
├── venv/                  # Python virtual environment (not in git)
└── (future files)         # Indexing, retrieval, and RAG chain implementation
```

## Development Workflow

1. **Always activate the virtual environment** before working:
   ```bash
   source venv/bin/activate
   ```

2. **Run tests** to ensure endpoints are working:
   ```bash
   pytest test_endpoints.py -v
   ```

3. **Check installed packages**:
   ```bash
   pip list
   ```

4. **Install new packages** and update requirements:
   ```bash
   pip install package_name
   pip freeze > requirements.txt
   ```

5. **Deactivate virtual environment** when done:
   ```bash
   deactivate
   ```

## Next Steps

Following the RAG tutorial, the next implementation steps will be:

1. **Document Loading**: Load and parse website content (MDX files, pages)
2. **Text Splitting**: Split documents into chunks suitable for embeddings
3. **Vector Store**: Create and populate a vector database (ChromaDB or FAISS)
4. **Retrieval Chain**: Implement document retrieval based on queries
5. **RAG Chain**: Combine retrieval with LLM generation
6. **API Integration**: Create endpoints for the website to use

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