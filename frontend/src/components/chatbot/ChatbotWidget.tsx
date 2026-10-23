"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  MessageSquare, 
  X, 
  Send, 
  Mic, 
  Sparkles, 
  Layers, 
  Tag, 
  Bot, 
  User as UserIcon,
  Compass,
  ArrowRight,
  ExternalLink,
  Lock,
  LayoutDashboard,
  UserCheck
} from "lucide-react";
import { sendChatMessageDetailed, ChatMessage, NavigationDestination } from "@/services/chatService";

export const ChatbotWidget: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi" | "mr">("en");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-0",
      sender: "bot",
      text: "Hello! I am your Yojana Hunter Assistant. Ask me anything about finding welfare schemes, checking eligibility, or navigating the platform (Dashboard, Schemes, Profile, AI Scheme Discovery, etc.).",
      time: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Don't render chatbot on admin panel (after all hooks are called)
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyContext = messages.map(m => ({ sender: m.sender, text: m.text }));
      const response = await sendChatMessageDetailed(query, language, historyContext);
      
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: response.reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        navigation: response.navigation,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: "I'm having trouble connecting right now. Please check official guidelines or try again shortly.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (actionTitle: string) => {
    if (actionTitle === "Dashboard") {
      handleSend("Take me to Dashboard");
    } else if (actionTitle === "Schemes") {
      handleSend("Open Schemes");
    } else if (actionTitle === "AI Discovery") {
      handleSend("Open AI Scheme Discovery");
    } else if (actionTitle === "My Profile") {
      handleSend("Navigate to Profile");
    }
  };

  return (
    <>
      {/* Floating launcher trigger (Sticky Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-brand-navy to-brand-blue text-white rounded-full shadow-floating hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20"
          aria-label="Open Yojana Hunter Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-teal-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
          </div>
          <span className="text-sm font-bold tracking-tight">AI Assistant</span>
        </button>
      )}

      {/* Expandable Dark Navy & Blue Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[92vw] sm:w-[440px] max-h-[85vh] h-[640px] flex flex-col bg-brand-navy-dark text-white rounded-2xl shadow-floating border border-slate-700/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-brand-navy border-b border-slate-700 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                <Bot className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                  Yojana Hunter Assistant
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1">
                  Ask to navigate to any page, explore schemes, or check criteria.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Translation Bar */}
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Language</span>
            <div className="flex items-center gap-1.5">
              {(["en", "hi", "mr"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    language === l
                      ? "bg-brand-blue text-white shadow-xs"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {l === "en" ? "English" : l === "hi" ? "हिंदी" : "मराठी"}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Navigation Grid (2x2) */}
          <div className="p-2.5 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAction("Dashboard")}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition text-left border border-slate-700/50"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate font-medium">Go to Dashboard</span>
            </button>
            <button
              onClick={() => handleQuickAction("Schemes")}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition text-left border border-slate-700/50"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate font-medium">Open Schemes</span>
            </button>
            <button
              onClick={() => handleQuickAction("My Profile")}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition text-left border border-slate-700/50"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate font-medium">Open Profile</span>
            </button>
            <button
              onClick={() => handleQuickAction("AI Discovery")}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition text-left border border-slate-700/50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate font-medium">AI Discovery (Admin)</span>
            </button>
          </div>

          {/* Conversation Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-teal-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-brand-blue text-white rounded-br-none shadow-sm"
                      : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

                  {/* MCP-based Navigation Interactive Card */}
                  {m.navigation && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-teal-500/40 space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Compass className="w-4 h-4 text-teal-400 shrink-0 animate-pulse" />
                          <span className="font-bold text-xs text-white truncate">
                            {m.navigation.title}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border flex items-center gap-1 ${
                            m.navigation.requires_admin
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : m.navigation.requires_auth
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          }`}
                        >
                          {m.navigation.requires_admin && <Lock className="w-2.5 h-2.5" />}
                          <span>
                            {m.navigation.requires_admin
                              ? "Admin Required"
                              : m.navigation.requires_auth
                              ? "Login Required"
                              : "Public"}
                          </span>
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 bg-slate-950/50 p-2 rounded-lg border border-slate-800 space-y-1">
                        <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                          UI Navigation Steps:
                        </div>
                        <div>{m.navigation.ui_instructions}</div>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (m.navigation?.route) {
                              router.push(m.navigation.route);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-brand-blue hover:from-teal-400 hover:to-brand-blue-dark text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <span>Open {m.navigation.title.split("/")[0].trim()}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={m.navigation.full_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-teal-300 hover:text-teal-200 underline flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition"
                        >
                          <span>Direct Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <span className="block mt-1.5 text-[10px] text-slate-400 text-right">
                    {m.time}
                  </span>
                </div>
                {m.sender === "user" && (
                  <div className="w-7 h-7 rounded-full bg-brand-blue flex items-center justify-center shrink-0 mt-0.5 text-white">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-slate-400">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-teal-400" />
                </div>
                <div className="p-2.5 bg-slate-800 rounded-xl rounded-bl-none border border-slate-700 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-slate-800/90 rounded-xl px-3 py-1.5 border border-slate-700 focus-within:border-teal-400 transition"
            >
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-teal-400 transition"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g. 'Open Schemes', 'Go to Dashboard'..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-1.5 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 disabled:hover:bg-brand-blue rounded-lg text-white transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
