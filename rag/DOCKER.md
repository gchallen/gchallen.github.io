# Docker Deployment Guide

This guide covers deploying the RAG server using Docker and Docker Compose.

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- Vector database and HTML files built: `npm run build:mdx` (from main project directory)
- Environment variables configured

**Important**: The Docker build copies the vector database and HTML files into the container. Make sure to run `npm run build:mdx` before building the Docker image.

### 2. Setup Environment

```bash
# Copy and configure environment file
cp .env.example .env
# Edit .env with your Azure OpenAI credentials
```

### 3. Build and Run

```bash
# From main project directory
npm run rag:build  # Build container
npm run rag:run    # Run in production mode
```

Or from the `rag/` directory:

```bash
docker compose up rag-server
```

## Development Mode

For development with hot reload:

```bash
npm run rag:dev
```

This runs the server in development mode with source code mounted as a volume.

## Manual Docker Commands

### Build Image

```bash
cd rag
docker build -t geoffreychallen/rag-server:latest .
```

### Run Container

```bash
docker run -d \
  --name rag-server \
  -p 8000:8000 \
  -e AZURE_OPENAI_CHAT_ENDPOINT="$AZURE_OPENAI_CHAT_ENDPOINT" \
  -e AZURE_OPENAI_CHAT_API_KEY="$AZURE_OPENAI_CHAT_API_KEY" \
  -e AZURE_OPENAI_EMBEDDINGS_ENDPOINT="$AZURE_OPENAI_EMBEDDINGS_ENDPOINT" \
  -e AZURE_OPENAI_EMBEDDINGS_API_KEY="$AZURE_OPENAI_EMBEDDINGS_API_KEY" \
  geoffreychallen/rag-server:latest
```

## Production Deployment

### Container Requirements

- **Vector Database**: Built into the container during build process
- **HTML Content**: Built into the container during build process
- **Environment**: Provide Azure OpenAI credentials via environment variables
- **Port**: Expose port 8000
- **Health Check**: Built-in health check at `GET /`

### Environment Variables

| Variable                           | Required | Description                               |
| ---------------------------------- | -------- | ----------------------------------------- |
| `AZURE_OPENAI_CHAT_ENDPOINT`       | Yes      | Chat completion endpoint URL              |
| `AZURE_OPENAI_CHAT_API_KEY`        | Yes      | Chat API key                              |
| `AZURE_OPENAI_EMBEDDINGS_ENDPOINT` | Yes      | Embeddings endpoint URL                   |
| `AZURE_OPENAI_EMBEDDINGS_API_KEY`  | Yes      | Embeddings API key                        |
| `PORT`                             | No       | Server port (default: 8000)               |
| `VECTOR_DB_PATH`                   | No       | Vector database path (default: vector_db) |

### Docker Compose Production

```yaml
version: "3.8"
services:
  rag-server:
    image: geoffreychallen/rag-server:latest
    ports:
      - "8000:8000"
    environment:
      - AZURE_OPENAI_CHAT_ENDPOINT=${AZURE_OPENAI_CHAT_ENDPOINT}
      - AZURE_OPENAI_CHAT_API_KEY=${AZURE_OPENAI_CHAT_API_KEY}
      - AZURE_OPENAI_EMBEDDINGS_ENDPOINT=${AZURE_OPENAI_EMBEDDINGS_ENDPOINT}
      - AZURE_OPENAI_EMBEDDINGS_API_KEY=${AZURE_OPENAI_EMBEDDINGS_API_KEY}
    # No volumes needed - vector_db and html are built into the container
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Kubernetes Deployment

### ConfigMap for Environment

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rag-server-config
data:
  AZURE_OPENAI_CHAT_ENDPOINT: "https://your-resource.openai.azure.com/..."
  AZURE_OPENAI_EMBEDDINGS_ENDPOINT: "https://your-resource.openai.azure.com/..."
```

### Secret for API Keys

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: rag-server-secrets
type: Opaque
stringData:
  AZURE_OPENAI_CHAT_API_KEY: "your-chat-key"
  AZURE_OPENAI_EMBEDDINGS_API_KEY: "your-embeddings-key"
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: rag-server
  template:
    metadata:
      labels:
        app: rag-server
    spec:
      containers:
        - name: rag-server
          image: geoffreychallen/rag-server:latest
          ports:
            - containerPort: 8000
          envFrom:
            - configMapRef:
                name: rag-server-config
            - secretRef:
                name: rag-server-secrets
          # No volume mounts needed - content is built into container
          livenessProbe:
            httpGet:
              path: /
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
      # No volumes needed - content is built into container
```

## Monitoring

The container includes:

- Health check endpoint at `GET /`
- Structured logging to stdout
- Graceful shutdown handling
- Non-root user execution for security

## Troubleshooting

### Common Issues

1. **Container won't start**: Check environment variables are set
2. **Vector database not found**: Ensure `npm run build:mdx` was run before building container
3. **HTML content missing**: Ensure `npm run build:mdx` was run before building container
4. **API errors**: Verify Azure OpenAI credentials and endpoints
5. **Build failures**: Check that `vector_db/` and `html/` directories exist with content

### Debugging

```bash
# Check container logs
docker logs rag-server

# Execute into running container
docker exec -it rag-server bash

# Test health endpoint
curl http://localhost:8000/
```
