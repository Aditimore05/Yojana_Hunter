import { apiFetch } from "@/lib/api";

export interface NavigationDestination {
  id: string;
  title: string;
  route: string;
  full_url: string;
  category: string;
  requires_auth: boolean;
  requires_admin: boolean;
  description: string;
  ui_instructions: string;
  match_score?: number;
}

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  navigation?: NavigationDestination;
  quickReplies?: string[];
}

export interface ChatBotResponse {
  reply: string;
  status: string;
  source?: string;
  navigation?: NavigationDestination;
}

export async function sendChatMessageDetailed(
  prompt: string, 
  language: string = "en",
  history: { sender: "bot" | "user"; text: string }[] = []
): Promise<ChatBotResponse> {
  try {
    const backendResponse = await apiFetch<ChatBotResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ 
        message: prompt, 
        language,
        history: history.slice(-6)
      }),
    });

    if (backendResponse && backendResponse.reply) {
      return backendResponse;
    }

    return {
      reply: "I'm sorry, I couldn't retrieve scheme information right now. Please try again or explore our Scheme Catalog directly.",
      status: "fallback"
    };
  } catch (err: any) {
    console.error("sendChatMessage error:", err);
    return {
      reply: "The scheme assistance service is currently encountering connection difficulties. Please check your network and try again.",
      status: "error"
    };
  }
}

export async function sendChatMessage(
  prompt: string, 
  language: string = "en",
  history: { sender: "bot" | "user"; text: string }[] = []
): Promise<string> {
  const detailed = await sendChatMessageDetailed(prompt, language, history);
  return detailed.reply;
}
