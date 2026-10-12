import { demoSchemes } from "@/data/demoData";
import { Scheme, EligibilityStatus } from "@/types/scheme";
import { apiFetch } from "@/lib/api";

export async function getSchemes(
  filter?: EligibilityStatus | "all", 
  query?: string
): Promise<Scheme[]> {
  try {
    const backendData = await apiFetch<Scheme[]>("/schemes");
    // If backend returned valid list (even empty), prioritize live database data over demo fallback
    const all = Array.isArray(backendData) ? backendData : demoSchemes;

    let result = [...all];

    if (filter && filter !== "all") {
      result = result.filter((s) => s.eligibilityStatus === filter);
    }

    if (query && query.trim() !== "") {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.shortDescription.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.benefits && s.benefits.toLowerCase().includes(q))
      );
    }

    return result;
  } catch {
    return demoSchemes;
  }
}

export async function getSchemeById(id: string): Promise<Scheme | undefined> {
  try {
    const backendData = await apiFetch<Scheme>(`/schemes/${id}`);
    if (backendData) return backendData;
    return demoSchemes.find((s) => s.id === id || s.slug === id);
  } catch {
    return demoSchemes.find((s) => s.id === id || s.slug === id);
  }
}
