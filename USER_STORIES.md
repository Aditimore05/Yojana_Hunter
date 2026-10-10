# Yojana Hunter — User Stories & Acceptance Criteria

> **Document Type:** Agile User Stories & Acceptance Criteria  
> **Project:** Yojana Hunter — Government Scheme Discovery & Application Platform  
> **Target Personas:** Citizens (Farmers, Students, Women, MSMEs), Assisted Helpers, Data Curators, Verifiers, System Admins

---

## 1. Persona Matrix

| Persona Code | Role Name | Profile & Motivation |
| :---: | :--- | :--- |
| **P-CIT** | Citizen (General) | Seeks welfare schemes they qualify for without having to navigate bureaucratic language. |
| **P-FAR** | Farmer Beneficiary | Requires agricultural subsidies, equipment loans, or PM-KISAN info in local language. |
| **P-STU** | Student Beneficiary | Seeks scholarships, fee reimbursements, and skill training schemes with clear deadlines. |
| **P-ENT** | MSME / Entrepreneur | Small shopkeeper or artisan looking for credit-linked subsidy or mudra loan programs. |
| **P-WOM** | Women Beneficiary | Seeks maternal benefits, self-help group (SHG) incentives, and girl-child support schemes. |
| **P-HLP** | Assisted Helper / CSC | Common Service Centre (CSC) operator or family member applying on behalf of a citizen. |
| **P-CUR** | Scheme Data Curator | Domain specialist verifying newly scraped scheme rules and official links. |
| **P-VRF** | Reviewer / Verifier | Specialist reviewing low-confidence OCR extractions and mismatch flags. |
| **P-ADM** | System Administrator | Manages platform health, ingestion cron jobs, audit trails, and security. |

---

## 2. Stage 1: Discover (Registration, Profile & AI Interview)

### US-DISC-01: Conversational Profile Interview
* **As a:** Citizen (P-CIT / P-FAR)
* **I want to:** Answer friendly, conversational interview questions in my regional language (Hindi, Marathi, English)
* **So that:** The platform automatically builds my eligibility profile without me filling long, intimidating forms.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** Discover
* **Acceptance Criteria:**
  * **Given** a logged-in citizen navigates to the AI Interview page,
  * **When** the Interview Agent asks questions sequentially (age, location, income, occupation, category),
  * **Then** the citizen can respond with natural language text (e.g., "I own 2 acres of farmland in Nashik and earn around 1.2 lakhs per year"),
  * **And** the Interview Agent extracts structured attributes (`occupation: Farmer`, `land_holding: 2.0`, `income: 120000`, `state: Maharashtra`),
  * **And** asks targeted follow-ups only for missing eligibility parameters.

---

### US-DISC-02: Assisted Helper Profile Creation
* **As an:** Assisted Helper (P-HLP)
* **I want to:** Switch beneficiary profiles or interview a family member / villager with their explicit consent
* **So that:** I can help digitally illiterate relatives or rural citizens find benefits they deserve.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** Discover
* **Acceptance Criteria:**
  * **Given** an assisted user is logged in,
  * **When** they initiate a new session for a beneficiary,
  * **Then** the platform prompts for beneficiary relationship and explicit consent confirmation,
  * **And** creates a segregated citizen profile linked to the helper's account.

---

### US-DISC-03: Scheme Catalog Search & Filter
* **As a:** Citizen or Student (P-CIT / P-STU)
* **I want to:** Search schemes using keywords and filter by state, category, and benefit type
* **So that:** I can manually explore specific scholarships or welfare programs of interest.
* **Priority:** `P1 (Should-Have)` | **Stage:** Discover
* **Acceptance Criteria:**
  * **Given** a citizen visits the Scheme Search page,
  * **When** they type "scholarship" and filter by "State: Karnataka",
  * **Then** the results are returned in `< 2 seconds` with badges for ministry, financial benefit amount, and deadline.

---

## 3. Stage 2: Match (Deterministic Eligibility & Explainability)

