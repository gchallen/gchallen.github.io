# Chat with Geoffrey - RAG Integration

The `/chat` page provides an AI-powered chat interface that lets visitors interact with Geoffrey Challen's content through a conversational RAG (Retrieval-Augmented Generation) system.

## Features

### 🤖 AI Chat Interface

- **Conversational AI**: Powered by Geoffrey's writings and website content
- **Memory**: Maintains conversation context across messages
- **Real-time responses**: Streaming-like experience with typing indicators

### 📚 Smart Citations

- **Deep linking**: Citations use Text Fragments for precise content linking
- **Source transparency**: Shows similarity scores and content previews
- **Rich metadata**: Displays page titles, URLs, and relevant excerpts

### 🎨 User Experience

- **Responsive design**: Works on desktop, tablet, and mobile
- **Dark mode support**: Respects user's system preference
- **Suggestion prompts**: Helpful starting questions for new users
- **Error handling**: Graceful degradation when RAG server is unavailable

## Architecture

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat UI   │───▶│   RAG Server    │───▶│  Vector DB +    │
│  (Next.js)  │    │   (FastAPI)     │    │  Azure OpenAI   │
└─────────────┘    └─────────────────┘    └─────────────────┘
```

### Components

- **`/pages/chat.tsx`**: Main chat page with layout and metadata
- **`/components/Chat.tsx`**: Chat interface component with state management
- **`/components/Chat.module.css`**: Responsive styling with dark mode support
- **`/lib/ragConfig.ts`**: Configuration for RAG server connection
- **`/hooks/useRagServer.ts`**: Server health monitoring hook

## Configuration

### Environment Variables

Set these in your `.env.local` file:

```env
# RAG Server URL (defaults to localhost:8000 for development)
NEXT_PUBLIC_RAG_SERVER_URL=http://localhost:8000
```

### Production Setup

For production deployment:

1. **Deploy RAG Server**: Use Docker or direct deployment

   ```bash
   npm run rag:build  # Build container
   npm run rag:run    # Deploy server
   ```

2. **Configure Frontend**: Set the production RAG server URL

   ```env
   NEXT_PUBLIC_RAG_SERVER_URL=https://rag.yourdomain.com
   ```

3. **CORS Configuration**: Ensure RAG server allows requests from your domain

## Text Fragments

The chat interface generates [Text Fragment](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments) URLs for precise deep linking:

- **Smart text selection**: Picks meaningful phrases from source content
- **Automatic encoding**: Handles special characters and quotes
- **Fallback graceful**: Falls back to regular URLs if fragments fail

Example generated URL:

```
/essays/chalkface-nostalgia#:~:text=lecturing%20was%20not%20an%20effective%20way
```

## Development

### Running Locally

1. **Start RAG Server**:

   ```bash
   npm run rag:run
   ```

2. **Start Next.js**:

   ```bash
   npm run dev
   ```

3. **Visit**: `http://localhost:3000/chat`

### Server Health Monitoring

The chat interface automatically:

- **Monitors connection**: Checks RAG server health every 30 seconds
- **Shows status**: Displays connection indicator when server is offline
- **Handles errors**: Provides helpful error messages and recovery suggestions

### Customizing the Interface

#### Chat Suggestions

Edit the welcome message suggestions in `Chat.tsx`:

```tsx
<button onClick={() => setInputValue("Your custom question here")}>Your custom question here</button>
```

#### Styling

Modify `Chat.module.css` to customize:

- **Colors**: Update CSS custom properties
- **Layout**: Adjust container dimensions and spacing
- **Typography**: Change fonts and sizes
- **Dark mode**: Modify dark mode color scheme

#### Connection Config

Update `ragConfig.ts` to change:

- **Server URL**: Default endpoint configuration
- **Timeouts**: Request timeout duration
- **Endpoints**: Available API endpoints

## Troubleshooting

### Common Issues

1. **"Server Offline" Warning**
   - Ensure RAG server is running: `npm run rag:run`
   - Check server URL configuration
   - Verify network connectivity

2. **CORS Errors**
   - RAG server includes CORS middleware for all origins
   - For production, configure specific allowed origins

3. **Text Fragments Not Working**
   - Requires modern browser support
   - Falls back to regular URLs automatically
   - Some browsers may have text fragments disabled

4. **Long Response Times**
   - Azure OpenAI API calls can take 10-30 seconds
   - Timeout is set to 30 seconds
   - Consider implementing response streaming for better UX

### Performance

- **Connection pooling**: Fetch API reuses connections
- **Request timeouts**: 30-second timeout prevents hanging
- **Efficient re-renders**: React state optimizations minimize re-renders
- **Text fragment optimization**: Smart text selection for reliable linking

## Future Enhancements

- **Response streaming**: Real-time response display
- **Voice input**: Speech-to-text integration
- **Export conversations**: Save chat history
- **Share conversations**: Generate shareable links
- **Advanced citations**: Multiple text fragments per source
- **Offline mode**: Cached responses for common questions
