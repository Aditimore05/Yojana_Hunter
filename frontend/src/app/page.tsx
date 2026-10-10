import React from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <header className="max-w-5xl mx-auto py-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-indigo-700 sm:text-5xl">
          Yojana Hunter 🇮🇳
        </h1>
        <p className="mt-4 text-xl text-slate-600">
          Beyond Searching Schemes, Getting Citizens the Benefits They Deserve
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/interview"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 transition"
          >
            Start AI Interview
          </a>
          <a
            href="/schemes"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-slate-800 border border-slate-300 shadow-sm hover:bg-slate-100 transition"
          >
            Browse Schemes
          </a>
        </div>
      </header>

      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-indigo-600">1. Conversational Interview</h3>
          <p className="mt-2 text-sm text-slate-600">
            Answer simple questions in your mother tongue instead of filling out confusing forms.
          </p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-teal-600">2. Deterministic Eligibility</h3>
          <p className="mt-2 text-sm text-slate-600">
            Backed by a strict rule engine with official citations — the AI never hallucinates benefits.
          </p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-orange-600">3. Guided Application</h3>
          <p className="mt-2 text-sm text-slate-600">
            Automatic OCR document verification, form auto-fill, and affidavit draft preparation.
          </p>
        </div>
      </section>
    </main>
  );
}