### US-MTCH-01: Deterministic Eligibility Evaluation
* **As a:** Citizen (P-CIT)
* **I want to:** Get an accurate determination of whether I am eligible for a scheme based on strict government rules
* **So that:** I don't waste time applying to schemes whose criteria I do not meet.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** Match
* **Acceptance Criteria:**
  * **Given** a citizen profile with attributes (`age: 28`, `annual_income: 180000`, `caste: OBC`),
  * **When** the citizen requests eligibility matching,
  * **Then** the **Deterministic Rule Engine** evaluates all rules against the profile parameters,
  * **And** the LLM is **never** permitted to decide eligibility independently,
  * **And** returns a status of `ELIGIBLE`, `INELIGIBLE`, or `NEEDS_MORE_INFO`.

---

### US-MTCH-02: "Why You Qualify" Explainability Card
* **As a:** Farmer or Small Business Owner (P-FAR / P-ENT)
* **I want to:** See a simple breakdown explaining *why* I qualify or *why* I was disqualified
* **So that:** I understand the decision and can see the exact government criteria.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** Match
* **Acceptance Criteria:**
  * **Given** an eligibility result is generated,
  * **When** the citizen views the scheme card,
  * **Then** the card displays a checklist of green ticks (criteria satisfied) and red crosses (criteria unmet),
  * **And** provides an explanation in plain language generated by the LLM citing the official gazette/document.

---

### US-MTCH-03: Official Source of Truth Citation
* **As a:** Citizen (P-CIT)
* **I want to:** See a direct link to the official government notification or portal for every scheme
* **So that:** I can verify that the information is genuine and not an internet rumor.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** Match
* **Acceptance Criteria:**
  * **Given** any recommended scheme card or detail page,
  * **When** the citizen views the scheme information,
  * **Then** an "Official Government Source" link is clearly visible pointing to `.gov.in` / `.nic.in` domains,
  * **And** displays the last verified date of the policy.

---

## 4. Stage 3: Apply (Documents, OCR, Autofill & Affidavits)

### US-APPL-01: Document Requirement Checklist
* **As a:** Citizen (P-CIT / P-WOM)
* **I want to:** View a clear checklist of mandatory vs optional documents required for my chosen scheme
* **So that:** I know exactly which papers to gather before beginning the application.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** Apply
* **Acceptance Criteria:**
  * **Given** an eligible scheme is selected,
  * **When** the citizen opens the Document Checklist,
  * **Then** the system lists all required documents (e.g., Aadhaar card, Income Certificate, Bank Passbook, Ration Card),
  * **And** highlights documents that the citizen has already uploaded vs those that are still missing.

---

### US-APPL-02: OCR & Field Extraction Verification
* **As a:** Citizen (P-CIT)
* **I want to:** Upload photos or PDFs of my documents and have the Document Agent automatically extract my details
* **So that:** I don't have to retype my identity numbers, dates of birth, or addresses.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** Apply
* **Acceptance Criteria:**
  * **Given** a citizen uploads an image of an Income Certificate or Aadhaar Card,
  * **When** the Document Agent runs OCR,
  * **Then** extracted fields (Name, Certificate Number, Issue Date, Income Figure) are shown side-by-side with the uploaded image,
  * **And** any discrepancy with the user profile is flagged for citizen confirmation.

---

### US-APPL-03: Automated Application & Affidavit Draft Generation
* **As a:** Citizen (P-CIT / P-FAR)
* **I want to:** Have my scheme application form and self-declaration affidavit automatically drafted as a downloadable PDF
* **So that:** I have a ready-to-submit application packet for the local government office.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** Apply
* **Acceptance Criteria:**
  * **Given** all required documents are verified and profile fields are matched,
  * **When** the citizen clicks "Generate Application Draft",
  * **Then** the Application Agent fills the official form template and generates a standardized draft PDF,
  * **And** generates a legal self-declaration affidavit draft with accurate citizen details,
  * **And** requires the citizen to review and sign/confirm prior to export.

---

## 5. Stage 4: AI Layer & Governance (Verification & Ingestion)

