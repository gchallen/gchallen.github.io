# RAG Server Production Deployment Guide

This guide covers deploying the RAG server in a production environment with enhanced reliability, security, and monitoring.

## Production Features

### ✅ Reliability
- **Multi-worker setup** with Gunicorn (4 workers by default)
- **Azure API retry logic** with exponential backoff
- **Memory management** with automatic conversation cleanup
- **Health checks** and graceful shutdown handling

### ✅ Security
- **CORS restrictions** to specific domains
- **Rate limiting** (20 chat requests/minute per IP)
- **Non-root Docker user**
- **Input validation** and error handling

### ✅ Monitoring
- **Comprehensive logging** with timing and error details
- **Request/response tracking**
- **Background cleanup monitoring**
- **Health check endpoints**

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env with your Azure OpenAI credentials

# 2. Build and run
docker-compose -f docker-compose.prod.yml up -d

# 3. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Option 2: Direct Python

```bash
# 1. Install production dependencies
pip install -r requirements-prod.txt

# 2. Run production server
python run_production.py
```

### Option 3: Manual Gunicorn

```bash
# Set environment variables first, then:
gunicorn --config gunicorn.conf.py rag_server:app
```

## Environment Configuration

### Required Variables
```bash
AZURE_OPENAI_CHAT_ENDPOINT=https://your-endpoint.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-01
AZURE_OPENAI_CHAT_API_KEY=your-chat-api-key
AZURE_OPENAI_EMBEDDINGS_ENDPOINT=https://your-endpoint.openai.azure.com/openai/deployments/text-embedding-ada-002/embeddings?api-version=2024-02-01
AZURE_OPENAI_EMBEDDINGS_API_KEY=your-embeddings-api-key
```

### Optional Production Variables
```bash
PORT=8000                    # Server port
WORKERS=4                    # Number of Gunicorn workers
LOG_LEVEL=info              # Logging level
ALLOWED_ORIGINS=https://geoffreychallen.com,https://www.geoffreychallen.com
VECTOR_DB_PATH=vector_db    # Path to vector database
```

## Performance Tuning

### Worker Configuration
- **CPU-bound**: `WORKERS = 2 * CPU_cores + 1`
- **I/O-bound**: `WORKERS = 4 * CPU_cores` (current default)

### Memory Management
- **Conversation limit**: 20 messages per session
- **Session timeout**: 24 hours
- **Cleanup interval**: 60 minutes

### Rate Limiting
- **Health checks**: 60/minute
- **Search requests**: 30/minute per IP
- **Chat requests**: 20/minute per IP

## Monitoring and Logs

### Log Locations
- **Container logs**: `docker-compose logs`
- **File logs**: `./logs/rag_server.log`
- **Access logs**: stdout (structured JSON)

### Key Metrics to Monitor
- Response times (logged for each request)
- Error rates and types
- Azure API rate limit hits
- Memory usage and session counts
- Worker health and restarts

### Log Examples

**Successful Request:**
```
2024-01-15 10:30:45 - Chat request received - Session: chat-123, Message length: 45
2024-01-15 10:30:45 - Starting vector search for query: What is machine learning?
2024-01-15 10:30:46 - Vector search completed in 0.32s, found 5 documents
2024-01-15 10:30:48 - LLM generation completed in 2.1s, response length: 342
2024-01-15 10:30:48 - Chat request completed in 2.5s total (search: 0.32s, LLM: 2.1s)
```

**Rate Limit Error:**
```
2024-01-15 10:30:45 - Rate limit detected: 429 Too Many Requests
2024-01-15 10:30:45 - Retryable error on attempt 1/3: Rate limit exceeded. Retrying in 2.0s...
```

## Troubleshooting

### Common Issues

**1. "Server is Down" Errors**
- Check Azure API quotas and rate limits
- Monitor logs for timeout or connection errors
- Verify environment variables are set correctly

**2. High Memory Usage**
- Check conversation session counts in logs
- Verify cleanup task is running
- Consider reducing `MAX_CONVERSATION_HISTORY`

**3. Slow Response Times**
- Monitor vector search times vs LLM generation times
- Check Azure OpenAI service health
- Consider increasing worker count

### Health Checks
```bash
# Check server health
curl http://localhost:8000/

# Expected response:
{
  "message": "Geoffrey Challen RAG Server",
  "status": "running",
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

## Security Considerations

### Network Security
- Use HTTPS in production (configure SSL certificates)
- Restrict CORS origins to your domains only
- Consider API gateway or reverse proxy

### Data Security
- Azure API keys in environment variables only
- No secrets in logs or error messages
- Vector database contains only public content

### Container Security
- Runs as non-root user (UID 1001)
- No unnecessary privileges
- Regular base image updates

## Scaling

### Horizontal Scaling
- Run multiple container instances
- Use load balancer (nginx, HAProxy, etc.)
- Consider Redis for distributed rate limiting

### Vertical Scaling
- Increase worker count with more CPU cores
- Add memory for larger conversation caches
- Use faster storage for vector database

## Deployment Examples

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-server
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: rag-server
        image: your-registry/rag-server:latest
        ports:
        - containerPort: 8000
        env:
        - name: WORKERS
          value: "4"
        resources:
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

### systemd Service
```ini
[Unit]
Description=RAG Server
After=network.target

[Service]
Type=exec
User=raguser
WorkingDirectory=/opt/rag-server
Environment=WORKERS=4
ExecStart=/opt/rag-server/venv/bin/python run_production.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```