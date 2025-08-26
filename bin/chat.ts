#!/usr/bin/env tsx

/**
 * Command-line utility to interact with the RAG server.
 *
 * Usage:
 *   tsx bin/chat.ts                           # Interactive chat mode
 *   tsx bin/chat.ts search "query"            # One-time search
 *   tsx bin/chat.ts ask "question"            # One-time chat
 *   tsx bin/chat.ts --server http://localhost:8000 # Custom server URL
 *
 * Interactive commands:
 *   /search <query>     - Switch to search mode
 *   /chat               - Switch to chat mode
 *   /clear              - Clear conversation history
 *   /history            - Show conversation history
 *   /help               - Show help
 *   /exit               - Exit the program
 */

import process from "process"
import * as readline from "readline"

interface SearchResponse {
  results: Array<{
    content: string
    citation_url: string
    title?: string
    page_title?: string
    score?: number
  }>
  query: string
  timestamp: string
}

interface ChatResponse {
  response: string
  session_id: string
  timestamp: string
  sources: Array<{
    url: string
    title: string
    content_preview: string
    similarity_score?: number
  }>
}

interface HistoryResponse {
  session_id: string
  history: Array<{
    role: "user" | "assistant"
    content: string
  }>
}

class RAGClient {
  private serverUrl: string
  private sessionId: string
  private conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []

  constructor(serverUrl: string = "http://localhost:8000") {
    this.serverUrl = serverUrl
    this.sessionId = `cli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  async search(query: string, k: number = 5): Promise<SearchResponse> {
    const response = await fetch(`${this.serverUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, k }),
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async chat(message: string): Promise<ChatResponse> {
    const response = await fetch(`${this.serverUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        session_id: this.sessionId,
        history: this.conversationHistory,
      }),
    })

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // Update local history
    this.conversationHistory.push({ role: "user", content: message }, { role: "assistant", content: result.response })

    return result
  }

  async getHistory(): Promise<HistoryResponse> {
    const response = await fetch(`${this.serverUrl}/sessions/${this.sessionId}/history`)
    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  async clearHistory(): Promise<void> {
    const response = await fetch(`${this.serverUrl}/sessions/${this.sessionId}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error(`Failed to clear history: ${response.status} ${response.statusText}`)
    }
    this.conversationHistory = []
  }
}

function formatSearchResults(results: SearchResponse): string {
  const lines: string[] = []
  lines.push(`\n🔍 Search Results for "${results.query}":`)
  lines.push(`Found ${results.results.length} results\n`)

  results.results.forEach((result, index) => {
    const title = result.title || result.page_title || "Website Content"
    const scoreText = result.score ? ` [${(result.score * 100).toFixed(0)}% match]` : ""
    lines.push(`${index + 1}. ${title}${scoreText}`)
    lines.push(`   📄 ${result.citation_url}`)
    lines.push(`   ${result.content.substring(0, 200)}${result.content.length > 200 ? "..." : ""}`)
    lines.push("")
  })

  return lines.join("\n")
}

function formatChatResponse(response: ChatResponse): string {
  const lines: string[] = []
  lines.push(`\n🤖 ${response.response}`)

  if (response.sources.length > 0) {
    lines.push(`\n📚 Sources (${response.sources.length} found):`)
    response.sources.forEach((source, index) => {
      const scoreText = source.similarity_score ? ` [${(source.similarity_score * 100).toFixed(0)}% match]` : ""
      lines.push(`  ${index + 1}. ${source.title} (${source.url})${scoreText}`)
    })
  } else {
    lines.push(`\n📚 No relevant sources found above similarity threshold`)
  }

  return lines.join("\n")
}

function formatHistory(history: HistoryResponse): string {
  const lines: string[] = []
  lines.push(`\n📜 Conversation History (${history.session_id}):`)

  if (history.history.length === 0) {
    lines.push("  (No conversation history)")
  } else {
    history.history.forEach((msg, index) => {
      const icon = msg.role === "user" ? "👤" : "🤖"
      const content = msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content
      lines.push(`  ${icon} ${content}`)
    })
  }

  return lines.join("\n")
}

