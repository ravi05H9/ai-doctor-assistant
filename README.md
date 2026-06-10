<div align="center">

# 🏥 AI Doctor Assistant

### Your Personal AI-Powered Healthcare Companion

**Describe symptoms → Get AI guidance → Book doctors → Track recovery**

[![Made with React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o-412991?style=for-the-badge&logo=openai)](https://openai.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

</div>

---

## 🚀 What is AI Doctor Assistant?

AI Doctor Assistant is a **full-stack AI-powered healthcare platform** that makes quality healthcare accessible to everyone. Simply describe your symptoms in plain language, get instant AI-powered medical guidance, find the right specialist, book appointments, track your medications, and monitor your recovery — all in one place.

> 🇮🇳 **Built for India** — Designed for tier-2 and tier-3 cities where access to quality healthcare guidance is limited.

---

## ✨ Key Features

### 🤖 AI Health Chat (Powered by GPT-4o)
- Describe symptoms in **plain English, Hindi, or Telugu**
- Get instant AI-powered health guidance and **specialist suggestions**
- Real-time **streaming responses** for a natural conversation experience
- All conversations **saved and persisted** for future reference

### 🔍 AI Pre-Check Before Booking
- AI analyzes your symptoms and suggests the **right specialty**
- Determines **urgency level** (routine / urgent / emergency)
- Recommends **online vs offline** consultation — saving you time and money

### 👨‍⚕️ Doctor Directory & Smart Booking
- Browse doctors **filtered by specialty and availability**
- Book, reschedule, or cancel appointments with ease
- View upcoming, completed, and cancelled bookings in one dashboard

### 💊 Medication Tracker
- Track all active prescriptions with **dosage and frequency**
- Set **reminder times** so you never miss a dose
- Full medication history at your fingertips

### 📈 Recovery Log & Analytics
- Log your **daily feeling score** (1–10 scale)
- Track symptoms and personal notes day by day
- **Visual recovery trend chart** to share with your doctor

### 🏠 Health Dashboard
- Personalized **health summary** at a glance
- View your next upcoming appointment
- **Recovery streak tracker** to keep you motivated
- Quick access to AI chat from anywhere

### 🧾 AI Medical Report Analyzer *(Coming Soon)*
- Upload blood reports, X-rays, or prescriptions
- AI explains **abnormal values in plain language**
- Supports **Telugu, Hindi, and English** — huge for rural India

---

## 📸 Screenshots

> *(Add screenshots of your Dashboard, AI Chat, and Doctors pages here)*

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Recharts |
| **State Management** | TanStack React Query, Wouter |
| **Backend** | Node.js 24, Express 5, TypeScript |
| **Database** | PostgreSQL + Drizzle ORM |
| **AI** | OpenAI GPT-4o-mini (streaming via SSE) |
| **API Design** | Contract-first OpenAPI spec + Orval codegen |
| **Validation** | Zod v4, drizzle-zod |
| **Package Manager** | pnpm workspaces (monorepo) |
| **Build** | esbuild (CJS bundle) |

---

## 📁 Project Structure

```
Health-Navigator/
├── artifacts/
│   ├── api-server/          # Express backend
│   │   └── src/routes/      # doctors, appointments, medications, recovery, dashboard, openai
│   └── doctor-ai/           # React + Vite frontend
│       └── src/pages/       # dashboard, ai-chat, doctors, appointments, medications, recovery
├── lib/
│   ├── api-spec/            # OpenAPI spec (single source of truth)
│   ├── api-client-react/    # Auto-generated React Query hooks
│   ├── api-zod/             # Auto-generated Zod schemas
│   └── db/                  # Drizzle ORM schema & migrations
└── scripts/                 # Utility scripts
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js 24+
- pnpm
- PostgreSQL database

### 1. Clone the repository
```bash
git clone https://github.com/ravi05H9/ai-doctor-assistant.git
cd ai-doctor-assistant
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment variables
```bash
# Create .env file
DATABASE_URL=your_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
```

### 4. Push database schema
```bash
pnpm --filter @workspace/db run push
```

### 5. Run the app
```bash
# Terminal 1 — Start backend (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Start frontend (port 24852)
pnpm --filter @workspace/doctor-ai run dev
```

Open [http://localhost:24852](http://localhost:24852) in your browser.

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm --filter @workspace/api-server run dev` | Start API server (port 8080) |
| `pnpm --filter @workspace/doctor-ai run dev` | Start frontend (port 24852) |
| `pnpm run typecheck` | Full typecheck across all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks and Zod schemas |
| `pnpm --filter @workspace/db run push` | Push DB schema changes (dev only) |

---

## 🗺️ Roadmap

### ✅ Phase 1 — Shipped
- [x] AI symptom checker & health chat
- [x] Doctor directory & appointment booking
- [x] Medication tracker
- [x] Recovery log with trend charts
- [x] Health dashboard

### 🔄 Phase 2 — In Progress
- [ ] Voice AI booking (Telugu & Hindi)
- [ ] AI medical report analyzer (blood reports, X-rays)
- [ ] Medicine reminders & push notifications
- [ ] Family health dashboard
- [ ] AI doctor matchmaking

### 🔮 Phase 3 — Future
- [ ] Digital health twin (AI personal health profile)
- [ ] Wearable sync (Apple Watch, Fitbit, glucose monitor)
- [ ] Emergency smart routing (nearest hospital, ambulance)
- [ ] Ambient AI for doctors (auto-notes & prescriptions)
- [ ] Predictive health alerts

---

## 🏗️ Architecture Highlights

- **Contract-first API design** — OpenAPI spec is the single source of truth; React Query hooks and Zod schemas are auto-generated via Orval
- **Real-time AI streaming** — AI chat uses SSE (Server-Sent Events) for a fast, natural streaming experience
- **Monorepo with pnpm workspaces** — clean separation between frontend, backend, DB, and shared libs
- **Type-safe end to end** — TypeScript 5.9 across the entire stack

---

## 👨‍💻 Author

**B Ravi Teja**
- GitHub: [@ravi05H9](https://github.com/ravi05H9)
- B.Tech CSE | Full Stack Developer | Andhra Pradesh, India

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**⭐ If this project helped you, please give it a star!**

*Built with ❤️ for making healthcare accessible to every Indian*

</div>
