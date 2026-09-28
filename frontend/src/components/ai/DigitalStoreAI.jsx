import { useEffect, useRef, useState } from "react";

const quickActions = [
  "Find a product",
  "Recommend a product",
  "How does payment work?",
  "Where is my order?"
];

const initialMessage = {
  id: 1,
  role: "assistant",
  content:
    "Hi! I'm DigitalStore AI 👋\n\nI can help you find products, understand our payment process, check orders, and answer questions about DigitalStore."
};

function DigitalStoreAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const addMessage = (role, content) => {
    setMessages((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        role,
        content
      }
    ]);
  };

  const getDemoResponse = (message) => {
    const text = message.toLowerCase();

    if (
      text.includes("product") ||
      text.includes("template") ||
      text.includes("find")
    ) {
      return "Sure! I can help you find the right digital product. In the next phase, I'll be connected to the DigitalStore product database so I can search your actual products. 🔎";
    }

    if (
      text.includes("recommend") ||
      text.includes("suggest")
    ) {
      return "Absolutely! Tell me what you're looking to build, such as a car rental website, business website, dashboard, or another project. I'll recommend suitable products. ✨";
    }

    if (
      text.includes("payment") ||
      text.includes("upi") ||
      text.includes("pay")
    ) {
      return "DigitalStore currently uses manual UPI payment. You pay the displayed amount, enter the UTR/reference number, upload your payment screenshot, and submit it for verification. 💳";
    }

    if (
      text.includes("order") ||
      text.includes("purchase")
    ) {
      return "Once you're logged in, I'll be able to help you check your order status. In a future phase, I'll connect directly to your DigitalStore orders. 📦";
    }

    if (
      text.includes("download")
    ) {
      return "After your payment is verified by the admin, you'll receive a secure download link for your purchased digital product. 📥";
    }

    if (
      text.includes("hello") ||
      text.includes("hi") ||
      text.includes("hey")
    ) {
      return "Hey! 👋 Welcome to DigitalStore. What would you like help with?";
    }

    return "I'm currently in demo mode 🤖. In the next phase, I'll be connected to the DigitalStore AI backend so I can search products and provide intelligent answers.";
  };

  const handleSend = async (messageText = input) => {
    const message = messageText.trim();

    if (!message || isTyping) {
      return;
    }

    setInput("");

    addMessage("user", message);

    setIsTyping(true);

    setTimeout(() => {
      const response = getDemoResponse(message);

      addMessage("assistant", response);

      setIsTyping(false);
    }, 900);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action) => {
    handleSend(action);
  };

  return (
    <>
      {!isOpen && (
        <button
          className="ds-ai-floating-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open DigitalStore AI"
        >
          <span className="ds-ai-button-glow"></span>

          <span className="ds-ai-icon">
            ✨
          </span>

          <span className="ds-ai-floating-label">
            AI
          </span>
        </button>
      )}

      {isOpen && (
        <div className="ds-ai-window">

          <div className="ds-ai-header">

            <div className="ds-ai-header-left">

              <div className="ds-ai-avatar">
                ✨
              </div>

              <div>
                <div className="ds-ai-title">
                  DigitalStore AI
                </div>

                <div className="ds-ai-status">
                  <span className="ds-ai-status-dot"></span>
                  Online
                </div>
              </div>

            </div>

            <button
              className="ds-ai-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI assistant"
            >
              ×
            </button>

          </div>

          <div className="ds-ai-messages">

            <div className="ds-ai-welcome">
              <span>✦</span>
              AI Shopping & Support Assistant
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`ds-ai-message-row ${
                  message.role === "user"
                    ? "ds-ai-user-row"
                    : "ds-ai-assistant-row"
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
                  {message.content.split("\n").map(
                    (line, index) => (
                      <span key={index}>
                        {line}

                        {index <
                          message.content.split("\n").length -
                            1 && <br />}
                      </span>
                    )
                  )}
                </div>

              </div>
            ))}

            {messages.length === 1 && (
              <div className="ds-ai-quick-actions">

                <div className="ds-ai-quick-title">
                  Try asking
                </div>

                {quickActions.map((action) => (
                  <button
                    key={action}
                    className="ds-ai-quick-button"
                    onClick={() =>
                      handleQuickAction(action)
                    }
                  >
                    {action}
                    <span>→</span>
                  </button>
                ))}

              </div>
            )}

            {isTyping && (
              <div className="ds-ai-message-row ds-ai-assistant-row">

                <div className="ds-ai-small-avatar">
                  ✨
                </div>

                <div className="ds-ai-message ds-ai-assistant-message ds-ai-typing">

                  <span></span>
                  <span></span>
                  <span></span>

                </div>

              </div>
            )}

            <div ref={messagesEndRef}></div>

          </div>

          <div className="ds-ai-input-area">

            <div className="ds-ai-input-wrapper">

              <textarea
                ref={inputRef}
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
                className="ds-ai-send"
                onClick={() => handleSend()}
                disabled={
                  !input.trim() || isTyping
                }
                aria-label="Send message"
              >
                ↑
              </button>

            </div>

            <div className="ds-ai-disclaimer">
              DigitalStore AI can make mistakes. Verify
              important information.
            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default DigitalStoreAI;