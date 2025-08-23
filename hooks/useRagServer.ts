import { useState, useEffect } from "react"
import { RAG_CONFIG } from "../lib/ragConfig"

export function useRagServer() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkConnection = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout for health check
      
      const response = await fetch(RAG_CONFIG.endpoints.health, {
        method: "GET",
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      setIsConnected(response.ok)
      setLastCheck(new Date())
    } catch (error) {
      setIsConnected(false)
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    // Check connection on mount
    checkConnection()
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    isConnected,
    lastCheck,
    checkConnection,
    serverUrl: RAG_CONFIG.baseUrl,
  }
}