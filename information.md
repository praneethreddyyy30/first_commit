# JanSetu AI (जनसेतु) — System Architecture & Technical Operation Manual

---

## 1. Executive Summary & Problem Context

**JanSetu AI** is a Pre-Flight Audit Flight Deck and Civic Copilot designed to solve the **"rejection funnel"** in Indian welfare and scholarship delivery.

In India, over **40% of tribal, rural, and underserved students** who apply for government scholarships are rejected due to administrative and clerical failures rather than lack of eligibility:
1. **The Prerequisite Paradox:** Scholarships require Caste and Income certificates; obtaining these certificates requires Revenue Land Records (RoR) and panchanamas. Citizens are never given this dependency tree upfront.
2. **The "NPCI Seeding" Trap:** Banks confirm that an account is *"Aadhaar Linked"* for KYC, but Direct Benefit Transfer (DBT/PFMS) strictly requires **Aadhaar Seeding on the NPCI mapper**. Unseeded accounts silently fail at the treasury stage.
3. **Clerical Name Discrepancies:** Subtle character differences between Aadhaar (e.g., *"Rajesh Kumar Munda"*) and matriculation marksheets (e.g., *"Rajesh K Munda"*) trigger automated portal rejections.
4. **Middlemen & Cyber Cafe Extortion:** Citizens travel 30–50 km to private cyber cafes that charge ₹200–₹500 for government services that are statutorily **₹0 (Free)** or capped at **₹25–₹45**.

JanSetu AI replaces this friction with an automated, deterministic evaluation engine backed by **AWS Cedar**, **Amazon DynamoDB**, and **Amazon Bedrock**.

---

## 2. System Architecture

