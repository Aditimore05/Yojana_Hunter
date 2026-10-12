const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000/api";

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T | null> {
  const { timeoutMs = 5000, ...customConfig } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...customConfig.headers,
    },
    signal: controller.signal,
    ...customConfig,
  };

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  try {
    const response = await fetch(url, config);
    clearTimeout(id);

    if (!response.ok) {
      console.warn(`API request ${endpoint} failed with status ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(id);
    // Silent fallback to demo/local data when backend is not running
    return null;
  }
}