function showHelp(): void {
  console.log(`
RAG Server Chat Client

Commands:
  /search <query>     - Search the knowledge base
  /chat               - Switch to chat mode (default)
  /clear              - Clear conversation history
  /history            - Show conversation history
  /help               - Show this help message
  /exit               - Exit the program

In chat mode, just type your message and press Enter.
In search mode, type your search query and press Enter.

Examples:
  /search teaching programming
  What do you think about lecturing?
  /clear
  /history
`)
}

async function runInteractive(client: RAGClient): Promise<void> {
  console.log("🚀 RAG Server Chat Client")
  console.log(`Connected to: ${client["serverUrl"]}`)
  console.log(`Session ID: ${client["sessionId"]}`)
  console.log("Type /help for commands or just start chatting!\n")

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  })

  let mode: "chat" | "search" = "chat"

  rl.prompt()

  rl.on("line", async (input: string) => {
    const trimmed = input.trim()

    if (trimmed === "") {
      rl.prompt()
      return
    }

    try {
      // Handle commands
      if (trimmed.startsWith("/")) {
        const parts = trimmed.split(" ")
        const command = parts[0].toLowerCase()
        const args = parts.slice(1).join(" ")

        switch (command) {
          case "/help":
            showHelp()
            break

          case "/exit":
            console.log("Goodbye! 👋")
            rl.close()
            return

          case "/clear":
            await client.clearHistory()
            console.log("✅ Conversation history cleared")
            break

          case "/history":
            const history = await client.getHistory()
            console.log(formatHistory(history))
            break

          case "/search":
            if (args) {
              const results = await client.search(args)
              console.log(formatSearchResults(results))
            } else {
              mode = "search"
              console.log("🔍 Switched to search mode. Type your search query:")
            }
            break

          case "/chat":
            mode = "chat"
            console.log("💬 Switched to chat mode. Ask me anything!")
            break

          default:
            console.log(`Unknown command: ${command}. Type /help for available commands.`)
        }
      } else {
        // Handle regular input based on mode
        if (mode === "search") {
          const results = await client.search(trimmed)
          console.log(formatSearchResults(results))
        } else {
          const response = await client.chat(trimmed)
          console.log(formatChatResponse(response))
        }
      }
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }

    rl.prompt()
  })

  rl.on("close", () => {
    console.log("\nGoodbye! 👋")
    process.exit(0)
  })
}

async function runOneTime(client: RAGClient, command: string, query: string): Promise<void> {
  try {
    if (command === "search") {
      const results = await client.search(query)
      console.log(formatSearchResults(results))
    } else if (command === "ask" || command === "chat") {
      const response = await client.chat(query)
      console.log(formatChatResponse(response))
    } else {
      console.error(`❌ Unknown command: ${command}`)
      console.error("Available commands: search, ask, chat")
      process.exit(1)
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  let serverUrl = "http://localhost:8000"

  // Parse server URL argument
  const serverIndex = args.indexOf("--server")
  if (serverIndex !== -1 && args[serverIndex + 1]) {
    serverUrl = args[serverIndex + 1]
    args.splice(serverIndex, 2)
  }

  const client = new RAGClient(serverUrl)

  // Check if server is running
  console.log("🔄 Checking server connection...")
  const isHealthy = await client.healthCheck()
  if (!isHealthy) {
    console.error(`❌ Could not connect to RAG server at ${serverUrl}`)
    console.error("Make sure the server is running: cd rag && python run_server.py")
    process.exit(1)
  }
  console.log("✅ Connected to RAG server\n")

  if (args.length === 0) {
    // Interactive mode
    await runInteractive(client)
  } else if (args.length >= 2) {
    // One-time command
    const command = args[0]
    const query = args.slice(1).join(" ")
    await runOneTime(client, command, query)
  } else {
    console.error("❌ Invalid arguments")
    console.error("Usage:")
    console.error("  tsx bin/chat.ts                           # Interactive mode")
    console.error('  tsx bin/chat.ts search "query"            # One-time search')
    console.error('  tsx bin/chat.ts ask "question"            # One-time chat')
    console.error("  tsx bin/chat.ts --server http://localhost:8000 # Custom server")
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Goodbye!")
  process.exit(0)
})

// Run the main function
main().catch((error) => {
  console.error(`💥 Fatal error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
