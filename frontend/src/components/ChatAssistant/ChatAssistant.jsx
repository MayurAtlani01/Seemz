import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, RotateCcw, Sparkles } from "lucide-react";
import { sendChatMessage } from "../../services/chatservices";
import { useAuth } from "../../context/AuthContext";
import "./ChatAssistant.css";

const ChatAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize messages from sessionStorage to preserve across refreshes/navigation
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("seemz_ai_chat_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("seemz_ai_chat_history", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Scroll to bottom on message change or loading state change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 300);
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    await sendMessage(inputMessage);
  };

  const sendMessage = async (textToSend) => {
    const userMsg = { sender: "user", text: textToSend };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Filter out previous errors before sending history to backend
      const cleanHistory = updatedMessages.slice(0, -1).filter((m) => !m.isError);

      // Build context payload (future-ready architecture)
      const context = {};
      if (user) {
        context.user = {
          height: user.height || "",
          weight: user.weight || "",
          gender: user.gender || "",
          bodyParameters: user.bodyParameters || {},
        };
      }

      const response = await sendChatMessage(textToSend, {
        history: cleanHistory,
        ...context,
      });

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: response.reply },
      ]);
    } catch (err) {
      console.error("Seemz AI communication error:", err);
      
      const errorMessage =
        err.response?.data?.error ||
        "Unable to reach the fashion assistant. Please check your connection and try again.";
      
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: errorMessage, isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (prompt) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  const handleClearHistory = () => {
    if (window.confirm("Do you want to clear your conversation history?")) {
      setMessages([]);
      try {
        sessionStorage.removeItem("seemz_ai_chat_history");
      } catch {}
    }
  };

  // Safe React-based markdown parser (bold, bullet points, line breaks)
  const formatMessageText = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    
    return lines.map((line, i) => {
      // Identify bullet items starting with "- " or "* "
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      let lineContent = line;
      if (isBullet) {
        lineContent = line.trim().substring(2);
      }

      // Parse bold elements **text**
      const parts = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;
      let lastIndex = 0;

      while ((match = boldRegex.exec(lineContent)) !== null) {
        if (match.index > lastIndex) {
          parts.push(lineContent.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < lineContent.length) {
        parts.push(lineContent.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : lineContent;

      if (isBullet) {
        return (
          <li key={i} className="chat-bullet-item">
            {content}
          </li>
        );
      }

      return (
        <p key={i} className="chat-paragraph">
          {content}
        </p>
      );
    });
  };

  const suggestedPrompts = [
    "What should I buy for my climate?",
    "Help me choose a size",
    "Find me an oversized fit",
    "What would suit me?",
  ];

  return (
    <div className="seemz-chat-container">
      {/* 1. Floating Trigger Button */}
      <button
        className={`seemz-chat-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Fashion Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && <span className="trigger-pulse-glow" />}
      </button>

      {/* 2. Chat Panel */}
      <div className={`seemz-chat-panel ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <header className="seemz-chat-header">
          <div className="seemz-chat-header-info">
            <div className="seemz-chat-header-title">
              <Sparkles size={16} className="title-sparkle-icon" />
              <span>SEEMZ AI</span>
            </div>
            <span className="seemz-chat-header-tagline">
              Your personal fashion assistant
            </span>
          </div>
          <div className="seemz-chat-header-actions">
            {messages.length > 0 && (
              <button
                className="seemz-chat-header-btn"
                onClick={handleClearHistory}
                title="Clear Chat History"
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button
              className="seemz-chat-header-btn close-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Message Area */}
        <div className="seemz-chat-messages">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="seemz-chat-empty">
              <div className="empty-logo-wrapper">
                <Sparkles size={36} />
              </div>
              <h3 className="empty-title">Hey! I'm Seemz AI.</h3>
              <p className="empty-subtitle">
                How can I help you find your next look?
              </p>
              
              <div className="suggested-prompts-container">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    className="suggested-prompt-card"
                    onClick={() => handleSuggestionClick(prompt)}
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message List */
            <div className="message-list-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-bubble-wrapper ${
                    msg.sender === "user" ? "user-wrapper" : "ai-wrapper"
                  }`}
                >
                  <div
                    className={`message-bubble ${
                      msg.sender === "user"
                        ? "user-bubble"
                        : msg.isError
                        ? "ai-bubble error-bubble"
                        : "ai-bubble"
                    }`}
                  >
                    {formatMessageText(msg.text)}
                  </div>
                </div>
              ))}
              
              {/* Typing / Loading Indicator */}
              {isLoading && (
                <div className="message-bubble-wrapper ai-wrapper">
                  <div className="message-bubble ai-bubble typing-bubble">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form className="seemz-chat-input-form" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            className="seemz-chat-input"
            placeholder="Ask about sizes, fabrics, looks..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="seemz-chat-send-btn"
            disabled={isLoading || !inputMessage.trim()}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
