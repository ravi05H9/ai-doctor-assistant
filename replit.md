# AI Doctor Assistant

A Personal AI Doctor Assistant — describe symptoms, get AI guidance, book doctors, track medications, and monitor recovery.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/doctor-ai run dev` — run the frontend (port 24852)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `OPENAI_API_KEY` — OpenAI API key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, TanStack React Query, Wouter, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI GPT (symptom analysis, health chat)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table schemas (doctors, appointments, medications, recovery, conversations, messages)
- `artifacts/api-server/src/routes/` — Express route handlers (doctors, appointments, medications, recovery, dashboard, openai)
- `artifacts/doctor-ai/src/` — React frontend
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation (do not edit)

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → typed hooks on frontend, Zod schemas on backend
- AI chat uses SSE streaming (Server-Sent Events) — Orval can't generate hooks for streams, client uses fetch + ReadableStream directly
- OpenAI model: gpt-4o-mini for cost-efficient health chat
- All AI conversations are persisted in DB (conversations + messages tables)
- Dashboard summary is computed server-side (recovery streak, upcoming appointments, etc.)

## Product

- **Dashboard** — health summary stats, next appointment, recovery streak, AI chat entry point
- **AI Chat** — describe symptoms, get AI health guidance and specialist suggestions (streaming)
- **Doctors** — searchable directory filtered by specialty, book appointments with any doctor
- **Appointments** — manage bookings (upcoming / completed / cancelled), cancel or reschedule
- **Medications** — track active prescriptions with dosage, frequency, and reminder times
- **Recovery Log** — log daily feeling score (1–10), symptoms, notes; chart shows recovery trend

## User preferences

- This app is Phase 1 of a larger roadmap including: voice AI booking, report analyzer (blood/X-ray), family dashboard, digital health twin, wearable sync, and emergency routing

## Gotchas

- AI SSE endpoint: `POST /api/openai/conversations/:id/messages` — consume with fetch, NOT React Query hooks
- After any OpenAPI spec change, always run codegen before touching routes or frontend
- `pnpm --filter @workspace/db run push` must be run after any schema change

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
