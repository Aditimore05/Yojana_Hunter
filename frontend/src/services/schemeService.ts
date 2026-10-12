import { demoSchemes } from "@/data/demoData";
import { Scheme, EligibilityStatus } from "@/types/scheme";
import { apiFetch } from "@/lib/api";

export async function getSchemes(filter?: EligibilityStatus | "all", query?: string): Promise<Scheme[]> {
  const backendData = await apiFetch<Scheme[]>("/schemes");
  const all = backendData && Array.isArray(backendData) && backendData.length > 0 ? backendData : demoSchemes;

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
        s.category.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function getSchemeById(id: string): Promise<Scheme | undefined> {
  const backendData = await apiFetch<Scheme>(`/schemes/${id}`);
  if (backendData) return backendData;
  return demoSchemes.find((s) => s.id === id);
}
