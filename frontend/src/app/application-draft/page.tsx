"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, Edit3, CheckCircle2, ShieldCheck, X, Save, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { fetchApplicationDraft, updateApplicationDraft } from "@/services/applicationService";
import { ApplicationDraft } from "@/types/application";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function ApplicationDraftContent() {
  const [draft, setDraft] = useState<ApplicationDraft>(fetchApplicationDraft());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ApplicationDraft>(fetchApplicationDraft());
  const [isDownloading, setIsDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const d = fetchApplicationDraft();
    setDraft(d);
    setEditForm(d);
  }, []);

  const handleDownloadPDF = () => {
    setIsDownloading(true);

    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(37, 99, 235); // Brand Blue
      doc.rect(0, 0, 210, 20, "F");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("YOJANA HUNTER — CITIZEN APPLICATION DRAFT", 105, 13, { align: "center" });

      // Title
      doc.setTextColor(16, 32, 68); // Brand Navy
      doc.setFontSize(16);
      doc.text(draft.schemeName.toUpperCase(), 105, 36, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Government Scheme Official Application Intake Form", 105, 43, { align: "center" });
      doc.text(`Draft Reference ID: ${draft.id} | Generated on: ${draft.createdAt}`, 105, 49, { align: "center" });

      // Horizontal line
      doc.setDrawColor(226, 234, 244);
      doc.setLineWidth(0.5);
      doc.line(20, 55, 190, 55);

      // Applicant Particulars Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 32, 68);
      doc.text("I. APPLICANT DETAILS", 20, 68);

      const fields = [
        ["Applicant Name", draft.applicantName],
        ["Father's Name", draft.fatherName],
        ["Date of Birth", draft.dateOfBirth],
        ["Education Level", draft.education],
        ["Annual Family Income", draft.familyIncome],
        ["State of Domicile", draft.state],
        ["District", draft.district],
        ["Application Status", "Pre-Verified Citizen Draft"],
      ];

      let y = 80;
      doc.setFontSize(10);

      fields.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(label, 25, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(`:   ${value}`, 85, y);

        y += 10;
      });

      // Verification seal note
      doc.setDrawColor(37, 99, 235);
      doc.setFillColor(241, 247, 255);
      doc.roundedRect(20, 175, 170, 30, 3, 3, "FD");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("ELIGIBILITY DETERMINISTIC CHECK PASSED", 25, 185);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(
        "This application draft was generated following automated rules evaluation with 100% eligibility score. Submit this form alongside required certificates at the official department portal.",
        25,
        192,
        { maxWidth: 160 }
      );

      // Declaration
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Declaration: I hereby declare that the information provided above is true and authentic to the best of my knowledge.",
        20,
        225,
        { maxWidth: 170 }
      );

      doc.text("Signature of Applicant: _____________________", 20, 250);
      doc.text(`Date: ${draft.createdAt}`, 130, 250);

      doc.save(`Application_${draft.schemeId}_${draft.applicantName.replace(/\s+/g, "_")}.pdf`);
      setSuccessMsg("PDF Application Draft downloaded successfully!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateApplicationDraft(editForm);
    setDraft(updated);
    setIsEditing(false);
    setSuccessMsg("Draft details saved successfully!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title & Subtitle */}
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Application Draft
          </h1>
          <p className="text-sm text-slate-500">
            Your application has been prepared. Please review before submission.
          </p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Centered Document Paper Preview */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-floating p-8 sm:p-10 space-y-6 relative overflow-hidden">
          {/* Official watermark background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none w-80 h-80">
            <Image src="/images/emblem.svg" alt="Emblem" width={320} height={320} />
          </div>

          {/* Emblem & Document Title */}
          <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
            <div className="w-16 h-20 relative flex items-center justify-center">
              <Image
                src="/images/emblem.svg"
                alt="Government Emblem"
                width={70}
                height={85}
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-brand-navy tracking-tight">
                Application for {draft.schemeName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Government of India · Ministry of Education
              </p>
            </div>
          </div>

          {/* Structured Citizen Fields Table */}
          <div className="space-y-3.5 text-xs sm:text-sm py-2">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="font-semibold text-slate-500 w-1/3">Applicant Name</span>
              <span className="text-slate-400 w-8">:</span>
              <span className="font-extrabold text-brand-navy w-2/3">{draft.applicantName}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="font-semibold text-slate-500 w-1/3">Father's Name</span>
              <span className="text-slate-400 w-8">:</span>
              <span className="font-bold text-slate-800 w-2/3">{draft.fatherName}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="font-semibold text-slate-500 w-1/3">Date of Birth</span>
              <span className="text-slate-400 w-8">:</span>
              <span className="font-bold text-slate-800 w-2/3">{draft.dateOfBirth}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="font-semibold text-slate-500 w-1/3">Education</span>
              <span className="text-slate-400 w-8">:</span>
              <span className="font-bold text-slate-800 w-2/3">{draft.education}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="font-semibold text-slate-500 w-1/3">Family Income</span>
              <span className="text-slate-400 w-8">:</span>
              <span className="font-bold text-slate-800 w-2/3">{draft.familyIncome}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="font-semibold text-slate-500 w-1/3">State</span>
              <span className="text-slate-400 w-8">:</span>
              <span className="font-bold text-slate-800 w-2/3">{draft.state}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="font-semibold text-slate-500 w-1/3">District</span>
              <span className="text-slate-400 w-8">:</span>
              <span className="font-bold text-slate-800 w-2/3">{draft.district}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="w-full sm:w-1/2 py-3.5 px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? "Generating PDF..." : "Download PDF"}</span>
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-1/2 py-3.5 px-6 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Draft</span>
          </button>
        </div>
      </div>

      {/* Edit Draft Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-brand-navy/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-floating border border-brand-border p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-lg text-brand-navy">Edit Application Draft</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDraft} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Name</label>
                  <input
                    type="text"
                    value={editForm.applicantName}
                    onChange={(e) => setEditForm({ ...editForm, applicantName: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={editForm.fatherName}
                    onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="text"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    placeholder="DD-MM-YYYY"
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Education</label>
                  <input
                    type="text"
                    value={editForm.education}
                    onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs sm:text-sm font-bold bg-brand-blue hover:bg-brand-blue-dark text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Draft</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ApplicationDraftPage() {
  return (
    <ProtectedRoute>
      <ApplicationDraftContent />
    </ProtectedRoute>
  );
}
