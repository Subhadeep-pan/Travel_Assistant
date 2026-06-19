import React from 'react';
import { Download, MapPin } from 'lucide-react';

/*
ItineraryDisplay Component
==========================
Renders the generated travel itinerary.
- Features a custom, lightweight, line-by-line Markdown compiler in React!
- Helps keep the code zero-dependency and easy to debug.
- Includes a utility to download the generated plan as a text file.
*/

export default function ItineraryDisplay({ itinerary, cityName }) {
  
  // High-resolution Unsplash city images
  const cityImages = {
    kolkata: "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80",
    delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
    mumbai: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1200&q=80",
    bengaluru: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
    jaipur: "https://images.unsplash.com/photo-1477584322904-487272e5a64d?auto=format&fit=crop&w=1200&q=80"
  };

  const getCityImageUrl = (name) => {
    if (!name) return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
    // Split by comma (e.g. "Kolkata, India" -> "kolkata")
    const cleanName = name.split(',')[0].toLowerCase().trim();
    return cityImages[cleanName] || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
  };

  const imageUrl = getCityImageUrl(cityName);

  // Custom Line-by-Line Markdown to HTML Compiler
  const compileMarkdown = (text) => {
    if (!text) return '';
    
    const lines = text.split('\n');
    const htmlChunks = [];
    let inList = false;

    for (let line of lines) {
      const trimmedLine = line.trim();
      
      // Empty line - close lists if open
      if (!trimmedLine) {
        if (inList) {
          htmlChunks.push('</ul>');
          inList = false;
        }
        continue;
      }

      // 1. Heading level 3: ### Title
      if (trimmedLine.startsWith('### ')) {
        if (inList) { htmlChunks.push('</ul>'); inList = false; }
        htmlChunks.push(`<h3>${trimmedLine.substring(4)}</h3>`);
      }
      // 2. Heading level 2: ## Title
      else if (trimmedLine.startsWith('## ')) {
        if (inList) { htmlChunks.push('</ul>'); inList = false; }
        htmlChunks.push(`<h2>${trimmedLine.substring(3)}</h2>`);
      }
      // 3. Heading level 1: # Title
      else if (trimmedLine.startsWith('# ')) {
        if (inList) { htmlChunks.push('</ul>'); inList = false; }
        htmlChunks.push(`<h1>${trimmedLine.substring(2)}</h1>`);
      }
      // 4. Blockquotes: > quote
      else if (trimmedLine.startsWith('> ')) {
        if (inList) { htmlChunks.push('</ul>'); inList = false; }
        const parsedContent = parseInlineStyles(trimmedLine.substring(2));
        htmlChunks.push(`<blockquote>${parsedContent}</blockquote>`);
      }
      // 5. Bullet Lists: - item or * item
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList) {
          htmlChunks.push('<ul>');
          inList = true;
        }
        const parsedContent = parseInlineStyles(trimmedLine.substring(2));
        htmlChunks.push(`<li>${parsedContent}</li>`);
      }
      // 6. Plain Paragraphs
      else {
        if (inList) { htmlChunks.push('</ul>'); inList = false; }
        const parsedContent = parseInlineStyles(trimmedLine);
        htmlChunks.push(`<p>${parsedContent}</p>`);
      }
    }

    if (inList) {
      htmlChunks.push('</ul>');
    }

    return htmlChunks.join('\n');
  };

  // Helper to parse bold (**text**) inside elements
  const parseInlineStyles = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  // Download Itinerary as Text File
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([itinerary], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `AeroTrip_${cityName || 'Itinerary'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="glass-panel itinerary-container">
      <div className="itinerary-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={22} className="text-cyan-600" />
          <h2 className="itinerary-title">Your Custom Itinerary</h2>
        </div>
        <button
          onClick={handleDownload}
          className="option-button-card active"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem' }}
          title="Download Itinerary"
        >
          <Download size={15} />
          Export TXT
        </button>
      </div>

      {/* City Hero Image Banner */}
      <div style={{
        width: '100%',
        height: '200px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <img 
          src={imageUrl} 
          alt={cityName} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          padding: '1rem',
          color: '#fff'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>{cityName}</h3>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Your AI Planned Adventure</span>
        </div>
      </div>

      <div 
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: compileMarkdown(itinerary) }}
      />
    </div>
  );
}
