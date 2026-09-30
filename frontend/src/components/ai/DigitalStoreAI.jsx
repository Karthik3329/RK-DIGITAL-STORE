import { useEffect, useRef, useState } from "react";
import api from "../../services/api";


function DigitalStoreAI() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm DigitalStore AI 👋 How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const sendMessage = async (messageText = input) => {
    const message = messageText.trim();

    if (!message || isTyping) {
      return;
    }

    const userMessage = {
      role: "user",
      content: message,
    };

    const previousMessages = messages;

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setIsTyping(true);

    try {
      const conversationHistory = previousMessages
        .filter(
          (item) =>
            item.role === "user" ||
            item.role === "assistant"
        )
        .slice(-12);

      const response = await api.post("/ai/chat", {
        message,
        conversation_history: conversationHistory,
      });

      const aiResponse =
        response.data?.response ||
        "Sorry, I couldn't generate a response.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: aiResponse,
        },
      ]);
    } catch (error) {
      console.error(
        "DigitalStore AI error:",
        error
      );

      const detail =
        error.response?.data?.detail;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            typeof detail === "string"
              ? detail
              : "Sorry, I'm having trouble connecting to the AI service. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    {
      label: "🔎 Find products",
      message: "What products do you have?",
    },
    {
      label: "💰 Check prices",
      message:
        "Show me some available products and their prices.",
    },
    {
      label: "🛒 Shopping help",
      message:
        "Help me choose a digital product.",
    },
    {
      label: "📦 My orders",
      message:
        "How can I check my orders?",
    },
  ];

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="ds-ai-floating-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open DigitalStore AI"
        >
          <span className="ds-ai-button-glow" />

          <span className="ds-ai-icon">
            ✨
          </span>

          <span className="ds-ai-floating-label">
            AI
          </span>
        </button>
      )}

      {isOpen && (
        <section
          className="ds-ai-window"
          aria-label="DigitalStore AI"
        >
          <header className="ds-ai-header">
            <div className="ds-ai-header-left">
              <div className="ds-ai-avatar">
                ✨
              </div>

              <div>
                <div className="ds-ai-title">
                  DigitalStore AI
                </div>

                <div className="ds-ai-status">
                  <span className="ds-ai-status-dot" />
                  AI Assistant
                </div>
              </div>
            </div>

            <button
              type="button"
              className="ds-ai-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI"
            >
              ×
            </button>
          </header>

          <div className="ds-ai-messages">
            <div className="ds-ai-welcome">
              <span>✦</span>
              Ask me anything about DigitalStore
            </div>

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`ds-ai-message-row ${
                  message.role === "user"
                    ? "ds-ai-user-row"
                    : ""
                }`}
              >
                {message.role === "assistant" && (
                  <div className="ds-ai-small-avatar">
                    ✨
                  </div>
                )}

                <div
                  className={`ds-ai-message ${
                    message.role === "user"
                      ? "ds-ai-user-message"
                      : "ds-ai-assistant-message"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {messages.length === 1 &&
              !isTyping && (
                <div className="ds-ai-quick-actions">
                  <div className="ds-ai-quick-title">
                    Quick actions
                  </div>

                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      className="ds-ai-quick-button"
                      onClick={() =>
                        sendMessage(action.message)
                      }
                    >
                      {action.label}
                      <span>›</span>
                    </button>
                  ))}
                </div>
              )}

            {isTyping && (
              <div className="ds-ai-message-row">
                <div className="ds-ai-small-avatar">
                  ✨
                </div>

                <div className="ds-ai-message ds-ai-assistant-message">
                  <div className="ds-ai-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className="ds-ai-input-area"
            onSubmit={handleSubmit}
          >
            <div className="ds-ai-input-wrapper">
              <textarea
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask DigitalStore AI..."
                rows={1}
                disabled={isTyping}
              />

              <button
                type="submit"
                className="ds-ai-send"
                disabled={
                  !input.trim() || isTyping
                }
                aria-label="Send message"
              >
                ↑
              </button>
            </div>

            <div className="ds-ai-disclaimer">
              DigitalStore AI can make mistakes.
              Verify important information.
            </div>
          </form>
        </section>
      )}
    </>
  );
}

export default DigitalStoreAI;