### US-AIGV-01: Anti-Hallucination Verification Guardrail
* **As a:** Platform Evaluator / Citizen (P-CIT)
* **I want to:** Ensure every AI answer is checked by the Verification Agent before it is shown to me
* **So that:** I never receive fabricated subsidy amounts, fake eligibility criteria, or false deadlines.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** AI Layer
* **Acceptance Criteria:**
  * **Given** the Matching or Application Agent produces a draft response,
  * **When** the Verification Agent analyzes the output against the retrieved `scheme_chunks`,
  * **Then** the response is checked for source chunk overlap, arithmetic accuracy, and missing disclaimers,
  * **And** if hallucination confidence exceeds the safety threshold, the response is rejected and replaced with verified fallback text.

---

### US-AIGV-02: Automated Scheme Change Monitoring & Ingestion
* **As a:** Scheme Data Curator (P-CUR)
* **I want to:** Have the Ingestion Agent alert me when an official scheme portal or PDF updates its rules
* **So that:** Citizens always get decisions based on the most up-to-date welfare rules.
* **Priority:** `P1 (Should-Have)` | **Stage:** AI Layer
* **Acceptance Criteria:**
  * **Given** a scheduled ingestion job scrapes an official portal,
  * **When** hash diffs or text changes are detected in an official PDF,
  * **Then** a `scheme_change_log` entry is created,
  * **And** existing matched citizens are queued for automatic re-evaluation.

---

## 6. Stage 5: Administration & Security

### US-ADMN-01: User Consent & Data Privacy Control
* **As a:** Privacy-conscious Citizen (P-CIT)
* **I want to:** Provide explicit consent before any AI processing occurs, and have the option to revoke consent and delete my data
* **So that:** I retain complete ownership over my sensitive personal and identity records.
* **Priority:** `P0 (MVP Must-Have)` | **Stage:** Security & Admin
* **Acceptance Criteria:**
  * **Given** a new citizen registers,
  * **When** navigating the onboarding flow,
  * **Then** clear, simple consent checkboxes explain how their profile and documents will be processed by AI,
  * **And** at any time in "Settings", the citizen can download their data or click "Delete My Profile & Documents".

---

### US-ADMN-02: Comprehensive Audit Trail
* **As a:** System Administrator (P-ADM)
* **I want to:** Review immutable audit logs of document uploads, profile updates, and AI agent runs
* **So that:** I can monitor platform security, track errors, and ensure compliance with DPDP standards.
* **Priority:** `P1 (Should-Have)` | **Stage:** Administration
* **Acceptance Criteria:**
  * **Given** any sensitive user action occurs (login, doc upload, eligibility run, consent change),
  * **When** the operation finishes,
  * **Then** a structured event is appended to the `audit_logs` table with timestamp, user ID, IP hash, and event type.

---

## 7. User Stories Traceability Matrix

| User Story ID | Title | Persona | Priority | Sprint Mapping |
| :--- | :--- | :---: | :---: | :---: |
| **US-DISC-01** | Conversational Profile Interview | P-CIT, P-FAR | P0 | Sprint 5 |
| **US-DISC-02** | Assisted Helper Profile Creation | P-HLP | P0 | Sprint 1, 5 |
| **US-DISC-03** | Scheme Catalog Search & Filter | P-CIT, P-STU | P1 | Sprint 3 |
| **US-MTCH-01** | Deterministic Eligibility Evaluation | P-CIT | P0 | Sprint 4 |
| **US-MTCH-02** | "Why You Qualify" Explainability Card | P-FAR, P-ENT | P0 | Sprint 4 |
| **US-MTCH-03** | Official Source of Truth Citation | P-CIT | P0 | Sprint 3, 4 |
| **US-APPL-01** | Document Requirement Checklist | P-CIT, P-WOM | P0 | Sprint 6 |
| **US-APPL-02** | OCR & Field Extraction Verification | P-CIT | P0 | Sprint 6 |
| **US-APPL-03** | Application & Affidavit Draft Generation | P-CIT, P-FAR | P0 | Sprint 7 |
| **US-AIGV-01** | Anti-Hallucination Verification Guardrail | Evaluators | P0 | Sprint 7 |
| **US-AIGV-02** | Scheme Change Monitoring & Ingestion | P-CUR | P1 | Sprint 2 |
| **US-ADMN-01** | User Consent & Data Privacy Control | P-CIT | P0 | Sprint 1 |
| **US-ADMN-02** | Comprehensive Audit Trail | P-ADM | P1 | Sprint 1, 8 |
