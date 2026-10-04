# PrepPilot AI 🎓✈️
### AI Placement Readiness & Measured Improvement Platform for Indian College Students

> **Core Differentiation: The Closed Learning Loop**  
> `Interview ➔ Diagnosis ➔ Personalized Practice ➔ Re-Interview ➔ Measured Improvement`  
> Unlike generic mock interview sites (Huru, Big Interview, Yoodli), PrepPilot AI **remembers** student weaknesses and uses them to design adaptive follow-up interviews that prove measured growth.

---

## 🌟 Key Highlights & Architecture

1. **Closed Learning Loop Workflow**:
   - **Step 1: Diagnostic Placement Interview**: Voice/Text interview tailored to Indian campus drives (SDE, Data Analyst, Mass Recruiters vs Product Firms, STAR framework, resume projects).
   - **Step 2: Multi-Metric Weakness Diagnosis**: Pinpoints exact technical gaps (e.g. "B-Tree indexing tradeoffs"), STAR delivery deficiencies, and communication clarity.
   - **Step 3: Targeted Remediation Drills**: Auto-generates interactive micro-drills (Concept Flash Drills, STAR Builders, Scenario challenges) strictly targeting diagnosed weaknesses with real-time AI grading.
   - **Step 4: Adaptive Re-Interview**: The AI retrieves previously diagnosed weak points and dedicates targeted questions to re-test mastery with fresh scenarios.
   - **Step 5: Measured Improvement Delta**: Recharts radar charts and progression line charts prove quantified growth (e.g., `+15 pts` score delta) and resolve weakness ledger items.

2. **Indian Campus Placement Grounding**:
   - Company tiers: Tier-1 Product (Google, Amazon, Microsoft, Atlassian, Uber, Swiggy), High-Growth Unicorns (Razorpay, CRED, Zomato), Service & Mass Recruiters (TCS Digital/Prime, Infosys DSE, Wipro Turbo), FinTech & Startups.
   - Roles: SDE (Data Structures, System Design, Backend, SQL), Full Stack, Frontend, Backend, Data Analyst, Campus General.

3. **Voice + Text Dual Input**:
   - Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with Indian English (`en-IN`) and Hindi (`hi-IN`) accent support.
   - Live waveform visualizer and speech-to-text transcription.
   - Text input fallback always available and synced in real time.
   - AI Interviewer Text-to-Speech (`window.speechSynthesis`) speaks questions aloud in Indian English.

4. **Resume Intelligence**:
   - Server-side PDF extraction via `pdf-parse`.
   - Pasted resume text always available as reliable fallback.
   - Deep-dives into applicant's actual project architecture and technical claims.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (dark mode glassmorphism theme with electric indigo `#6366F1` accents)
- **Database & ORM**: SQLite local file database (`file:./dev.db`) + Prisma ORM
- **AI Engine**: Google Gemini API via `@google/generative-ai` with configurable model (default `gemini-2.0-flash`) and intelligent domain-grounded fallback engine
- **Voice / Speech**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Visual Analytics**: Recharts (`RadarChart`, `LineChart`)
- **Celebration**: `canvas-confetti`

---

## ⚙️ Environment Configuration

In `.env.local`:

```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your_gemini_api_key_here" # Optional: Leave empty to run with built-in placement simulation engine
GEMINI_MODEL="gemini-2.0-flash"           # Configurable without code edits
```

> **Zero-Friction Fallback**: If `GEMINI_API_KEY` is not provided, PrepPilot AI runs on its built-in rule-based placement diagnostic and grading engine, ensuring 100% operational functionality out of the box. Adding your Gemini API key activates live Gemini 2.0 Flash evaluations immediately.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npx prisma db push
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the Closed Loop in 60 Seconds

1. Click **"1-Click Sample Placement Candidate"** on the landing page to load a pre-configured Tier-1 SDE candidate profile (Aarav Sharma, VIT Vellore).
2. Start the **Diagnostic Interview** (Round #1), speak or type answers, and submit.
3. Review the **Diagnosis Report** to see your 4-metric score breakdown and diagnosed weaknesses.
4. Click **"Step 3: Practice These Weaknesses"** to practice targeted drills with instant AI grading.
5. Launch the **Adaptive Re-Interview** (Round #2) — notice how the AI explicitly re-tests your past diagnosed gaps!
6. View the **Improvement Delta** tab to see your `+pts` score jump and updated radar chart.
