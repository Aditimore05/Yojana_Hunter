"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, Mic, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { interviewQuestions } from "@/data/demoData";
import { getStoredLanguage, getStoredProfile, saveStoredProfile } from "@/lib/storage";
import { updateProfile } from "@/services/profileService";
import { UserProfile } from "@/types/profile";

interface ChatTurn {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; value: string }[];
}

export default function InterviewPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "hi" | "mr">("en");
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState("");
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile());
  const [isCompleted, setIsCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [conversation, setConversation] = useState<ChatTurn[]>([]);

  useEffect(() => {
    const activeLang = getStoredLanguage();
    setLang(activeLang);

    // Initial greeting with question 0
    const q0 = interviewQuestions[0];
    const initialPrompt = q0.prompt[activeLang] || q0.prompt.en;
    const initialOptions = q0.options?.map((o) => ({
      label: o.label[activeLang] || o.label.en,
      value: o.value,
    }));

    setConversation([
      {
        id: "msg-0",
        sender: "bot",
        text: initialPrompt,
        options: initialOptions,
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleAnswer = (answerValue: string, displayLabel?: string) => {
    const q = interviewQuestions[currentStep];
    const userLabel = displayLabel || answerValue;

    // 1. Record user response in chat
    const userTurn: ChatTurn = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userLabel,
    };

    // Update profile
    const updatedProfile: UserProfile = { ...profile };
    if (q.field === "age") {
      updatedProfile.age = parseInt(answerValue) || 21;
    } else {
      (updatedProfile as any)[q.field] = answerValue;
    }
    updatedProfile.completenessPercent = Math.min(100, Math.round(((currentStep + 1) / interviewQuestions.length) * 100));
    setProfile(updatedProfile);
    saveStoredProfile(updatedProfile);
    updateProfile(updatedProfile);

    const nextStep = currentStep + 1;

    if (nextStep < interviewQuestions.length) {
      const nextQ = interviewQuestions[nextStep];
      const botPrompt = nextQ.prompt[lang] || nextQ.prompt.en;
      const botOptions = nextQ.options?.map((o) => ({
        label: o.label[lang] || o.label.en,
        value: o.value,
      }));

      setTimeout(() => {
        setConversation((prev) => [
          ...prev,
          userTurn,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: botPrompt,
            options: botOptions,
          },
        ]);
        setCurrentStep(nextStep);
      }, 400);
    } else {
      // Completed all questions
      setIsCompleted(true);
      setTimeout(() => {
        setConversation((prev) => [
          ...prev,
          userTurn,
          {
            id: `bot-done`,
            sender: "bot",
            text: lang === "mr" 
              ? "उत्कृष्ट! तुमची प्रोफाइल तयार झाली आहे. आता आम्ही तुमच्यासाठी सर्वोत्तम योजना शोधू शकतो." 
              : lang === "hi"
              ? "शानदार! आपकी प्रोफ़ाइल पूरी हो गई है। अब हम आपके लिए सर्वोत्तम योजनाएं खोज सकते हैं।"
              : "Excellent! Your profile is complete. We have found matched schemes tailored to your criteria.",
          },
        ]);
      }, 400);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");
    handleAnswer(text, text);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 bg-brand-bg">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-brand-border shadow-card flex flex-col h-[750px] max-h-[85vh] overflow-hidden">
        {/* Top Header inside chat card */}
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-blue" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-brand-navy">
                Conversational Interview
              </h2>
              <p className="text-xs text-slate-500">
                Step {Math.min(currentStep + 1, interviewQuestions.length)} of {interviewQuestions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-blue h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(((currentStep + 1) / interviewQuestions.length) * 100))}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-brand-blue">
              {Math.min(100, Math.round(((currentStep + 1) / interviewQuestions.length) * 100))}%
            </span>
          </div>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-brand-bg/50">
          {conversation.map((turn) => {
            if (turn.sender === "bot") {
              return (
                <div key={turn.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5 text-brand-blue">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-brand-border rounded-2xl rounded-tl-none p-4 text-xs sm:text-sm text-slate-800 shadow-xs max-w-[85%] leading-relaxed">
                      {turn.text}
                    </div>
                  </div>

                  {/* Quick-Answer Option Buttons */}
                  {turn.options && !isCompleted && (
                    <div className="pl-11 flex flex-wrap gap-2">
                      {turn.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleAnswer(opt.value, opt.label)}
                          className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-blue-50 hover:text-brand-blue hover:border-brand-blue border border-brand-border rounded-xl shadow-xs transition-all active:scale-95"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={turn.id} className="flex justify-end">
                <div className="bg-brand-blue text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-xs sm:text-sm font-medium shadow-sm max-w-[80%]">
                  {turn.text}
                </div>
              </div>
            );
          })}

          {isCompleted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 mt-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Profile Ready!</h4>
                  <p className="text-xs text-emerald-700">All responses recorded successfully.</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <span>View Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Bottom Input */}
        <div className="p-3 sm:p-4 bg-white border-t border-brand-border">
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-brand-blue rounded-xl hover:bg-slate-100 transition"
              title="Voice Input"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your answer..."
              disabled={isCompleted}
              className="flex-1 bg-slate-50 border border-brand-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isCompleted}
              className="w-10 h-10 rounded-xl bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white flex items-center justify-center shadow-sm transition shrink-0"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
