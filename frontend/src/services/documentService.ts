import { CitizenDocument, DocumentReadinessStats } from "@/types/document";
import { getStoredDocuments, saveStoredDocuments } from "@/lib/storage";
import { apiFetch } from "@/lib/api";

export function fetchDocuments(): CitizenDocument[] {
  const local = getStoredDocuments();

  // Background sync with database
  apiFetch<{ documents: CitizenDocument[]; stats: DocumentReadinessStats }>("/documents")
    .then((data) => {
      if (data && Array.isArray(data.documents) && data.documents.length > 0) {
        saveStoredDocuments(data.documents);
      }
    })
    .catch(() => {});

  return local;
}

export async function fetchDocumentsAsync(): Promise<{ documents: CitizenDocument[]; stats: DocumentReadinessStats }> {
  const data = await apiFetch<{ documents: CitizenDocument[]; stats: DocumentReadinessStats }>("/documents");
  if (data && Array.isArray(data.documents) && data.documents.length > 0) {
    saveStoredDocuments(data.documents);
    return data;
  }
  const local = getStoredDocuments();
  return {
    documents: local,
    stats: calculateReadiness(local),
  };
}

export function uploadCitizenDocument(docId: string, file: File): CitizenDocument[] {
  const current = getStoredDocuments();
  const updated = current.map((doc) => {
    if (doc.id === docId) {
      return {
        ...doc,
        status: "uploaded" as const,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: "Just now",
      };
    }
    return doc;
  });

  saveStoredDocuments(updated);

  // Send upload to backend
  try {
    const formData = new FormData();
    formData.append("docId", docId);
    formData.append("file", file);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000/api";
    fetch(`${baseUrl}/documents/upload`, {
      method: "POST",
      body: formData,
    }).catch(() => {});
  } catch (err) {
    console.error("Document upload failed to reach backend", err);
  }

  return updated;
}

export function calculateReadiness(docs: CitizenDocument[]): DocumentReadinessStats {
  const totalCount = docs.length;
  const uploadedCount = docs.filter((d) => d.status === "uploaded").length;
  const missingCount = totalCount - uploadedCount;
  const readyPercent = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;

  return {
    readyPercent,
    uploadedCount,
    missingCount,
    totalCount,
  };
}
