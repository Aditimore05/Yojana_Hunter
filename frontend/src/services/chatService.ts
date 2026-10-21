import { apiFetch } from "@/lib/api";

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  quickReplies?: string[];
}

export async function sendChatMessage(
  prompt: string, 
  language: string = "en",
  history: { sender: "bot" | "user"; text: string }[] = []
): Promise<string> {
  try {
    const backendResponse = await apiFetch<{ reply: string; status: string }>("/chat", {
      method: "POST",
      body: JSON.stringify({ 
        message: prompt, 
        language,
        history: history.slice(-6)
      }),
    });

    if (backendResponse && backendResponse.reply) {
      return backendResponse.reply;
    }

    return "I'm sorry, I couldn't retrieve scheme information right now. Please try again or explore our Scheme Catalog directly.";
  } catch (err: any) {
    console.error("sendChatMessage error:", err);
    return "The scheme assistance service is currently encountering connection difficulties. Please check your network and try again.";
  }
}
