"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, Mic, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { interviewQuestions } from "@/data/demoData";
import { getStoredLanguage, getStoredProfile, saveStoredProfile } from "@/lib/storage";
import { updateProfile } from "@/services/profileService";
import { UserProfile } from "@/types/profile";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface ChatTurn {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; value: string }[];
}

function InterviewContent() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "hi" | "mr">("en");
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState("");
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile());
  const [isCompleted, setIsCompleted] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const customInputRef = useRef<HTMLInputElement | null>(null);
  const isNearBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);

  const [conversation, setConversation] = useState<ChatTurn[]>([]);
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [customValue, setCustomValue] = useState<string>("");
  const [customError, setCustomError] = useState<string | null>(null);

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

  const handleContainerScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const threshold = 120;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= threshold;
  };

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const count = conversation.length;
    const prevCount = prevMsgCountRef.current;
    prevMsgCountRef.current = count;

    if (prevCount === 0) return;

    // Only scroll when genuinely necessary:
    // When a NEW ASSISTANT (bot) message arrives AND the user is already near the bottom.
    // If the user has scrolled upward to review previous questions, do not force them back down.
    if (count > prevCount) {
      const latestMsg = conversation[count - 1];
      if (latestMsg?.sender === "bot" && isNearBottomRef.current) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [conversation]);

