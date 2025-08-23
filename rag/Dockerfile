# RAG Server Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (excluding items in .dockerignore)
COPY . .

# Verify required directories exist and have content
RUN ls -la vector_db/ && echo "Vector DB files:" && ls -la vector_db/ || (echo "ERROR: vector_db directory missing or empty!" && exit 1)
RUN ls -la html/ && echo "HTML files:" && find html/ -name "*.html" | head -5 || (echo "ERROR: html directory missing or empty!" && exit 1)

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash rag && \
    chown -R rag:rag /app
USER rag

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Set default environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Default command
CMD ["python", "run_server.py", "--production"]