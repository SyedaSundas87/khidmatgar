# GharFix — AI-Powered Local Services Platform

> **Hackathon Submission:** Google Antigravity Challenge 2 — AI Service Orchestrator for Informal Economy
> **Tagline:** *"Ghar ka kaam, AI ke saath"* · *"Aapki Zaroorat, Hamare Maahir"* (Your Need, Our Experts)

---

## 📋 Table of Contents

1.  [Overview & Solution](#1-overview--solution)
2.  [Problem Statement](#2-problem-statement)
3.  [System Architecture](#3-system-architecture)
4.  [Antigravity Workflow System (The Main Orchestrator)](#4-antigravity-workflow-system-the-main-orchestrator)
5.  [Core AI Agents Developed (Antigravity Tools)](#5-core-ai-agents-developed-antigravity-tools)
6.  [Antigravity Reasoning Traces](#6-antigravity-reasoning-traces)
7.  [Autonomous Workflows (n8n Tools)](#7-autonomous-workflows-n8n-tools)
8.  [Provider Matching Factors](#8-provider-matching-factors)
9.  [Tech Stack & APIs Used](#9-tech-stack--apis-used)
10. [Cost & Latency Analysis](#10-cost--latency-analysis)
11. [How to Setup & Run](#11-how-to-setup--run)
12. [Baseline Comparison](#12-baseline-comparison)
13. [Guardrails, Limitations & Future Scope](#13-guardrails-limitations--future-scope)

---

## 1. Overview & Solution

**GharFix** is an innovative AI-powered, hybrid mobile and web platform designed to revolutionize the informal service economy in Pakistan. It enables users to effortlessly book trusted local service professionals (electricians, plumbers, mechanics) through natural language conversations in **English, Urdu, and Roman Urdu**.

By pairing a sleek, native-feeling mobile application with a cutting-edge agentic backend orchestration layer, GharFix addresses critical challenges in service discovery — eliminating miscommunication, stabilizing unpredictable pricing, and automating post-booking support. The platform leverages advanced Conversational AI and natural language processing to allow users to simply speak or type their problem in their native language. AI agents automatically extract intent, determine the specific service, identify location, and match the customer with the most relevant, highly-rated professionals in real-time. This eliminates friction, ensures precise job matching, and empowers local service providers with a streamlined dashboard to manage their business.

---

## 2. Problem Statement

The informal service economy in Pakistan suffers from highly inefficient service discovery. Consumers face frustrating, manual searches via WhatsApp or phone calls, unreliable providers, and severe language barriers when describing technical problems. Concurrently, blue-collar service providers waste time deciphering unclear requests and managing scattered schedules. Existing platforms rely on static listings, lack intelligent localization, and offer zero automated post-service or dispute support. GharFix solves these problems with AI-driven workflows and autonomous orchestration to enhance trust, automation, and service quality.

---

## 3. System Architecture

GharFix bridges the gap between non-technical users and blue-collar professionals through a decoupled, highly responsive architecture:

```
[ User Interface: React 19 / Vite / Tailwind ]
          │
          ▼ (Bridged via CapacitorJS)
[ Native Mobile Shell: iOS / Android / Web App ]
          │
          ▼ (Secure API Requests)
[ Local Proxy Server: Express.js / Node.js ]
          │
          ▼
[ GharFix AI Core (Agent Orchestrator) ]
          │
          ▼
[ n8n Autonomous Workflow Engine (Specialized Tools) ]
          ├── WF1/2/3  Intent, Provider Matching & Pricing Agent
          ├── WF4      Booking Agent (Race-Condition Protected)
          ├── WF5      Service Quality Loop (En Route ➔ Feedback)
          ├── WF6      Dispute & Escalation Handler
          ├── WF7      Cancellation & Auto-Reschedule Engine
          └── WF8      Provider Optimization Agent
          │
          ▼
[ Cloud Infrastructure & External Services ]
          ├── Google Maps/Places API (Geocoding & Discovery)
          ├── Supabase Database      (PostgreSQL Capacity & Waitlists)
          ├── OpenAI GPT-4o-mini     (Intent extraction LLM)
          └── Gmail API              (Transactional notifications)
```

---

## 4. Antigravity Workflow System (The Main Orchestrator)

GharFix uses **Google Antigravity as the core orchestrator** for its agentic workflows. It acts as the central intelligence system that assesses user context, manages conversational state across multi-language switches, and delegates downstream tasks to specialized n8n operational pipelines.

*   **State Coordination:** Directs n8n workflows in absolute sequence (`extract_intent` ➔ `find_providers` ➔ `confirm_booking`).
*   **Trace Reading:** Interprets structured JSON data and reasoning telemetry returned by tools to intelligently decide fallback paths.
*   **Dynamic Fallbacks:** If a chosen slot is pulled mid-transaction, Antigravity instantly evaluates alternatives, updates the user dashboard, or transparently shifts the user to an automated waitlist.
*   **Conversational AI Orchestration:** Manages the flow of natural language interactions with users — switching reply language dynamically based on `detectedLanguage` returned by the intent tool.
*   **Frontend Interaction:** Facilitates seamless communication between the React/Capacitor UI and backend n8n logic.
*   **Agent Coordination:** Directs all n8n workflows to perform their specialized functions in the correct order (extract_intent → find_providers → confirm_booking → track_service → handle_dispute).
*   **Workflow Triggering:** Intelligently selects and invokes the relevant n8n workflow based on current context — never calls `confirm_booking` speculatively, never calls `find_providers` before `isComplete: true`.
*   **Reasoning and Assessment:** Interprets structured JSON returned by n8n tools — reads `antigravity_trace.reasoning` fields — to guide subsequent actions and maintain coherent service delivery.
*   **Fallback Control:** When a tool returns an error, slot_taken response, or no_alternative_available, Antigravity decides the recovery path (retry, offer alternate dates, escalate, or enroll in waitlist).

### Matching Pipeline Orchestrated by Antigravity

```
User Query (any language)
    ↓
Antigravity → calls extract_intent (WF1)
    ↓  [isComplete: true]
Antigravity → calls find_providers (WF2 + WF3)
    │   Geocode location → Places search → Distance Matrix
    │   → Capacity check (Supabase) → 7-factor score → Price calculation
    ↓
Antigravity presents top match, stores alternatives[]
    ↓  [user confirms provider + slot]
Antigravity → calls confirm_booking (WF4)
    │   Race-condition check → Insert to Supabase → Send email
    ↓
Antigravity → calls track_service stages: en_route → arrived → completed → feedback (WF5)
    │   [if rating ≤ 2 → auto-escalates to WF6]
    ↓
Antigravity → calls handle_dispute if needed (WF6)
    ↓
Antigravity → calls cancel_or_reschedule if needed (WF7)
    │   Penalty engine → Alternative picker → Slot selector → Re-confirm via WF4
    │   [if no slot → waitlist] [if no alternative → waitlist + full refund]
    ↓
Antigravity → calls get_provider_dashboard for provider-side view (WF8)
```

---

## 5. Core AI Agents Developed (Antigravity Tools)

Every workflow in GharFix is exposed to the central Google Antigravity orchestrator as a specialized, callable agent tool. This allows the system to autonomously manage the entire lifecycle of a service request:

### 1. Multilingual Intent & Triage Agent (WF1)
*   **Description:** Acts as the first point of contact. It accepts raw, unstructured text or voice transcripts from the user. It uses LLMs to parse out the core requirements: `serviceType` (e.g., AC Repair), `city` (e.g., Lahore), and `area` (e.g., DHA).
*   **Capability:** Seamlessly handles code-switching (e.g., Roman Urdu mixed with English) and asks clarifying questions if required parameters are missing. Runs NLP classification across 47 service types in 71 cities. Features an automatic 10% bundle discount for multi-service requests.

### 2. Smart Matchmaker & Pricing Agent (WF2 & WF3)
*   **Description:** Takes the structured intent data and cross-references it with the provider database. Geocodes user locations, queries local Google Places, and overlays real-time slot availability from Supabase.
*   **Capability:** Filters providers based on proximity, availability, and historical service ratings, returning the top matches directly to the user interface. It scores providers using our 7-factor matrix and generates an immutable price breakdown to prevent on-site price haggling.

### 3. Race-Condition Guarded Booking Agent (WF4)
*   **Description:** Manages slot availability and confirms bookings. It has two steps: Step A checks existing bookings with travel-time buffer logic to build an accurate available slot list; Step B performs a race-condition check at the exact moment of confirmation to prevent double-booking.
*   **Capability:** Orchestrates the actual transactional assignment. It cross-references transit buffers, executes an atomic lock-check at the exact millisecond of confirmation to prevent double-booking, and handles transactional notifications via Gmail. Computes variable service durations coupled with a static 30-minute transit buffer. Leverages atomic database checks to guarantee absolute prevention of race-condition double bookings.

### 4. Service Quality Loop Agent (WF5)
*   **Description:** Manages the complete post-booking service lifecycle through four sequential stages.
*   **Capability:** Tracks real-time mobile operational milestones (`en_route` ➔ `arrived` ➔ `in_progress` ➔ `completed`). Post-service, it parses written reviews, ratings, and image evidence, running sentiment analysis to adjust provider health scores. Pushes status updates through four concrete mobile states: en_route ➔ arrived ➔ in_progress ➔ completed. Automatically runs sentiment analysis on customer feedback and attachments.

### 5. Automated Dispute & Escalation Agent (WF6)
*   **Description:** When issues arise, Antigravity delegates dispute handling to this tool. It routes by `dispute_type` and applies tiered resolution logic.
*   **Capability:** Programmatically handles service failures. It interprets low ratings or price overruns, instantly issuing tiered refunds (25% to 100%) and system strikes without requiring manual human customer support intervention. Executes automated mitigation strategies:
    *   **No Show:** 100% automated refund + system strike issued to provider.
    *   **Quality Deficit (Rating ≤ 2):** Auto-calculates a tiered 25%-50% monetary refund.

### 6. Cancellation & Auto-Reschedule Agent (WF7)
*   **Description:** Handles three cancellation modes: user cancel only, user reschedule, and provider cancel. For reschedules, it runs a full pipeline: penalty engine → alternative picker (sorted by `computed_score`) → calls WF4 Step A to get slots for new provider → calls WF4 Step B to confirm → updates original booking in Supabase → sends email.
*   **Capability:** Evaluates late-cancellation penalties based on time-to-appointment windows. If a provider drops out, it loops back to find alternatives, handles auto-rebooking, or smoothly moves the user to the backup waitlist. Calculates late cancellation penalties, reroutes alternative providers, or handles seamless enrollment into the Supabase automated waitlist if local capacity is completely capped.

### 7. Provider Optimization Agent (WF8)
*   **Description:** Gives providers a complete performance dashboard. Antigravity uses its insights to inform future provider matching decisions.
*   **Capability:** Aggregates operational performance data to generate dynamic dashboards for blue-collar providers. It tracks workload utilization, fair earnings benchmarks, reputation health, and outputs rate suggestions based on current market demand. Generates business metrics for service providers, tracking localized demand forecasts, reputation health, and payment fairness benchmarks.

---

## 6. Antigravity Reasoning Traces

Every n8n tool pipeline outputs an `antigravity_trace` block. Antigravity reads these traces to understand why a decision was made and what to do next. Below are three real sample traces from production runs.

### Trace 1 — Provider Selection (WF2 Calculate Provider Scores)

```json
{
  "antigravity_trace": {
    "workflow": "WF2-ProviderMatching",
    "reasoning": [
      "STEP 1 — User requested 'Plumber' in 'Johar Town, Lahore' with high urgency and high budget_sensitivity.",
      "STEP 2 — Geocoded location: lat 31.4697, lng 74.2728. Searched Google Places: 8 providers returned.",
      "STEP 3 — Fetched today's active bookings from Supabase. Provider ChIJzUJz89oB has 2/4 slots filled (MODERATE). Provider ChIJ8YeHj has 4/4 slots filled (FULL — excluded from availability score).",
      "STEP 4 — Scored all 8 providers across 7 factors. Top result: ChIJzUJz89oB scored 84. Breakdown: distance=80, availability=100, review=92, reliability=90, specialization=100, price=60, cancellation=95.",
      "STEP 5 — Job complexity = intermediate. Provider's complexity_levels = ['basic','intermediate'] → complexity_match: true → specialization score boosted to 100.",
      "STEP 6 — Budget sensitivity = HIGH. Provider base_rate_pkr = 900 → price score = 70 (within acceptable range for high-sensitivity user).",
      "STEP 7 — Price calculated: base 900 + complexity 270 + surge 0 (outside peak hours) + distance 105 = PKR 1275 total.",
      "STEP 8 — Recommended Provider: 'Al Madina electric store' (score 84). Next best: 'Bismillah electrician' (score 84). Alternatives array passed to Antigravity for potential reschedule use."
    ],
    "confidence": 91,
    "data_sources": {
      "providers": "Google Places Text Search API",
      "capacity": "Supabase bookings table — today confirmed/in_progress",
      "distance": "Google Distance Matrix API"
    }
  }
}
```

### Trace 2 — Dispute Escalation (WF6 Quality Complaint Handler)

```json
{
  "antigravity_trace": {
    "workflow": "WF6-QualityComplaint",
    "reasoning": "Quality complaint for booking BK-2026-1778878469314-066. Rating: 2/5. Sentiment: negative (keywords found: ['late','kharab']). Auto-escalated from WF5 feedback stage. Severity classified as HIGH (rating=2, negative sentiment). Compensation decision: 25% of PKR 1150 = PKR 288 refund approved. Provider 'YS Painters' score delta: -15. Flagged for 7-day monitoring. Human escalation: NOT required (threshold is rating=1 or CRITICAL). Booking status updated to 'disputed' in Supabase.",
    "confidence": 88,
    "decision_factors": ["rating_score", "sentiment_analysis", "review_keywords", "auto_escalation_flag"]
  }
}
```

### Trace 3 — Provider Optimization Dashboard (WF8 Optimization Engine)

```json
{
  "antigravity_trace": {
    "workflow": "WF8-ProviderOptimization",
    "reasoning": [
      "STEP 1 — Fetched 23 total bookings for provider 'YS Painters' (ID: ys_painters).",
      "STEP 2 — Workload today: 2/4 slots (50% utilization). Status: MODERATE.",
      "STEP 3 — Earnings calculated using final_price_pkr (actual paid, set by WF5 completed stage): PKR 21400 across 18 completed jobs. Avg: PKR 1189 vs platform avg PKR 1200. Fairness: FAIR.",
      "STEP 4 — Reputation from WF5 ratings: 18 ratings, avg 4.3/5. Flagged by WF6: 1. Health: GOOD.",
      "STEP 5 — Cancellation analysis from WF7 data: 2 cancellations out of 23 total. Rate: 9%. Status: GOOD.",
      "STEP 6 — Loyalty: 3 repeat customer(s) detected from completed bookings.",
      "STEP 7 — Demand forecast: Top slot is 10:00 with 5 platform bookings.",
      "STEP 8 — Rate suggestion: Fair relative to platform avg. No change needed.",
      "STEP 9 — Generated 4 optimization tips for provider."
    ],
    "data_sources": {
      "ratings": "customer_rating field written by WF5 feedback stage",
      "flags": "flagged_for_review field written by WF6 dispute handler",
      "cancellations": "cancellation_reason field written by WF7 auto-reschedule",
      "earnings": "final_price_pkr written by WF5 completed stage"
    },
    "confidence": 93
  }
}
```

---

## 7. Autonomous Workflows (n8n Tools)

Each n8n workflow acts as a specialized tool invoked and managed by Antigravity to execute specific tasks within the service lifecycle.

### WF1/WF2/WF3 — Intent, Provider Matching & Pricing Agent
Antigravity invokes this tool with the raw user query. WF1 passes it through GPT-4o-mini with a structured output parser to extract service type, location, urgency, budget sensitivity, job complexity, and language. WF2 geocodes the location, searches Google Places, checks real-time capacity from Supabase, and scores all providers. WF3 calculates the dynamic price breakdown.

**Features:**
*   Multilingual support (English, Urdu, Roman Urdu) with fuzzy spell correction.
*   NLP-based service classification covering 47 service types across 71 cities.
*   Confidence scoring — below 70% triggers a clarification question in the user's own language.
*   7-factor provider scoring algorithm with job complexity matching.
*   Fallback geocoding for unknown area names using a hardcoded coordinate map.
*   Multi-service support with 10% bundle discount.

### WF4 — Booking Agent
Antigravity calls this tool to manage slot availability and confirm bookings. It has two steps: Step A checks existing bookings with travel-time buffer logic to build an accurate available slot list; Step B performs a race-condition check at the exact moment of confirmation to prevent double-booking.

**Features:**
*   Service-duration map (AC install = 180 min, painter = 240 min, etc.) plus 30-min travel buffer.
*   Exact slot conflict detection plus buffer window overlap detection.
*   Atomic race-condition check before writing to Supabase.
*   Unique booking ID generation (`BK-{year}-{timestamp}-{random}`).
*   Confirmation email via Gmail API.
*   Slot-taken fallback with alternative dates offered automatically.

### WF5 — Service Quality Loop
Antigravity invokes this tool through four sequential stages to manage the complete post-booking service lifecycle.

**Stages:**
*   `en_route` — calculates ETA from distance, updates status in Supabase, sends email.
*   `arrived` — logs arrival time, generates service-specific checklist (7–9 steps), updates status to `in_progress`.
*   `completed` — records final price (`final_price_pkr`), detects price overruns, sends completion email.
*   `feedback` — records 1–5 star rating, written review, optional voice transcript, up to 3 base64 photo attachments. Runs sentiment analysis. Updates provider reputation. Auto-escalates to WF6 if rating ≤ 2.

### WF6 — Dispute & Escalation Handler
When issues arise, Antigravity delegates dispute handling to this tool. It routes by `dispute_type` and applies tiered resolution logic.

| Dispute Type | Decision Logic |
|---|---|
| `no_show` | Full refund. Cancellation rate >20% → blacklist. Otherwise → warning strike. |
| `provider_cancelled` | Penalty strike. Auto-rebook from alternatives list. PKR 200 credit if <3 hours to appointment. |
| `quality_complaint` | Rating 1 or negative sentiment → 50% refund + human escalation. Rating 2 → 25% refund. Rating 3 → warning only. |
| `price_disagreement` | ≤10% variance → warning only. 11–30% → 75% of excess refunded. >30% → full excess refunded. |
| `overrun` | Pre-approved → charge stands. Not notified → extra rejected. <15 min overrun → ≤10% extra. >15 min → 50% of extra approved. |

All outcomes update `status` and `flagged_for_review` in Supabase and send a dispute update email to the user.

### WF7 — Cancellation & Auto-Reschedule
Antigravity uses this tool to handle three cancellation modes: user cancel only, user reschedule, and provider cancel. For reschedules, it runs a full pipeline: penalty engine → alternative picker (sorted by `computed_score`) → calls WF4 Step A to get slots for new provider → calls WF4 Step B to confirm → updates original booking in Supabase → sends email.

**Waitlist Management:** When no alternative provider exists, or the alternative has no available slots, the user is automatically enrolled in the Supabase `waitlist` table. A ticket is created and the user is notified by email. The system offers three alternate date suggestions.

**Compensation Logic:**
*   <3 hours to appointment → PKR 250 credit
*   <12 hours to appointment → PKR 100 credit

### WF8 — Provider Optimization Agent
This tool gives providers a complete performance dashboard. Antigravity uses its insights to inform future provider matching decisions.

**Sections computed:**
*   **Workload** — today's utilization vs max capacity, open slots, status label.
*   **Earnings** — total from `final_price_pkr` (actual paid, set by WF5 completed stage). Avg: PKR 1189 vs platform avg PKR 1200. Fairness: FAIR.
*   **Reputation** — from WF5 ratings: 18 ratings, avg 4.3/5. Flagged by WF6: 1. Health: GOOD.
*   **Cancellation analysis** — from WF7 data: 2 cancellations out of 23 total. Rate: 9%. Status: GOOD.
*   **Loyalty** — 3 repeat customer(s) detected from completed bookings.
*   **Demand forecast** — Top slot is 10:00 with 5 platform bookings.
*   **Rate suggestion** — Fair relative to platform avg. No change needed.
*   **Optimization tips** — Generated 4 optimization tips for provider.

---

## 8. Provider Matching Factors

| Factor | Weight | Evaluation Basis |
|---|---|---|
| Distance & Travel Time | 20% | Distance matrix API metrics mapped directly to transit speeds |
| Real-time Availability | 20% | Live slot parsing against maximum daily provider allocations |
| Review Score + Recency | 15% | Standard Google Rating metrics paired with a 3-day recency bonus |
| Reliability Score | 15% | Historical performance adjusted by real behavioral patterns |
| Skill & Job Complexity | 15% | "Basic, Intermediate, and Complex tier alignment matrix" |
| Price vs Budget Match | 10% | Dynamic utility mapping calibrated to user price sensitivity |
| Cancellation Rate | 5% | Penalty index generated by historical drop rates |

---

## 9. Tech Stack & APIs Used

*   **Frontend Shell:** React 19, TypeScript, Vite, TailwindCSS, Framer Motion (for premium native micro-animations and transitions).
*   **Mobile Compilation:** CapacitorJS (Compiles native web code into high-performance iOS & Android binaries).
*   **Backend System:** Node.js, Express.js (Serving as a lightweight proxy layer to securely route frontend AI requests, avoid CORS issues, and protect API keys).
*   **Orchestration & Workflow:** Google Antigravity, n8n, Google Cloud Run.
*   **Core APIs:** OpenAI GPT-4o-mini, Google Gemini API (@google/genai), Web Speech API (for native speech-to-text), Google Maps (Geocoding, Places, Distance Matrix), Gmail API, Supabase (PostgreSQL).

---

## 10. Cost & Latency Analysis

*   **End-to-End Latency:** 4.0 – 7.0 seconds total for a complete lifecycle transaction (Intent parsing ➔ Match discovery ➔ Booking transaction ➔ UI notification state).
*   **Transactional Infrastructure Unit Pricing:** Estimated at ~$0.012 – $0.020 per booking at baseline scale, largely driven by optimized Google Maps API batched queries and high-efficiency token caching via GPT-4o-mini.

---

## 11. How to Setup & Run

### 🖥️ 1. Clone & Frontend Configuration

```bash
# Clone repository
git clone https://github.com/your-org/gharfix.git
cd gharfix

# Install dependencies
npm install

# Setup Environment Variables
cp .env.example .env
# Edit .env and append your credentials:
# GEMINI_API_KEY=your_key_here
```

### 🌐 2. Execute Development Server (Web view)

```bash
npm run dev
# Application will initialize live on http://localhost:3000
```

### 📱 3. Compile Target Mobile Applications (Capacitor)

```bash
# Build the production assets
npm run build

# Sync asset configs directly with native mobile modules
npx cap sync

# Open the respective native Integrated Development Environment (IDE)
npx cap open android   # Launches Android Studio
npx cap open ios       # Launches Xcode
```

---

## 12. Baseline Comparison

| Capability | Traditional Market Solutions | GharFix (Antigravity Powered) |
|---|---|---|
| Discovery Model | Hard static text list, manual lookups | Real-time Places API discovery + 7-Factor ranking |
| Language Support | Rigid English interfaces | Unified English, Urdu, and Roman Urdu Parsing |
| Resolution Time | Manual support tickets (1-3 business days) | Automated algorithmic dispute resolution (<1 sec) |
| Double-Bookings | Frequent operational overlap | Prevented via strict atomic database guards |
| Waitlist Handling | Manual dropping of client requests | Automated enrollment and notification |

---

## 13. Guardrails, Limitations & Future Scope

*   **Privacy & Security:** Absolute Zero-Trust Architecture. Sensitive geo-locations are utilized contextually strictly for regional matching pipelines and are never permanently stored post-transaction. Transactions run entirely on a Cash-on-Service basis; no user payment credentials are saved.
*   **Current Limitations:** System accuracy depends fully on active Google Places listings, meaning sparse rural data density may limit provider options outside primary urban hubs.
*   **Future Scope:** Intentions to build real-time GPS tracking paths directly inside the `en_route` worker state, implement a fraud prevention module using ML to verify user-uploaded images, and launch localized push notification events via Firebase Cloud Messaging.

---

**GharFix — Ghar ka kaam, AI ke saath.**
