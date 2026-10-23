"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, Mic, Sparkles, CheckCircle2, ArrowRight, User, Users, Heart } from "lucide-react";
import { interviewQuestions } from "@/data/demoData";
import { getStoredLanguage, getStoredProfile, saveStoredProfile, setActiveProfileId } from "@/lib/storage";
import { createProfile, updateProfile } from "@/services/profileService";
import { useAuth } from "@/context/AuthContext";
import { UserProfile, FamilyRelationship } from "@/types/profile";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface ChatTurn {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; value: string }[];
}

type InterviewStage = "who" | "relationship" | "name" | "criteria";

function validateGenderInput(text: string): string | null {
  const t = text.trim().toLowerCase();
  const maleTokens = ["male", "man", "men", "boy", "m", "पुरुष", "लड़का", "माणूस", "मुलगा", "purush", "पिता", "वडील", "father"];
  const femaleTokens = ["female", "woman", "women", "girl", "f", "महिला", "स्त्री", "लड़की", "औरत", "मुलगी", "mahila", "माता", "आई", "mother"];
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

function getCriteriaPrompt(
  q: typeof interviewQuestions[0],
  lang: "en" | "hi" | "mr",
  relationship: FamilyRelationship,
  personName: string
): string {
  const isRelative = relationship !== "Self";
  const nameOrRel = personName || relationship;

  if (!isRelative) {
    return q.prompt[lang] || q.prompt.en;
  }

  switch (q.field) {
    case "occupation":
      return lang === "mr"
        ? `${nameOrRel} यांचा सध्याचा मुख्य व्यवसाय काय आहे?`
        : lang === "hi"
        ? `${nameOrRel} का वर्तमान मुख्य व्यवसाय क्या है?`
        : `What is ${nameOrRel}'s current primary occupation?`;
    case "gender":
      return lang === "mr"
        ? `${nameOrRel} यांचे लिंग काय आहे?`
        : lang === "hi"
        ? `${nameOrRel} का लिंग क्या है?`
        : `What is ${nameOrRel}'s gender?`;
    case "annualIncome":
      return lang === "mr"
        ? `${nameOrRel} यांच्या कुटुंबाचे एकूण वार्षिक उत्पन्न किती आहे?`
        : lang === "hi"
        ? `${nameOrRel} के परिवार की कुल वार्षिक आय कितनी है?`
        : `What is ${nameOrRel}'s annual family income?`;
    case "age":
      return lang === "mr"
        ? `${nameOrRel} यांचे सध्याचे वय किती आहे?`
        : lang === "hi"
        ? `${nameOrRel} की वर्तमान आयु कितनी है?`
        : `What is ${nameOrRel}'s current age?`;
    case "state":
      return lang === "mr"
        ? `${nameOrRel} कोणत्या राज्यात राहतात?`
        : lang === "hi"
        ? `${nameOrRel} किस राज्य के निवासी हैं?`
        : `Which state does ${nameOrRel} reside in?`;
    case "education":
      return lang === "mr"
        ? `${nameOrRel} यांचे सर्वोच्च शिक्षण काय आहे?`
        : lang === "hi"
        ? `${nameOrRel} की उच्चतम शिक्षा क्या है?`
        : `What is ${nameOrRel}'s highest education qualification?`;
    case "category":
      return lang === "mr"
        ? `${nameOrRel} कोणत्या सामाजिक प्रवर्गात मोडतात? (आरक्षित योजनांसाठी)`
        : lang === "hi"
        ? `${nameOrRel} किस सामाजिक वर्ग से आते हैं? (आरक्षित योजनाओं के लिए)`
        : `Which social category does ${nameOrRel} belong to?`;
    default:
      return q.prompt[lang] || q.prompt.en;
  }
}

function getFieldCustomLabel(field?: string, lang: "en" | "hi" | "mr" = "en"): string {
  switch (field) {
    case "occupation":
      return lang === "mr" ? "व्यवसाय नमूद करा:" : lang === "hi" ? "व्यवसाय दर्ज करें:" : "Specify Occupation:";
    case "gender":
      return lang === "mr" ? "लिंग नमूद करा:" : lang === "hi" ? "लिंग दर्ज करें:" : "Specify Gender:";
    case "education":
      return lang === "mr" ? "शिक्षण नमूद करा:" : lang === "hi" ? "शिक्षा दर्ज करें:" : "Specify Qualification:";
    case "state":
      return lang === "mr" ? "राज्य नमूद करा:" : lang === "hi" ? "राज्य दर्ज करें:" : "Specify State:";
    case "annualIncome":
      return lang === "mr" ? "वार्षिक उत्पन्न नमूद करा:" : lang === "hi" ? "वार्षिक आय दर्ज करें:" : "Specify Annual Income:";
    case "category":
      return lang === "mr" ? "सामाजिक प्रवर्ग नमूद करा:" : lang === "hi" ? "सामाजिक वर्ग दर्ज करें:" : "Specify Category / Caste:";
    case "age":
      return lang === "mr" ? "वय नमूद करा:" : lang === "hi" ? "आयु दर्ज करें:" : "Specify Age:";
    default:
      return lang === "mr" ? "उत्तर नमूद करा:" : lang === "hi" ? "उत्तर दर्ज करें:" : "Specify Answer:";
  }
}

function getFieldCustomPlaceholder(field?: string, lang: "en" | "hi" | "mr" = "en"): string {
  switch (field) {
    case "occupation":
      return "e.g. Teacher, Housewife, Electrician, Driver, Tailor";
    case "gender":
      return "e.g. Male, Female, Transgender, Other";
    case "education":
      return "e.g. B.Ed, Diploma in Civil, M.Phil, High School";
    case "state":
      return "e.g. Gujarat, Delhi, Punjab, Rajasthan, Bihar";
    case "annualIncome":
      return "e.g. 2.5 Lakh, 80,000, 4.2 Lakh";
    case "category":
      return "e.g. General, OBC, EWS, SC, ST";
    case "age":
      return "e.g. 21, 28, 42";
    default:
      return "Type your answer here...";
  }
}

function InterviewContent() {
  const router = useRouter();
  const { switchActiveProfile, refreshFamilyProfiles } = useAuth();
  const [lang, setLang] = useState<"en" | "hi" | "mr">("en");

  // Profile Flow State
  const [stage, setStage] = useState<InterviewStage>("who");
  const [targetType, setTargetType] = useState<"self" | "relative">("self");
  const [relationship, setRelationship] = useState<FamilyRelationship>("Self");
  const [personName, setPersonName] = useState<string>("");
  const [criteriaIndex, setCriteriaIndex] = useState<number>(0);

  const [inputText, setInputText] = useState("");
  const [collectedProfile, setCollectedProfile] = useState<Partial<UserProfile>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedProfileId, setSavedProfileId] = useState<number | null>(null);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const customInputRef = useRef<HTMLInputElement | null>(null);
  const isNearBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);

  const [conversation, setConversation] = useState<ChatTurn[]>([]);
  const [activeCustomField, setActiveCustomField] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [customError, setCustomError] = useState<string | null>(null);

  // Calculate current step and total steps for progress bar
  const totalSteps = targetType === "relative" ? 10 : 8;
  let currentStepNumber = 1;
  if (stage === "who") currentStepNumber = 1;
  else if (stage === "relationship") currentStepNumber = 2;
  else if (stage === "name") currentStepNumber = 3;
  else if (stage === "criteria") {
    currentStepNumber = targetType === "relative" ? 3 + criteriaIndex + 1 : 1 + criteriaIndex + 1;
  }
  const progressPercent = isCompleted ? 100 : Math.min(100, Math.round((currentStepNumber / totalSteps) * 100));

  // Initialize Interview with Step 0: "Who are you checking schemes for?"
  useEffect(() => {
    const activeLang = getStoredLanguage();
    setLang(activeLang);

    const whoPrompt =
      activeLang === "mr"
        ? "नमस्कार! मी योजना हंटर आहे 👋 आज तुम्ही कोणासाठी सरकारी योजना शोधत आहात?"
        : activeLang === "hi"
        ? "नमस्ते! मैं योजना हंटर हूँ 👋 आज आप किसके लिए सरकारी योजनाएं खोज रहे हैं?"
        : "Hello! I'm Yojana Hunter 👋 Who are you checking government schemes for today?";

    const whoOptions = [
      {
        label:
          activeLang === "mr"
            ? "👤 माझ्या स्वतःसाठी (Self)"
            : activeLang === "hi"
            ? "👤 मेरे स्वयं के लिए (Self)"
            : "👤 For Myself (Self)",
        value: "Self",
      },
      {
        label:
          activeLang === "mr"
            ? "👥 नातेवाईक / कुटुंबातील सदस्यासाठी"
            : activeLang === "hi"
            ? "👥 परिवार के सदस्य / रिश्तेदार के लिए"
            : "👥 For a Relative / Family Member",
        value: "Relative",
      },
    ];

    setConversation([
      {
        id: "msg-0",
        sender: "bot",
        text: whoPrompt,
        options: whoOptions,
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

  useEffect(() => {
    if (activeCustomField) {
      customInputRef.current?.focus({ preventScroll: true });
    }
  }, [activeCustomField]);

  // Finalize and save profile to backend in PostgreSQL
  const finalizeAndSaveProfile = async (finalData: Partial<UserProfile>, rel: FamilyRelationship, name: string) => {
    const fallbackName = name || (rel === "Self" ? "My Profile" : `${rel}'s Profile`);
    const payload: Partial<UserProfile> = {
      ...finalData,
      name: fallbackName,
      relationship: rel,
      completenessPercent: 100,
    };

    try {
      if (rel === "Self") {
        const updated = await updateProfile(payload);
        if (updated?.id) setSavedProfileId(updated.id);
      } else {
        const created = await createProfile(payload);
        if (created?.id) {
          setSavedProfileId(created.id);
          await switchActiveProfile(created.id);
        }
      }
      await refreshFamilyProfiles();
    } catch (err) {
      console.warn("Error saving interview profile:", err);
    }
  };

  // Handle stage 1: Beneficiary choice (Self vs Relative)
  const handleWhoChoice = (choice: string, displayLabel: string) => {
    const userTurn: ChatTurn = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: displayLabel,
    };

    if (choice === "Self" || choice.toLowerCase().includes("myself") || choice.toLowerCase().includes("self")) {
      setTargetType("self");
      setRelationship("Self");
      const myName = "Myself";
      setPersonName(myName);
      setStage("criteria");
      setCriteriaIndex(0);

      const q0 = interviewQuestions[0];
      const botPrompt =
        lang === "mr"
          ? "उत्तम! सुरुवात करूया. तुमचा सध्याचा मुख्य व्यवसाय काय आहे?"
          : lang === "hi"
          ? "बहुत बढ़िया! शुरू करते हैं। आपका वर्तमान मुख्य व्यवसाय क्या है?"
          : "Great! Let's find the best schemes for you. What is your current occupation?";
      const botOptions = q0.options?.map((o) => ({
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
      }, 350);
    } else {
      // Relative selected
      setTargetType("relative");
      setStage("relationship");

      const relPrompt =
        lang === "mr"
          ? "या व्यक्तीशी तुमचे काय नाते आहे?"
          : lang === "hi"
          ? "इस व्यक्ति से आपका क्या संबंध है?"
          : "What is your relationship to this person?";

      const relOptions = [
        { label: lang === "mr" ? "वडील (Father)" : lang === "hi" ? "पिता (Father)" : "Father", value: "Father" },
        { label: lang === "mr" ? "आई (Mother)" : lang === "hi" ? "माता (Mother)" : "Mother", value: "Mother" },
        { label: lang === "mr" ? "मुलगा / मुलगी (Child)" : lang === "hi" ? "बच्चा / संतान (Child)" : "Child", value: "Child" },
        { label: lang === "mr" ? "पती / पत्नी (Spouse)" : lang === "hi" ? "जीवनसाथी (Spouse)" : "Spouse", value: "Spouse" },
        { label: lang === "mr" ? "इतर नातेवाईक (Other)" : lang === "hi" ? "अन्य रिश्तेदार (Other)" : "Other", value: "Other" },
      ];

      setTimeout(() => {
        setConversation((prev) => [
          ...prev,
          userTurn,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: relPrompt,
            options: relOptions,
          },
        ]);
      }, 350);
    }
  };

  // Handle stage 2: Relationship choice
  const handleRelationshipChoice = (relValue: string, displayLabel: string) => {
    const validRel = (relValue as FamilyRelationship) || "Other";
    setRelationship(validRel);
    setStage("name");

    const userTurn: ChatTurn = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: displayLabel,
    };

    const namePrompt =
      lang === "mr"
        ? `तुमच्या ${displayLabel} यांचे नाव काय आहे? आपण खाली नाव टाइप करू शकता किंवा खालील बटण निवडू शकता:`
        : lang === "hi"
        ? `आपके ${displayLabel} का पूरा नाम क्या है? आप नीचे नाम टाइप कर सकते हैं या डिफ़ॉल्ट चुन सकते हैं:`
        : `What is your ${displayLabel}'s full name? You can type their name below or select default:`;

    const nameOptions = [
      {
        label: `${validRel}'s Profile`,
        value: `${validRel}'s Profile`,
      },
    ];

    setTimeout(() => {
      setConversation((prev) => [
        ...prev,
        userTurn,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: namePrompt,
          options: nameOptions,
        },
      ]);
    }, 350);
  };

  // Handle stage 3: Name input
  const handleNameChoice = (chosenName: string, displayLabel: string) => {
    const nameVal = chosenName.trim() || `${relationship}'s Profile`;
    setPersonName(nameVal);
    setStage("criteria");
    setCriteriaIndex(0);

    const userTurn: ChatTurn = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: displayLabel || nameVal,
    };

    const q0 = interviewQuestions[0];
    const botPrompt = getCriteriaPrompt(q0, lang, relationship, nameVal);
    const botOptions = q0.options?.map((o) => ({
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
    }, 350);
  };

  // Handle criteria answers
  const handleCriteriaAnswer = (answerValue: string, displayLabel?: string) => {
    const q = interviewQuestions[criteriaIndex];

    if (answerValue === "Other") {
      setActiveCustomField(q.field);
      setCustomError(null);
      return;
    }

    const userLabel = displayLabel || answerValue;
    const userTurn: ChatTurn = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userLabel,
    };

    const updatedProfile: Partial<UserProfile> = { ...collectedProfile };
    if (q.field === "age") {
      updatedProfile.age = parseInt(answerValue) || 21;
    } else if (q.field === "gender") {
      updatedProfile.gender = answerValue;
    } else {
      (updatedProfile as any)[q.field] = answerValue;
    }

    if (q.field === "occupation") {
      const occLower = answerValue.toLowerCase();
      updatedProfile.isFarmer = occLower.includes("farmer") || occLower.includes("kisan") || occLower.includes("agri");
      updatedProfile.isStudent = occLower.includes("student");
      updatedProfile.hasBusiness =
        occLower.includes("business") ||
        occLower.includes("entrepreneur") ||
        occLower.includes("self-employed") ||
        occLower.includes("shopkeeper") ||
        occLower.includes("artisan");
      if (occLower.includes("housewife") || occLower.includes("homemaker")) {
        if (!updatedProfile.gender) updatedProfile.gender = "Female";
      }
    }

    setCollectedProfile(updatedProfile);
    setActiveCustomField(null);
    setCustomError(null);

    const nextIndex = criteriaIndex + 1;

    if (nextIndex < interviewQuestions.length) {
      const nextQ = interviewQuestions[nextIndex];
      const botPrompt = getCriteriaPrompt(nextQ, lang, relationship, personName);
      let botOptions = nextQ.options?.map((o) => ({
        label: o.label[lang] || o.label.en,
        value: o.value,
      }));

      // Helpful hint: if relationship is Father, Male is first; if Mother, Female is first
      if (nextQ.field === "gender") {
        if (relationship === "Father" && botOptions) {
          botOptions = botOptions.sort((a, b) => (a.value === "Male" ? -1 : 1));
        } else if (relationship === "Mother" && botOptions) {
          botOptions = botOptions.sort((a, b) => (a.value === "Female" ? -1 : 1));
        }
      }

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
        setCriteriaIndex(nextIndex);
      }, 350);
    } else {
      // All criteria questions completed!
      setIsCompleted(true);
      const displayName = personName || (relationship === "Self" ? "Self" : `${relationship}'s Profile`);
      finalizeAndSaveProfile(updatedProfile, relationship, displayName);

      const completionText =
        lang === "mr"
          ? `उत्कृष्ट! ${displayName} (${relationship}) यांचे प्रोफाइल पूर्ण झाले आहे आणि डेटाबेसमध्ये सेव्ह झाले आहे. आम्ही त्यांच्या निकषांनुसार अचूक सरकारी योजना निवडल्या आहेत.`
          : lang === "hi"
          ? `शानदार! ${displayName} (${relationship}) की प्रोफ़ाइल पूरी हो गई है और डेटाबेस में सुरक्षित हो गई है। हमने उनकी पात्रता के अनुसार सर्वोत्तम योजनाएं खोजी हैं।`
          : `Excellent! Profile for ${displayName} (${relationship}) is complete and saved to your account. We have tailored government schemes specifically based on their criteria.`;

      setTimeout(() => {
        setConversation((prev) => [
          ...prev,
          userTurn,
          {
            id: `bot-done`,
            sender: "bot",
            text: completionText,
          },
        ]);
      }, 350);
    }
  };

  // Dispatch answer based on active stage
  const handleAnswer = (answerValue: string, displayLabel?: string) => {
    if (stage === "who") {
      handleWhoChoice(answerValue, displayLabel || answerValue);
    } else if (stage === "relationship") {
      handleRelationshipChoice(answerValue, displayLabel || answerValue);
    } else if (stage === "name") {
      handleNameChoice(answerValue, displayLabel || answerValue);
    } else {
      handleCriteriaAnswer(answerValue, displayLabel);
    }
  };

  const handleCustomSubmit = (targetQ?: typeof interviewQuestions[0]) => {
    const q = targetQ || interviewQuestions[criteriaIndex];
    const fieldKey = q?.field || "other";
    const rawVal = customInputs[fieldKey] || "";
    const trimmed = rawVal.trim();
    if (!trimmed) {
      setCustomError("Please enter your answer before proceeding.");
      return;
    }

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
      setActiveCustomField(null);
      setCustomError(null);
      handleCriteriaAnswer(validated, trimmed);
      return;
    }

    if (q?.field === "age") {
      const ageNum = parseInt(trimmed.replace(/[^0-9]/g, ""), 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        setCustomError(
          lang === "mr"
            ? "कृपया वैध वय प्रविष्ट करा (संख्या, उदा. 21 किंवा 25)."
            : lang === "hi"
            ? "कृपया एक वैध आयु दर्ज करें (संख्या, जैसे 21 या 25)।"
            : "Please enter a valid age in years (e.g. 21, 25, 30)."
        );
        return;
      }
      setActiveCustomField(null);
      setCustomError(null);
      handleCriteriaAnswer(String(ageNum), `${ageNum} years`);
      return;
    }

    setActiveCustomField(null);
    setCustomError(null);
    handleCriteriaAnswer(trimmed, trimmed);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();

    if (stage === "who") {
      const t = text.toLowerCase();
      if (t.includes("rel") || t.includes("fam") || t.includes("father") || t.includes("mother") || t.includes("नाते")) {
        setInputText("");
        handleWhoChoice("Relative", text);
      } else {
        setInputText("");
        handleWhoChoice("Self", text);
      }
      return;
    }

    if (stage === "relationship") {
      const t = text.toLowerCase();
      let matchedRel: FamilyRelationship = "Other";
      if (t.includes("father") || t.includes("पिता") || t.includes("वडील") || t.includes("dad")) matchedRel = "Father";
      else if (t.includes("mother") || t.includes("माता") || t.includes("आई") || t.includes("mom")) matchedRel = "Mother";
      else if (t.includes("child") || t.includes("son") || t.includes("daughter") || t.includes("मुलगा") || t.includes("मुलगी") || t.includes("बच्चा")) matchedRel = "Child";
      else if (t.includes("spouse") || t.includes("wife") || t.includes("husband") || t.includes("पती") || t.includes("पत्नी")) matchedRel = "Spouse";

      setInputText("");
      handleRelationshipChoice(matchedRel, text);
      return;
    }

    if (stage === "name") {
      setInputText("");
      handleNameChoice(text, text);
      return;
    }

    // Criteria stage
    const q = interviewQuestions[criteriaIndex];

    if (q?.field === "gender") {
      const validatedGender = validateGenderInput(text);
      if (!validatedGender) {
        const botErrorTurn: ChatTurn = {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text:
            lang === "mr"
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
      if (activeCustomField) {
        setActiveCustomField(null);
        setCustomError(null);
      }
      handleCriteriaAnswer(validatedGender, text);
      return;
    }

    if (q?.field === "age") {
      const ageNum = parseInt(text.replace(/[^0-9]/g, ""), 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        const botErrorTurn: ChatTurn = {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text:
            lang === "mr"
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
      if (activeCustomField) {
        setActiveCustomField(null);
        setCustomError(null);
      }
      handleCriteriaAnswer(String(ageNum), `${ageNum} years`);
      return;
    }

    setInputText("");
    if (activeCustomField) {
      setActiveCustomField(null);
      setCustomError(null);
    }
    handleCriteriaAnswer(text, text);
  };

  const currentCriteriaQ = stage === "criteria" ? interviewQuestions[criteriaIndex] : null;

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
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-brand-navy">
                  Conversational Interview
                </h2>
                {relationship && relationship !== "Self" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Heart className="w-3 h-3 text-indigo-500" />
                    <span>{personName || relationship} ({relationship})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Step {currentStepNumber} of {totalSteps}
                {stage === "criteria" && ` • ${currentCriteriaQ?.field}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-blue h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-brand-blue">{progressPercent}%</span>
          </div>
        </div>

        {/* Chat Stream */}
        <div
          ref={chatContainerRef}
          onScroll={handleContainerScroll}
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-brand-bg/50"
        >
          {conversation.map((turn, index) => {
            const isLatestBotTurn = turn.sender === "bot" && index === conversation.length - 1;

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

                  {/* Quick-Answer Option Buttons (Only for the active / latest bot turn while interview is not completed) */}
                  {turn.options && !isCompleted && isLatestBotTurn && (
                    <div className="pl-11 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {turn.options.map((opt) => {
                          const isOtherSelected =
                            opt.value === "Other" &&
                            currentCriteriaQ &&
                            activeCustomField === currentCriteriaQ.field;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleAnswer(opt.value, opt.label)}
                              className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 border ${
                                isOtherSelected
                                  ? "bg-blue-50 text-brand-blue border-brand-blue ring-2 ring-brand-blue/30"
                                  : "text-slate-700 bg-white hover:bg-blue-50 hover:text-brand-blue hover:border-brand-blue border-brand-border"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Display isolated text input when Other is selected for active criteria question */}
                      {currentCriteriaQ && activeCustomField === currentCriteriaQ.field && (
                        <div className="p-3 bg-white border border-blue-200 rounded-xl shadow-xs space-y-2 max-w-md animate-in fade-in duration-200">
                          <label className="block text-xs font-bold text-brand-navy">
                            {getFieldCustomLabel(currentCriteriaQ.field, lang)}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              ref={customInputRef}
                              type="text"
                              value={customInputs[currentCriteriaQ.field] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomInputs((prev) => ({
                                  ...prev,
                                  [currentCriteriaQ.field]: val,
                                }));
                                if (customError) setCustomError(null);
                              }}
                              placeholder={getFieldCustomPlaceholder(currentCriteriaQ.field, lang)}
                              className="flex-1 bg-slate-50 border border-brand-border rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCustomSubmit(currentCriteriaQ);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleCustomSubmit(currentCriteriaQ)}
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
                  <h4 className="text-sm font-bold text-emerald-900">
                    Profile Ready for {personName || relationship} ({relationship})!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Saved to PostgreSQL database. Scheme eligibility is calculated specifically for this family member.
                  </p>
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
              placeholder={
                stage === "who"
                  ? "Type 'Self' or 'Relative'..."
                  : stage === "relationship"
                  ? "Type relationship (Father, Mother, Child, etc.)..."
                  : stage === "name"
                  ? "Type person's full name..."
                  : "Type your answer..."
              }
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