```
                                  +───────────────────────────────────────+
                                  |            CLIENT BROWSER             |
                                  | Next.js 16 + Tailwind + Web Speech UI |
                                  | (English / Hindi Vernacular Support)  |
                                  +───────────────────┬───────────────────+
                                                      │
                                                      ▼ HTTPS
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                      AWS CLOUD / LOCAL RUNTIME                                          |
|                                                                                                         |
|   +────────────────────────────────────+               +────────────────────────────────────────────+   |
|   |         API GATEWAY / REST         |               |              AWS AMPLIFY                   |   |
|   |   /evaluate  |  /chat  |  /audit   |               | Live Global CDN Hosting & SSR Deployment   |   |
|   |   /schemes   |  /live-evaluate     |               | (amplify.yml)                              |   |
|   +─────────────────┬──────────────────+               +────────────────────────────────────────────+   |
|                     │                                                                                   |
|         +───────────┴───────────+                                                                       |
|         ▼                       ▼                                                                       |
|   +────────────────────+  +────────────────────+  +─────────────────────────────────────────────────+   |
|   | AWS LAMBDA         |  | AWS LAMBDA         |  | AWS CEDAR POLICY ENGINE (Open Source)           |   |
|   | Document Auditor & |  | Bedrock Assistant  |  | Deterministic rule validation                   |   |
|   | NPCI Verifier      |  | & RAG Dispatcher   |  | cedar/policies/scholarships.cedar               |   |
|   | (src/lib/audit)    |  | (src/lib/bedrock)  |  | cedar/policies/certificates.cedar               |   |
|   +────────────────────+  +─────────┬──────────+  | (src/lib/cedar/evaluator.ts)                    |   |
|                                     │             +─────────────────────────────────────────────────+   |
|                                     ▼                                                                   |
|   +────────────────────────────────────────────+  +─────────────────────────────────────────────────+   |
|   | AMAZON BEDROCK (Claude 3.5 Sonnet)         |  | AMAZON DYNAMODB (Single-Table Store)            |   |
|   | • Conversational Multilingual Copilot      |  | Table: JanSetuSchemes                           |   |
|   | • Live Gazette Auto-Discovery Scanner      |  | Scales to zero with zero idle cost              |   |
|   | • Zero-Fail Civic Knowledge Engine         |  | (src/lib/dynamodb/dynamoSchemeStore.ts)         |   |
|   +────────────────────────────────────────────+  +─────────────────────────────────────────────────+   |
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 3. How the Project Works (Component by Component)

### Stage 1: Citizen Demographic Profiling (`src/components/CitizenProfilePage.tsx`)
* **State Management:** Captures a citizen's profile across 5 distinct dimensions:
  1. **Personal Identity:** Social category (ST, SC, OBC, EWS, General), state-specific sub-castes (Tamil Nadu: BC, BCM, MBC, DNC, SCA; Andhra Pradesh: BC-A through BC-E, Kapu), gender, minority status, disability (PwD with percentage).
  2. **Location:** State, District, and Village/Town. Districts and villages are populated dynamically using `src/data/indiaLocations.ts` across all 36 Indian States/UTs.
  3. **Academic Background:** Education stage (Class 9 through PhD), course type (Regular Full-Time vs Distance/Vocational), admission quota (Merit Counseling vs Management), institution type (Government, Premier IIT/NIT/AIIMS, Private), and school history (e.g. continuous Class 6–12 Government schooling).
  4. **Financial Background:** Annual family income, domestic electricity consumption (units/year), land ownership (acres), and flat area (sq ft).
  5. **Held Documents Checklist:** Tracks documents currently in the citizen's physical possession (Aadhaar, Ration Card, Marksheet, Caste/Income Certificate).
* **Automatic Propagation:** Any profile modification persists to browser `localStorage` and triggers background cloud synchronization.

---

### Stage 2: Automated Real-Time Government Ingestion & Deterministic Evaluation (`src/components/EligibilityTab.tsx`)
* **Zero-Search Operation:** The citizen is **never** required to manually search for schemes by name.
* **Debounced Auto-Trigger:** When the citizen modifies their state, category, income, or education stage in Step 1, a 450ms debounced hook in `src/app/page.tsx` automatically calls `POST /api/schemes/live-evaluate`.
* **Live Government Data Pipeline (`src/lib/schemes/govSchemeService.ts`):**
  1. **Official Directory Ingestion:** Connects directly to Digital India / API Setu (`GET https://www.myscheme.gov.in/api/apisetu/schemes`) indexing over **5,083 active central and state schemes**.
  2. **Profile Relevance Scoring:** Evaluates candidate schemes against citizen attributes (state, category, education stage, gender, PwD status).
  3. **Live Criteria & Document Ingestion:** Fetches real-time criteria (`/schemes?slug=...`) and statutory document requirements (`/schemes/{id}/documents?lang=en`) directly from government servers.
  4. **Dynamic Scheme Normalization (`src/lib/schemes/schemeNormalizer.ts`):** Parses raw AST text to extract income ceilings, caste quotas, and document checklists, auto-synthesizing formal Cedar policies.
  5. **Cloud Persistence (`src/lib/dynamodb/dynamoSchemeStore.ts`):** Stores retrieved schemes in Amazon DynamoDB (`JanSetuSchemes` table) to provide sub-100ms response times on subsequent visits.
* **Deterministic Policy Engine (`src/lib/cedar/evaluator.ts`):**
  - Evaluates the profile against formal **AWS Cedar declarative rules** (`cedar/policies/scholarships.cedar` and dynamic policies).
  - Validates statutory income ceilings, community quotas, management quota exclusion rules, and benchmark disability thresholds.
  - Outputs an absolute decision (`ALLOW` vs `DENY`), fit score (0–100%), list of satisfied clauses, explicit failure reasons, and missing prerequisite documents.

---

### Stage 3: Dedicated Scheme Workspace (`src/components/SchemeWorkspace.tsx`)
Selecting any scheme opens a focused workspace with five operational modules:

#### 1. Document Pre-Flight Audit (`src/components/DocumentAuditTab.tsx`)
* **Token-Level Bipartite Name Matcher (`src/lib/audit/documentAuditor.ts`):** Compares the name on the citizen's Aadhaar card against their 10th marksheet. Handles Indian naming conventions (e.g. *"Kavitha S"* vs *"Kavitha Selvam"*, initial expansions, and token permutations) using Levenshtein distance combined with token bipartite matching.
* **NPCI Seeding Scanner:** Tests whether the student's bank account is merely *Aadhaar Linked* or properly **NPCI Seeded for DBT**. If unseeded, it flags a CRITICAL status.
* **1-Click Mandate Generator:** Compiles an official, printable **Annexure-I Bank Mandate Form** for the student to submit to their branch manager to resolve the NPCI gap before applying.

