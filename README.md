# Yojana Hunter 🇮🇳

> **Beyond Searching Schemes, Getting Citizens the Benefits They Deserve**  
> An AI-powered platform for government scheme discovery, eligibility matching, document verification, and application assistance.

---

## 📌 Overview

**Yojana Hunter** is an integrated, intelligent platform designed to help Indian citizens (farmers, students, women, small business owners, MSMEs, and underprivileged groups) discover the government schemes they genuinely qualify for. 

Instead of passive scheme directories or hallucination-prone chatbots, Yojana Hunter:
1. **Interviews the Citizen** in simple, regional languages to capture verified profile details.
2. **Evaluates Deterministic Eligibility** using a hybrid **RAG + Rule Engine** where the LLM *explains* eligibility but *never decides it alone*.
3. **Verifies Documents** using OCR and intelligent field extraction before application submission.
4. **Automates Applications & Affidavits** with human-in-the-loop review and citation of official government sources.

---

## 📑 Full Project Requirements Document (PRD)

The complete specification, functional modules, architecture diagrams, database schemas, and sprint roadmap are documented in:
👉 **[PROJECT_REQUIREMENTS_DOCUMENT.md](./PROJECT_REQUIREMENTS_DOCUMENT.md)**

---

## 🧱 Technology Stack

* **Frontend:** React / Next.js, Tailwind CSS, multilingual i18n support
* **Backend:** Python 3.10+, FastAPI (Modular routers, API gateway, Pydantic)
* **Database & Vector Store:** PostgreSQL 15+ with `pgvector`, SQLAlchemy ORM, Alembic migrations
* **AI & RAG:** OpenAI / Anthropic APIs, Sentence Transformers embeddings, Multi-Agent Orchestration
* **Document AI & OCR:** Tesseract OCR / Cloud Document AI, Pillow, pdf2image, PyMuPDF
* **PDF & Form Automation:** ReportLab / WeasyPrint
* **DevOps & Infrastructure:** Docker, Docker Compose, GitHub Actions, Cloud deployment (Render / Railway / AWS)

---

## 🤖 Multi-Agent Architecture

Yojana Hunter coordinates six specialized AI agents sharing a unified knowledge base:

1. **Scheme Ingestion Agent:** Scrapes official government PDFs/websites, extracts text, detects rule changes, and updates vector embeddings.
2. **Interview Agent:** Engages citizens in conversational interviews to identify missing information and build comprehensive profiles.
3. **Matching Agent:** Retrieves matching schemes using semantic search (pgvector) and structured rule matching.
4. **Document Agent:** Runs OCR on uploaded documents, extracts key fields, and validates against requirements.
5. **Application Agent:** Maps profile and document data to scheme forms, drafting applications and affidavits.
6. **Verification Agent:** Validates official sources, checks reasoning, flags missing info, and eliminates hallucinations.

---

## 🗂️ Suggested Project Structure

```
yojana-hunter/
├── docker-compose.yml
├── README.md
├── PROJECT_REQUIREMENTS_DOCUMENT.md
├── requirements.txt
├── .env                       # Environment secrets (ignored by Git)
├── backend/
│   ├── main.py                # FastAPI app & router registration
│   ├── config.py              # Configurations & settings
│   ├── database.py            # PostgreSQL & pgvector setup
│   ├── models/                # SQLAlchemy models (~22 entities)
│   ├── api/                   # API routers (auth, profile, schemes, etc.)
│   ├── agents/                # 6 Specialized AI agents
│   ├── services/              # RAG, rule engine, OCR, autofill services
│   └── utils/                 # Security, validators, upload handlers
├── frontend/                  # Next.js app (pages, components, i18n)
├── tests/                     # Unit and integration tests (pytest)
└── docs/                      # PRD, SRS, architecture and ER diagrams
```

---

## 🚀 Hackathon MVP Scope

* **20–50 verified schemes** ingested with full rule coverage.
* Citizen interactive interview & profile builder.
* Deterministic eligibility matching with explainability cards & source citations.
* Document checklist, OCR field extraction, and auto-drafting of applications and affidavits.
* Human-in-the-loop review and consent management.

---

## 🛡️ License & Ethics

All citizen data and personally identifiable information (PII) are encrypted at rest and in transit. AI processing operates strictly on an opt-in, consent-driven basis with full user confirmation required before any application generation or submission.
