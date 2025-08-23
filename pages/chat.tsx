import Head from "next/head"
import Header from "../components/Header"
import Chat from "../components/Chat"

export default function ChatPage() {
  return (
    <>
      <Head>
        <title>Geoffrey Challen : Chat</title>
        <meta property="og:title" content="Chat with Geoffrey" key="ogtitle" />
        <meta 
          name="description" 
          content="Chat with Geoffrey Challen using AI powered by his writings and website content. Ask questions about teaching, computer science, and educational technology." 
        />
        <meta 
          property="og:description" 
          content="Chat with Geoffrey Challen using AI powered by his writings and website content. Ask questions about teaching, computer science, and educational technology." 
          key="ogdesc" 
        />
      </Head>
      <Header />
      <main className="responsive paddings">
        <div id="titleContainer" style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ flex: 1 }}>
            <h1>Chat with Geoffrey</h1>
            <p style={{ marginTop: "0.5rem", color: "var(--gray)", fontSize: "0.9rem" }}>
              Powered by AI and Geoffrey's writings
            </p>
          </div>
        </div>
        
        <Chat />
      </main>
    </>
  )
}