#### 2. Visual Prerequisite Roadmap (`src/components/PrerequisiteRoadmapTab.tsx`)
* **3-Tier Dependency Tree (`src/data/schemeRoadmaps.ts`):**
  - **Tier 1 (Base Identity):** Aadhaar Card, Ration Card / Family Card.
  - **Tier 2 (Statutory Certificates):** Income Certificate, Community Certificate, Domicile/Nativity.
  - **Tier 3 (Institutional Verification):** College Bonafide, Fee Receipt, Marksheet, Hosteller Certificate.
* **5-Stage Verification Lifecycle:** Maps the progression from Citizen submission $\rightarrow$ College Nodal Officer (INO) $\rightarrow$ District Welfare Officer (DWO) $\rightarrow$ State Nodal Officer (SNO) $\rightarrow$ PFMS DBT treasury disbursement, highlighting statutory turnaround SLAs and common rejection traps.

#### 3. Offline Navigator & Anti-Extortion Fee Guard (`src/components/OfflineNavigatorTab.tsx`)
* **Verified Seva Center Directory (`src/data/cscDirectory.ts`):** Geo-references verified Common Service Centers (CSCs), MeeSeva / e-Sevai centers, and Tahsildar / Mandal Revenue Offices with physical addresses, officer incharge names, phone numbers, and direct Google Maps navigation links.
* **Hyper-Local Village Matching:** Uses `src/data/indiaLocations.ts` and `getNearbySevaCentersForVillage` to prioritize centers within 0.3 km – 18.5 km of the citizen's selected village or town.
* **Statutory Fee Schedule:** Cites statutory maximums under the Right to Public Services Act (RTSA) — alerting citizens that scholarship applications are legally **₹0 (Free)** and certificate issuance is capped at **₹25–₹45**, preventing cyber cafe extortion (₹200–₹500).

#### 4. Multilingual AI Copilot (`src/components/AiCopilotTab.tsx`)
* **Amazon Bedrock Claude 3.5 Sonnet Integration (`src/lib/bedrock/bedrockClient.ts`):** Injects full citizen context into the model's system prompt (active profile, selected scheme title, Cedar evaluation clauses, and document audit scores).
* **Zero-Fail Civic Knowledge Fallback:** If AWS credentials are not configured or cloud quotas are exceeded, the copilot falls back to an internal deterministic civic knowledge engine.
* **Speech-to-Text & Text-to-Speech:** Uses Web Speech API (`webkitSpeechRecognition` and `speechSynthesis`) for real-time voice input and read-aloud support in English and Hindi.

#### 5. Application Dossier (`src/components/ApplicationDossierTab.tsx`)
* Compiles a single-page, verified, printable summary card containing student demographic metadata, verified document checklist, official portal links, and QR codes for submission at CSC counters or college nodal desks.

---

## 4. Backend API Endpoints