function validateGenderInput(text: string): string | null {
  const t = text.trim().toLowerCase();
  const maleTokens = ["male", "man", "men", "boy", "m", "पुरुष", "लड़का", "माणूस", "मुलगा", "purush"];
  const femaleTokens = ["female", "woman", "women", "girl", "f", "महिला", "स्त्री", "लड़की", "औरत", "मुलगी", "mahila"];
  const transTokens = ["trans", "transgender", "third gender", "trans woman", "trans man", "ट्रांसजेंडर", "तृतीयपंथी", "किन्नर"];
  const otherTokens = ["other", "non-binary", "prefer not to say", "इतर", "अन्य"];

  for (const token of maleTokens) {
    if (t === token || t.startsWith(token + " ") || t.endsWith(" " + token)) return "Male";
  }
  for (const token of femaleTokens) {
    if (t === token || t.startsWith(token + " ") || t.endsWith(" " + token)) return "Female";
  }
  for (const token of transTokens) {
    if (t === token || t.includes(token)) return "Transgender";
  }
  for (const token of otherTokens) {
    if (t === token || t.includes(token)) return "Other";
  }

  return null;
}

  // Focus custom input without triggering page scroll jumps
  useEffect(() => {
    if (customMode) {
      customInputRef.current?.focus({ preventScroll: true });
    }
  }, [customMode]);

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (!trimmed) {
      setCustomError("Please enter your answer before proceeding.");
      return;
    }

    const q = interviewQuestions[currentStep];
    if (q?.field === "gender") {
      const validated = validateGenderInput(trimmed);
      if (!validated) {
        setCustomError(
          lang === "mr"
            ? "कृपया वैध लिंग प्रविष्ट करा (पुरुष, महिला, तृतीयपंथी किंवा इतर)."
            : lang === "hi"
            ? "कृपया एक वैध लिंग दर्ज करें (पुरुष, महिला, ट्रांसजेंडर या अन्य)।"
            : "Please enter a valid gender: Male, Female, Transgender, or Other."
        );
        return;
      }
      setCustomMode(false);
      setCustomValue("");
      setCustomError(null);
      handleAnswer(validated, trimmed);
      return;
    }

    setCustomMode(false);
    setCustomValue("");
    setCustomError(null);
    handleAnswer(trimmed, trimmed);
  };

  const handleAnswer = (answerValue: string, displayLabel?: string) => {
    // If the user selected the predefined "Other" button, open custom input mode
    if (answerValue === "Other") {
      setCustomMode(true);
      setCustomValue("");
      setCustomError(null);
      return;
    }

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
    } else if (q.field === "gender") {
      updatedProfile.gender = answerValue;
    } else {
      (updatedProfile as any)[q.field] = answerValue;
    }

    // Update helper boolean flags if answering occupation
    if (q.field === "occupation") {
      const occLower = answerValue.toLowerCase();
      updatedProfile.isFarmer = occLower.includes("farmer") || occLower.includes("kisan") || occLower.includes("agri");
      updatedProfile.isStudent = occLower.includes("student");
      updatedProfile.hasBusiness = occLower.includes("business") || occLower.includes("entrepreneur") || occLower.includes("self-employed") || occLower.includes("shopkeeper") || occLower.includes("artisan");
      if (occLower.includes("housewife") || occLower.includes("homemaker")) {
        if (!updatedProfile.gender) updatedProfile.gender = "Female";
      }
    }

    updatedProfile.completenessPercent = Math.min(100, Math.round(((currentStep + 1) / interviewQuestions.length) * 100));
    setProfile(updatedProfile);
    saveStoredProfile(updatedProfile);
    updateProfile(updatedProfile);

    // Reset custom mode for next question
    setCustomMode(false);
    setCustomValue("");
    setCustomError(null);

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
              ? "उत्कृष्ट! तुमची प्रोफाइल तयार झाली आहे. आम्ही तुमच्या लिंग आणि निकषांनुसार अचूक सरकारी योजना निवडल्या आहेत." 
              : lang === "hi"
              ? "शानदार! आपकी प्रोफ़ाइल पूरी हो गई है। हमने आपके लिंग और पात्रता मानदंडों के अनुसार सर्वोत्तम योजनाएं खोजी हैं।"
              : "Excellent! Your profile is complete. We have tailored and matched government schemes based on your gender, occupation, and criteria.",
          },
        ]);
      }, 400);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    const q = interviewQuestions[currentStep];

    // Input Validation for Gender
    if (q?.field === "gender") {
      const validatedGender = validateGenderInput(text);
      if (!validatedGender) {
        const botErrorTurn: ChatTurn = {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: lang === "mr"
            ? "क्षमस्व, कृपया वैध लिंग निवडा किंवा प्रविष्ट करा (उदा. पुरुष, महिला, तृतीयपंथी किंवा इतर)."
            : lang === "hi"
            ? "कृपया एक वैध लिंग चुनें या दर्ज करें (जैसे पुरुष, महिला, ट्रांसजेंडर या अन्य)।"
            : "Please select or enter a valid gender: Male, Female, Transgender, or Other.",
          options: q.options?.map((o) => ({
            label: o.label[lang] || o.label.en,
            value: o.value,
          })),
        };
        const userTurn: ChatTurn = {
          id: `usr-${Date.now()}`,
          sender: "user",
          text: text,
        };
        setConversation((prev) => [...prev, userTurn, botErrorTurn]);
        setInputText("");
        return;
      }
      setInputText("");
      if (customMode) {
        setCustomMode(false);
        setCustomValue("");
        setCustomError(null);
      }
      handleAnswer(validatedGender, text);
      return;
    }

    // Input Validation for Age
    if (q?.field === "age") {
      const ageNum = parseInt(text.replace(/[^0-9]/g, ""), 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        const botErrorTurn: ChatTurn = {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: lang === "mr"
            ? "कृपया वैध वय प्रविष्ट करा (संख्या, उदा. 21 किंवा 25)."
            : lang === "hi"
            ? "कृपया एक वैध आयु दर्ज करें (संख्या, जैसे 21 या 25)।"
            : "Please enter a valid age in years (e.g. 21, 25, 30).",
          options: q.options?.map((o) => ({
            label: o.label[lang] || o.label.en,
            value: o.value,
          })),
        };
        const userTurn: ChatTurn = {
          id: `usr-${Date.now()}`,
          sender: "user",
          text: text,
        };
        setConversation((prev) => [...prev, userTurn, botErrorTurn]);
        setInputText("");
        return;
      }
      setInputText("");
      if (customMode) {
        setCustomMode(false);
        setCustomValue("");
        setCustomError(null);
      }
      handleAnswer(String(ageNum), `${ageNum} years`);
      return;
    }

    setInputText("");
    if (customMode) {
      setCustomMode(false);
      setCustomValue("");
      setCustomError(null);
    }
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
        <div
          ref={chatContainerRef}
          onScroll={handleContainerScroll}
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-brand-bg/50"
        >
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
                    <div className="pl-11 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {turn.options.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleAnswer(opt.value, opt.label)}
                            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 border ${
                              opt.value === "Other" && customMode
                                ? "bg-blue-50 text-brand-blue border-brand-blue ring-2 ring-brand-blue/30"
                                : "text-slate-700 bg-white hover:bg-blue-50 hover:text-brand-blue hover:border-brand-blue border-brand-border"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Display text input when Other is selected */}
                      {customMode && (
                        <div className="p-3 bg-white border border-blue-200 rounded-xl shadow-xs space-y-2 max-w-md animate-in fade-in duration-200">
                          <label className="block text-xs font-bold text-brand-navy">
                            {interviewQuestions[currentStep]?.field === "occupation"
                              ? "Specify Your Occupation:"
                              : interviewQuestions[currentStep]?.field === "gender"
                              ? "Specify Your Gender:"
                              : interviewQuestions[currentStep]?.field === "education"
                              ? "Specify Your Qualification:"
                              : "Enter Your Answer:"}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              ref={customInputRef}
                              type="text"
                              value={customValue}
                              onChange={(e) => {
                                setCustomValue(e.target.value);
                                if (customError) setCustomError(null);
                              }}
                              placeholder={
                                interviewQuestions[currentStep]?.field === "occupation"
                                  ? "e.g. Teacher, Housewife, Shopkeeper"
                                  : interviewQuestions[currentStep]?.field === "gender"
                                  ? "e.g. Male, Female, Transgender, Other"
                                  : interviewQuestions[currentStep]?.field === "education"
                                  ? "e.g. B.Ed, Diploma in Civil, M.Phil"
                                  : "Type your answer here..."
                              }
                              className="flex-1 bg-slate-50 border border-brand-border rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCustomSubmit();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleCustomSubmit}
                              className="px-3.5 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg text-xs font-bold shadow-xs transition shrink-0"
                            >
                              Save
                            </button>
                          </div>
                          {customError && (
                            <p className="text-xs text-rose-600 font-semibold">{customError}</p>
                          )}
                        </div>
                      )}
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Profile Ready!</h4>
                  <p className="text-xs text-emerald-700">All 7 fields recorded (including Gender). Ineligible and non-applicable schemes are automatically filtered out.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => router.push("/profile")}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition"
                >
                  View Profile
                </button>
                <button
                  onClick={() => router.push("/schemes")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>View Matched Schemes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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

export default function InterviewPage() {
  return (
    <ProtectedRoute>
      <InterviewContent />
    </ProtectedRoute>
  );
}
