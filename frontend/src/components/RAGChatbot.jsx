import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Library, ChevronDown, ChevronUp } from 'lucide-react';

/*
RAGChatbot Component
====================
Provides the interactive chat panel with your AI Travel Co-Pilot.
- Highlights: RAG source citations (expandable accordion).
- Quick suggestions: Send travel FAQs with one tap.
- Auto-scrolling: Automatically scrolls down when new messages arrive.
*/

export default function RAGChatbot({
  messages,
  onSendMessage,
  loading,
  cityName
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Light markdown parser for rendering bold text and bullet points inside bubbles
  const compileMarkdown = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    const htmlChunks = [];
    let inList = false;

    for (let line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        if (inList) { htmlChunks.push('</ul>'); inList = false; }
        continue;
      }

      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList) {
          htmlChunks.push('<ul style="padding-left: 1.1rem; margin-top: 0.25rem; margin-bottom: 0.25rem;">');
          inList = true;
        }
        htmlChunks.push(`<li style="margin-bottom: 0.2rem;">${parseInlineStyles(trimmedLine.substring(2))}</li>`);
      } else {
        if (inList) { htmlChunks.push('</ul>'); inList = false; }
        htmlChunks.push(`<p style="margin-bottom: 0.4rem;">${parseInlineStyles(trimmedLine)}</p>`);
      }
    }
    if (inList) htmlChunks.push('</ul>');
    return htmlChunks.join('\n');
  };

  const parseInlineStyles = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  // Auto-scroll to bottom of chat when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  // Pre-configured questions that automatically query the RAG database
  const suggestionPills = [
    "Local street food?",
    "Best transit options?",
    "Packing essentials?",
    "Scams to avoid?"
  ];

  return (
    <div className="glass-panel chatbot-drawer">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title-group">
          <Bot size={20} className="text-cyan-400" />
          <div>
            <div className="chat-title">AI Travel Co-Pilot</div>
            <div className="chat-subtitle">Connected to RAG Travel Guides</div>
          </div>
        </div>
      </div>

      {/* Message History */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '2rem',
            gap: '0.5rem'
          }}>
            <Bot size={36} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: '0.92rem' }}>
              Ask me about local travel tips, transit, packing lists, or to modify your itinerary!
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.role}`}
          >
            {/* Sender Identifier */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
              marginBottom: '0.25rem'
            }}>
              {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
              <span>{msg.role === 'user' ? 'You' : 'Co-Pilot'}</span>
            </div>

            {/* Message Content */}
            <div 
              dangerouslySetInnerHTML={{ __html: compileMarkdown(msg.content) }}
            />

            {/* RAG Sources Accordion */}
            {msg.sources && msg.sources.length > 0 && (
              <SourceAccordion sources={msg.sources} />
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="chat-message assistant">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <Bot size={10} />
              <span>Co-Pilot is researching...</span>
            </div>
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Pills */}
      {messages.length > 0 && !loading && (
        <div className="chat-suggestions">
          {suggestionPills.map((pill, idx) => (
            <div
              key={idx}
              className="suggestion-pill"
              onClick={() => onSendMessage(pill.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim())}
            >
              {pill}
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="chat-input-bar">
        <input
          type="text"
          className="chat-input"
          placeholder={`Ask about ${cityName || 'your trip'}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={loading || !input.trim()}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

// Sub-component for listing references
function SourceAccordion({ sources }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sources-accordion">
      <button
        type="button"
        className="sources-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Library size={12} />
        <span>{isOpen ? 'Hide Retrieved Sources' : `Show Sources (${sources.length})`}</span>
        {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>

      {isOpen && (
        <div className="sources-list">
          {sources.map((src, i) => (
            <div key={i} className="source-card">
              <span className="source-badge">Source: {src.source}</span>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>"{src.text}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
