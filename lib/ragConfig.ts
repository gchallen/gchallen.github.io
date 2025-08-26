// Configuration for RAG server connection
export const RAG_SERVER_URL = process.env.NEXT_PUBLIC_RAG_SERVER_URL || "http://localhost:8000"

export const RAG_CONFIG = {
  baseUrl: RAG_SERVER_URL,
  endpoints: {
    chat: `${RAG_SERVER_URL}/chat`,
    search: `${RAG_SERVER_URL}/search`,
    health: `${RAG_SERVER_URL}/`,
  },
  timeout: 30000, // 30 second timeout for requests
}
