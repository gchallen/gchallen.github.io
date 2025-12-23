#!/usr/bin/env python3

"""
Production-ready Gunicorn configuration for RAG server.
Provides better process management, monitoring, and error recovery.
"""

import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048

# Worker processes
workers = int(os.getenv("WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# Timeout settings
timeout = 120
keepalive = 5
graceful_timeout = 30

# Logging
loglevel = os.getenv("LOG_LEVEL", "info")
accesslog = "-"  # stdout
errorlog = "-"  # stderr
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "rag_server"

# Server mechanics
preload_app = True
daemon = False
pidfile = None
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
keyfile = os.getenv("SSL_KEYFILE")
certfile = os.getenv("SSL_CERTFILE")

# Worker recycling for memory management
max_requests = 1000
max_requests_jitter = 100


def post_fork(server, worker):
    """Called after a worker has been forked."""
    server.log.info(f"Worker spawned (pid: {worker.pid})")


def pre_fork(server, worker):
    """Called before a worker is forked."""
    pass


def when_ready(server):
    """Called when the server is ready to accept connections."""
    server.log.info("RAG Server ready to accept connections")


def worker_int(worker):
    """Called when a worker receives the INT signal."""
    worker.log.info(f"Worker {worker.pid} received INT signal")


def on_exit(server):
    """Called when the server is stopping."""
    server.log.info("RAG Server shutting down")
