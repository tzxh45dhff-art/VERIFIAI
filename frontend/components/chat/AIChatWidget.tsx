"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader2, Sparkles, Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "What is disparate impact?",
  "Explain the audit workflow",
  "EU AI Act Article 10",
  "How are risk scores calculated?",
];

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.reply || data.error || "Sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Connection failed. Please check your network and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(prev => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent) 0%, #A08B6A 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(200, 169, 126, 0.35)",
          zIndex: 9999,
          color: "#0C0A08",
        }}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} strokeWidth={2.5} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageSquare size={22} strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              position: "fixed",
              bottom: 92,
              right: 24,
              width: 380,
              height: 520,
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-border)",
              boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 9998,
            }}
            role="dialog"
            aria-label="VerifAI Assistant"
          >
            {/* Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--bg-border)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
              background: "var(--bg-elevated)",
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent) 0%, #A08B6A 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Bot size={16} color="#0C0A08" strokeWidth={2.5} />
              </div>
              <div>
                <p style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                }}>VerifAI Assistant</p>
                <p style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--verified)",
                    display: "inline-block",
                  }} />
                  Powered by Groq · Llama 3.3
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                }}
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 16px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {messages.length === 0 && (
                <div style={{ textAlign: "center", paddingTop: 32 }}>
                  <Sparkles size={28} style={{ color: "var(--accent)", margin: "0 auto 12px" }} />
                  <p style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                  }}>How can I help?</p>
                  <p style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 20,
                  }}>Ask about AI accountability, regulations, or platform features.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--bg-border)",
                          background: "var(--bg-elevated)",
                          color: "var(--text-secondary)",
                          fontSize: 12,
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "var(--font-sans)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => {
                          (e.target as HTMLElement).style.borderColor = "var(--accent)";
                          (e.target as HTMLElement).style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={e => {
                          (e.target as HTMLElement).style.borderColor = "var(--bg-border)";
                          (e.target as HTMLElement).style.color = "var(--text-secondary)";
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user"
                      ? "var(--radius-md) var(--radius-md) 4px var(--radius-md)"
                      : "var(--radius-md) var(--radius-md) var(--radius-md) 4px",
                    background: msg.role === "user"
                      ? "var(--accent)"
                      : "var(--bg-elevated)",
                    color: msg.role === "user"
                      ? "#0C0A08"
                      : "var(--text-secondary)",
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontFamily: "var(--font-sans)",
                    border: msg.role === "assistant" ? "1px solid var(--bg-border)" : "none",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md) var(--radius-md) var(--radius-md) 4px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--bg-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    <span className="typing-dot" style={{ animationDelay: "0ms" }} />
                    <span className="typing-dot" style={{ animationDelay: "150ms" }} />
                    <span className="typing-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--bg-border)",
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
              background: "var(--bg-surface)",
            }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about AI accountability…"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--bg-border)",
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: input.trim() ? "var(--accent)" : "var(--bg-elevated)",
                  border: "none",
                  cursor: input.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: input.trim() ? "#0C0A08" : "var(--text-muted)",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
                aria-label="Send message"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: typingBounce 1.2s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
