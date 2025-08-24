import { useState, useRef, useEffect, useCallback } from "react"
import { RAG_CONFIG } from "../lib/ragConfig"
import { useRagServer } from "../hooks/useRagServer"
import ReactMarkdown from "react-markdown"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
  sources?: Array<{
    url: string
    title: string
    content_preview: string
    content_full?: string
    similarity_score?: number
  }>
}

interface Source {
  url: string
  title: string
  content_preview: string
  content_full?: string
  similarity_score?: number
}

// Generate text fragment URL for deep linking
function createTextFragmentUrl(url: string, text: string): string {
  // Clean text for URL fragment - be more selective about what to remove
  const cleanText = text
    .replace(/[""'']/g, '"') // Normalize quotes
    .replace(/[—–]/g, '-') // Normalize dashes  
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  // Take first meaningful words, avoiding very short words at the end
  const words = cleanText.split(' ')
  let selectedWords: string[] = []
  let charCount = 0
  
  for (const word of words) {
    // Stop if we have enough characters and words
    if (selectedWords.length >= 6 && charCount > 50) break
    // Avoid ending with very short connector words
    if (selectedWords.length >= 4 && word.length <= 2 && 
        ['a', 'an', 'the', 'to', 'of', 'in', 'at', 'by', 'or', 'and'].includes(word.toLowerCase())) {
      break
    }
    selectedWords.push(word)
    charCount += word.length + 1 // +1 for space
    if (selectedWords.length >= 10) break // Hard limit
  }
  
  const fragment = selectedWords.join(' ')
  
  if (fragment.length > 0) {
    return `${url}#:~:text=${encodeURIComponent(fragment)}`
  }
  
  return url
}

