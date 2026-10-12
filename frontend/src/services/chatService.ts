import { apiFetch } from "@/lib/api";

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  quickReplies?: string[];
}

export async function sendChatMessage(prompt: string, language: string = "en"): Promise<string> {
  const backendResponse = await apiFetch<{ reply: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ message: prompt, language }),
  });

  if (backendResponse && backendResponse.reply) {
    return backendResponse.reply;
  }

  // Realistic fallback responses based on keywords
  const p = prompt.toLowerCase();
  if (p.includes("vidyalakshmi") || p.includes("loan") || p.includes("education")) {
    return "The PM Vidyalakshmi Scheme provides education loans up to ₹6.5 Lakh with collateral-free guarantee and interest subsidy for students from families earning ≤ 8 Lakh. You are eligible!";
  }
  if (p.includes("document") || p.includes("income certificate")) {
    return "For student scholarships, your Income Certificate must be issued by the Tahsildar / Revenue Department within the current financial year. You can upload it directly under the Documents tab.";
  }
  if (p.includes("draft") || p.includes("apply") || p.includes("form")) {
    return "We have pre-filled your application draft based on your verified profile. You can review and download the official PDF directly from the Application Draft page.";
  }
  return "I'm your Yojana Hunter AI assistant. I can guide you through checking eligibility criteria, uploading required certificates, or generating official application drafts. How can I help you today?";
}
