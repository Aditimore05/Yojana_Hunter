"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  UploadCloud, 
  Trash2, 
  Plus, 
  Check, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { fetchDocuments, uploadCitizenDocument, calculateReadiness } from "@/services/documentService";
import { CitizenDocument, DocumentReadinessStats } from "@/types/document";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function DocumentReadinessContent() {
  const [documents, setDocuments] = useState<CitizenDocument[]>([]);
  const [stats, setStats] = useState<DocumentReadinessStats>({
    readyPercent: 78,
    uploadedCount: 7,
    missingCount: 2,
    totalCount: 9,
  });
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const docs = fetchDocuments();
    setDocuments(docs);
    setStats(calculateReadiness(docs));
  }, []);

  const handleTriggerUpload = (docId: string) => {
    setUploadingDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDocId) {
      const updated = uploadCitizenDocument(uploadingDocId, file);
      setDocuments(updated);
      setStats(calculateReadiness(updated));
      setUploadSuccess(`Successfully uploaded ${file.name}!`);
      setTimeout(() => setUploadSuccess(null), 3000);
    }
    setUploadingDocId(null);
    if (e.target) e.target.value = "";
  };

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      {/* Hidden file input for real uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Document Readiness
          </h1>
          <p className="text-sm text-slate-500">
            Your uploaded documents and missing items
          </p>
        </div>

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Circular Progress & Legend Card */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card flex flex-col sm:flex-row items-center justify-around gap-6">
          {/* Circular Donut Gauge */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="#E2EAF4"
                strokeWidth="11"
                fill="none"
              />
              {/* Progress stroke */}
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="#2DC6B1"
                strokeWidth="11"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - stats.readyPercent / 100)}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-brand-navy">
                {stats.readyPercent}%
              </span>
              <span className="text-xs font-bold text-slate-500">
                Ready
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-3 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-6 text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
                <span>Uploaded</span>
              </div>
              <span className="font-extrabold text-brand-navy">{stats.uploadedCount}</span>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-6 text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500"></span>
                <span>Missing</span>
              </div>
              <span className="font-extrabold text-brand-navy">{stats.missingCount}</span>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-6 text-sm font-semibold text-slate-700 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300"></span>
                <span>Total</span>
              </div>
              <span className="font-extrabold text-brand-navy">{stats.totalCount}</span>
            </div>
          </div>
        </div>

        {/* Document Checklist Table */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
          <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
            Document Checklist
          </h2>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="bg-slate-50 px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Document</span>
              <span>Status</span>
            </div>

            {/* Rows */}
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="px-4 py-3.5 flex items-center justify-between gap-4 text-xs sm:text-sm bg-white hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-brand-navy block">
                      {doc.name}
                    </span>
                    {doc.fileName && (
                      <span className="text-[11px] text-slate-400">
                        {doc.fileName} ({doc.fileSize})
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {doc.status === "uploaded" ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>Uploaded</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTriggerUpload(doc.id)}
                      className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full border border-rose-200 transition"
                      title="Click to upload this document"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Missing</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload More Documents Button */}
        <div>
          <button
            onClick={() => {
              const firstMissing = documents.find((d) => d.status === "missing");
              handleTriggerUpload(firstMissing ? firstMissing.id : "doc-2");
            }}
            className="w-full py-4 px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-base shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 transition"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Upload More Documents</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function DocumentReadinessPage() {
  return (
    <ProtectedRoute>
      <DocumentReadinessContent />
    </ProtectedRoute>
  );
}