const MessageBubble: React.FC<{ 
  message: ChatMessage 
  isLatest: boolean
  assistantRef?: React.RefObject<HTMLDivElement | null>
  userRef?: React.RefObject<HTMLDivElement | null>
}> = ({ message, isLatest, assistantRef, userRef }) => {
  const isUser = message.role === "user"
  
  return (
    <div 
      className={`message ${isUser ? 'userMessage' : 'assistantMessage'}`}
      ref={isLatest ? (isUser ? userRef : assistantRef) : undefined}
    >
      <div className="messageContent">
        <div className="messageText">
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
        <div className="messageTime">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
      
      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="sources">
          <span className="sourcesHeader">Sources: </span>
          {message.sources.map((source, index) => (
            <span key={index} className="source">
              {index + 1}){"\u00A0"}<a 
                href={createTextFragmentUrl(source.url, source.content_full || source.content_preview)}
                target="_blank"
                rel="noopener noreferrer"
                className="sourceLink"
              >
                {source.title}
              </a>
              {source.similarity_score && (
                <span className="similarityScore">
                  {" "}({Math.round(source.similarity_score * 100)}%)
                </span>
              )}
              {index < (message.sources?.length || 0) - 1 && ", "}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const TypingIndicator: React.FC = () => (
  <div className="message assistantMessage">
    <div className="messageContent">
      <div className="typingIndicator">
        <span>Geoffbot is thinking</span>
        <div className="typingDots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
)

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  const { isConnected, serverUrl } = useRagServer()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastAssistantMessageRef = useRef<HTMLDivElement>(null)
  const lastUserMessageRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  const scrollToElementWithHeaderOffset = useCallback((element: HTMLDivElement | null, isUserMessage = false) => {
    if (!element) return
    
    // Header height from CSS (.paddings has padding-top: calc(68px + 1em))
    // 68px for header + 1em (approximately 16px) = ~84px
    const headerHeight = 100 // Being more generous to ensure it's fully visible
    
    const elementRect = element.getBoundingClientRect()
    const elementTop = elementRect.top + window.pageYOffset
    const offsetTop = elementTop - headerHeight
    
    window.scrollTo({
      top: Math.max(0, offsetTop), // Ensure we don't scroll to negative values
      behavior: "smooth"
    })
  }, [])
  
  const scrollToLastAssistantMessage = useCallback(() => {
    scrollToElementWithHeaderOffset(lastAssistantMessageRef.current, false)
  }, [scrollToElementWithHeaderOffset])
  
  const scrollToLastUserMessage = useCallback(() => {
    scrollToElementWithHeaderOffset(lastUserMessageRef.current, true)
  }, [scrollToElementWithHeaderOffset])
  
  useEffect(() => {
    // Only scroll when a new user message is added (not for assistant responses or loading states)
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === "user") {
        // Only scroll when user submits a message - show their message at top
        scrollToLastUserMessage()
      }
      // Don't scroll for assistant messages - let them appear below the user message
    }
  }, [messages, scrollToLastUserMessage])
  
  // Check if we have started a conversation
  const hasStartedChat = messages.length > 0
  
  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim()
    if (!textToSend || isLoading) return
    
    const conversationTimestamp = new Date().toISOString()
    const userMessage: ChatMessage = {
      role: "user",
      content: textToSend,
      timestamp: conversationTimestamp,
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setError(null)
    
    try {
      // Try to connect to the RAG server with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), RAG_CONFIG.timeout)
      
      const response = await fetch(RAG_CONFIG.endpoints.chat, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: conversationTimestamp,
        sources: data.sources || [],
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error("Chat error:", err)
      
      // Handle AbortError specifically (timeout or manual abort)
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Request timed out. Please try again.")
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: "I'm sorry, that request took too long to process. Please try asking your question again.",
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, errorMessage])
        return
      }
      
      // Check if it's a connection error (RAG server not running)
      const isConnectionError = err instanceof TypeError || 
        (err instanceof Error && err.message.includes("fetch"))
      
      if (isConnectionError) {
        setError(
          "Unable to connect to the chat server. The RAG server may not be running. " +
          "Please start it with 'npm run rag:run' or contact the site administrator."
        )
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.")
      }
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: isConnectionError 
          ? "I'm sorry, I'm currently unavailable. The chat service appears to be offline." 
          : "I'm sorry, I encountered an error while processing your message. Please try again.",
        timestamp: new Date().toISOString(),
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  const handleClearChat = () => {
    setMessages([])
    setError(null)
    inputRef.current?.focus()
  }
  
  // If server is offline, show only the offline message
  if (isConnected === false) {
    return (
      <div className="chatContainer">
        <div className="serverOffline">
          Server Offline. Please try again later.
        </div>
      </div>
    )
  }

  return (
    <div className="chatContainer">
      {/* Show warnings and welcome message only before chat starts */}
      {!hasStartedChat && (
        <>
          {error && (
            <div className="errorBanner">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <div className="disclaimer">
            You&apos;re chatting with Geoffbot, an AI assistant powered by Geoffrey&apos;s writings and website content. This is not a direct conversation with Geoffrey himself.
          </div>
        </>
      )}
      
      {/* Messages area */}
      <div className="messagesArea">
        {messages.map((message, index) => (
          <MessageBubble 
            key={index} 
            message={message} 
            isLatest={index === messages.length - 1}
            assistantRef={lastAssistantMessageRef}
            userRef={lastUserMessageRef}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
        
        {/* Add extra space at bottom when user has submitted but assistant hasn't replied yet */}
        {hasStartedChat && messages.length > 0 && messages[messages.length - 1].role === "user" && <div style={{ height: '100vh' }} />}
        
        {/* Always keep some space at bottom to scroll past fixed input */}
        {hasStartedChat && <div style={{ height: '200px' }} />}
      </div>
      
      {/* Input area - fixed at bottom when chat has started, otherwise directly below content */}
      <div className={`inputContainer ${hasStartedChat ? 'fixedInput' : 'staticInput'}`}>
        <div className="inputWrapper">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={hasStartedChat ? "Reply to Geoffbot..." : "Ask me anything about teaching, computer science, or my work..."}
            className="input"
            rows={2}
            disabled={isLoading}
          />
          <div className="buttonColumn">
            <button 
              onClick={() => sendMessage()} 
              disabled={!inputValue.trim() || isLoading}
              className="sendButton"
              type="button"
            >
              {isLoading ? "..." : "Ask"}
            </button>
            {hasStartedChat && (
              <button 
                onClick={handleClearChat}
                className="clearButton"
                type="button"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        
        {/* Show suggestions below input when chat hasn't started */}
        {!hasStartedChat && (
          <div className="suggestionsSection">
            <div className="suggestions">
              <div>
                <button onClick={() => sendMessage("What's your approach to teaching introductory programming?")}>
                  What&apos;s your approach to teaching introductory programming?
                </button>
              </div>
              <div>
                <button onClick={() => sendMessage("Tell me about your work with online education.")}>
                  Tell me about your work with online education.
                </button>
              </div>
              <div>
                <button onClick={() => sendMessage("What do you think about the future of computer science education?")}>
                  What do you think about the future of CS education?
                </button>
              </div>
              <div>
                <button onClick={() => sendMessage("How do you make large courses more effective?")}>
                  How do you make large courses more effective?
                </button>
              </div>
              <div>
                <button onClick={() => sendMessage("What was your name before you got married?")}>
                  What was your name before you got married?
                </button>
              </div>
              <div>
                <button onClick={() => sendMessage("What kind of music do you like?")}>
                  What kind of music do you like?
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}