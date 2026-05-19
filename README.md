# Khidmatgaar AI: Empowering Home Services with Intelligent Automation

> **"Aapki Zaroorat, Hamare Maahir" (Your Need, Our Experts)**

## 🚀 Problem Statement

Finding reliable, verified, and specialized home service professionals (electricians, plumbers, mechanics) is often a frustrating, time-consuming process fraught with miscommunication. Customers struggle to describe their exact issues, while service providers waste time deciphering unclear requests and managing scattered schedules. There is a critical need for an intelligent intermediary that bridges the language and technical gap between customers and blue-collar service providers.

## 💡 Solution Overview

**Khidmatgaar AI** is an intelligent, hybrid mobile platform (iOS/Android/Web) that revolutionizes how home services are booked. By leveraging advanced Conversational AI and natural language processing, Khidmatgaar allows users to simply speak or type their problem in their native language (English, Urdu, or Roman Urdu). 

Our AI agents automatically extract the intent, determine the specific service required, identify the location, and match the customer with the most relevant, highly-rated professionals in real-time. This eliminates friction, ensures precise job matching, and empowers local service providers with a streamlined dashboard to manage their business.

---

## 🏗️ Architecture Diagram (Text-Based)

```text
[ User Interface (React / Capacitor) ]
       │      │       │
       ▼      ▼       ▼
[ Voice/Text Input Handler ] ─────► [ UI State & Navigation ]
       │                                       ▲
       ▼                                       │
[ Local Proxy Server (Express/Node.js) ]       │
       │                                       │
       ▼                                       │
[ Khidmatgaar AI Core (Agent Orchestrator) ] ──┘
       │
       ├────► [ Intent Extraction Agent (NLP/Gemini) ]
       │          - Detects Language (Urdu/English)
       │          - Identifies Service Type & Location
       │
       ├────► [ Provider Matching Engine ]
       │          - Queries Mock/Real Database
       │          - Ranks by Location & Rating
       │
       └────► [ Booking & Tracking Service ]
                  - Manages State (Pending, Accepted, Route)
```

---

## 🤖 Agents Developed

1. **Multilingual Intent & Triage Agent:**
   - **Description:** Acts as the first point of contact. It accepts raw, unstructured text or voice transcripts from the user. It uses LLMs to parse out the core requirements: `serviceType` (e.g., AC Repair), `city` (e.g., Lahore), and `area` (e.g., DHA).
   - **Capability:** Seamlessly handles code-switching (e.g., Roman Urdu mixed with English) and asks clarifying questions if required parameters are missing.

2. **Smart Matchmaker Agent:**
   - **Description:** Takes the structured intent data and cross-references it with the provider database. 
   - **Capability:** Filters providers based on proximity, availability, and historical service ratings, returning the top matches directly to the user interface.

---

## 🔌 APIs & Mock/Real Services Used

* **Gemini / LLM API (Real):** Used for Natural Language Processing, extracting structured intent from user queries, and generating dynamic conversational responses.
* **Web Speech API (Real):** Native browser/device API utilized for real-time speech-to-text conversion, enabling accessibility for users who prefer speaking over typing.
* **Provider Matching API (Mock):** Simulates a backend database query (`/api/proxy -> khadmat-intent`) that returns a curated list of service providers based on location and service type parameters.
* **Booking & Tracking API (Mock):** Simulates real-time status updates (e.g., "Provider En Route", "Job Completed") for the user's dashboard.

---

## 🔗 Integrations Implemented

* **CapacitorJS Integration:** Bridges the web-based React frontend with native iOS and Android device APIs, allowing the application to be compiled into native binaries for App Stores.
* **Express.js Proxy Integration:** A lightweight backend Node layer that securely routes frontend AI requests to external LLM services, avoiding CORS issues and protecting API keys.
* **Framer Motion Integration:** Implemented to provide smooth, native-feeling micro-animations and page transitions critical for a premium mobile user experience.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Vite, TailwindCSS
* **Mobile Shell:** CapacitorJS (iOS & Android)
* **Backend / Proxy:** Node.js, Express, ESBuild
* **AI / NLP:** Google Gemini (via `@google/genai`)
* **Animations & Icons:** Motion (Framer), Lucide-React

---

## ⚙️ How to Run / Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/gharfix.git
   cd gharfix
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`
   - Add your Gemini API key:
     ```env
     GEMINI_API_KEY=your_api_key_here
     ```

4. **Run the Development Server (Web):**
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:3000`.*

5. **Build for Mobile (Capacitor):**
   ```bash
   npm run build
   npx cap sync
   npx cap open android  # Or 'ios'
   ```