| Endpoint | Method | Purpose | Source File |
|---|---|---|---|
| `/api/schemes/live-evaluate` | `POST` | Fetches schemes from DynamoDB/Cloud for the citizen's state, runs automated gazette discovery, and evaluates Cedar policies. | [`src/app/api/schemes/live-evaluate/route.ts`](file:///c:/Users/DELL/OneDrive/Desktop/first_commit/src/app/api/schemes/live-evaluate/route.ts) |
| `/api/schemes` | `GET` / `POST` | Retrieves active schemes from DynamoDB; accepts dynamic webhook ingestion from API Setu or administrative crawlers. | [`src/app/api/schemes/route.ts`](file:///c:/Users/DELL/OneDrive/Desktop/first_commit/src/app/api/schemes/route.ts) |
| `/api/schemes/sync` | `POST` | Manually triggers live synchronization with external public data gateways. | [`src/app/api/schemes/sync/route.ts`](file:///c:/Users/DELL/OneDrive/Desktop/first_commit/src/app/api/schemes/sync/route.ts) |
| `/api/evaluate` | `POST` | Direct evaluation endpoint executing AWS Cedar policies against a submitted profile. | [`src/app/api/evaluate/route.ts`](file:///c:/Users/DELL/OneDrive/Desktop/first_commit/src/app/api/evaluate/route.ts) |
| `/api/audit` | `POST` | Runs token-level name matching and NPCI checks, returning discrepancy diagnostics and Annexure-I templates. | [`src/app/api/audit/route.ts`](file:///c:/Users/DELL/OneDrive/Desktop/first_commit/src/app/api/audit/route.ts) |
| `/api/chat` | `POST` | Multilingual conversational dispatcher routing to Amazon Bedrock Runtime with context injection. | [`src/app/api/chat/route.ts`](file:///c:/Users/DELL/OneDrive/Desktop/first_commit/src/app/api/chat/route.ts) |

---

## 5. Cloud Infrastructure & Deployment

* **AWS SAM (`template.yaml`):** Declares a serverless architecture compatible with AWS SAM CLI and LocalStack:
  - `JanSetuApi`: REST API Gateway with CORS support.
  - `CedarPolicyEngineFunction`, `BedrockAssistantFunction`, `DocumentAuditFunction`: Node.js 20 Lambda functions.
  - `SchemesTable` (`JanSetuSchemes`): Amazon DynamoDB table with `PAY_PER_REQUEST` billing mode (scales to zero idle cost).
  - `DossiersTable` (`JanSetuDossiers`): DynamoDB table storing completed application dossiers.
  - `JanSetuFormsBucket`: Amazon S3 bucket storing official mandate templates and generated PDFs.
* **AWS Amplify (`amplify.yml`):** Configured for Next.js 16 SSR deployment, running `npm ci` and `npm run build` with caching of `.next/cache`.

---

## 6. Current Flaws & Limitations

To be completely objective and transparent about how the system operates right now:

1. **Live Government Scheme API Throughput & Caching:**
   - *Current Operation:* Live scheme data is fetched directly from Digital India (`myscheme.gov.in/api/apisetu`). The initial fetch for un-cached schemes takes 1–2 seconds over the network.
   - *Optimization:* Amazon DynamoDB and an in-memory TTL cache provide sub-100ms response times for all subsequent evaluations of the same scheme.
2. **Document OCR is Simulated from User Input:**
   - *Limitation:* While the bipartite name matching and NPCI algorithms in `documentAuditor.ts` are real and fully functional, the document names and dates are entered via form fields or loaded from demo personas.
   - *Current State:* The system does not yet run real-time computer vision (e.g. AWS Textract) on uploaded image/PDF files to extract text directly from physical documents.
3. **Session State vs Central Authentication:**
   - *Limitation:* Citizen profiles are saved in browser `localStorage`.
   - *Current State:* There is no user authentication (e.g. Amazon Cognito or Aadhaar OTP e-KYC). Clearing browser data resets the profile to default.
4. **Local Fallback vs Cloud DynamoDB Connection:**
   - *Limitation:* In local development without active AWS credentials (`AWS_ACCESS_KEY_ID`), DynamoDB operations fall back to an in-memory/local cache. Newly discovered schemes are kept in memory until the server restarts unless connected to live AWS DynamoDB or LocalStack.

---

## 7. Improvements for Real-World Production

To scale this application from a hackathon project to a national civic platform:

1. **AWS Textract Pipeline for Document Uploads:**
   - Replace manual document input with an Amazon S3 + AWS Textract pipeline.
   - Citizens upload a photo of their Aadhaar and 10th marksheet; Textract extracts names and dates directly, running the bipartite matcher automatically.
2. **Automated Scheduled Gazette Crawlers (AWS EventBridge + Lambda):**
   - Deploy an automated crawler running nightly via AWS EventBridge.
   - The crawler monitors `egazette.gov.in` and state education department circulars, uses Bedrock to extract statutory income/caste thresholds, generates Cedar policy code, and updates the `JanSetuSchemes` DynamoDB table without human intervention.
3. **Citizen Authentication via DigiLocker API & Amazon Cognito:**
   - Integrate with the official DigiLocker API (under Digital India) using OAuth 2.0.
   - This would allow citizens to pull their digitally signed Aadhaar, Caste Certificate, and Marksheets directly from the government repository with zero manual uploads.
4. **Direct NPCI Public Verification Integration:**
   - Integrate with PFMS / NPCI public status inquiry endpoints to check bank account seeding status via bank IIN and masked Aadhaar numbers rather than self-reported citizen toggles.
5. **WhatsApp / SMS Gateway Integration (AWS SNS / Pinpoint):**
   - In rural India, WhatsApp is the dominant digital medium. Connect AWS Pinpoint to allow citizens to receive their 1-page application dossier and Seva center directions directly on WhatsApp in their local language.
