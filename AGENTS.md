# AGENTS.md

## Purpose
This file defines how any AI coding agent (or human) should behave while working on the Embedra codebase. Read this before writing any code.

## Project Summary
Embedra is an NLP-powered idea formation platform. Users share, discuss, and refine ideas in groups, build a contribution track record, and discover ideas via semantic search/feed. Full detail in PRD.md. Schema in DATA.md. Build order in PHASES.md.

## Tech Stack (do not deviate without explicit instruction)
- Frontend: Next.js + TailwindCSS
- Backend: Node + Express (separate service, not Next.js API routes)
- DB: PostgreSQL + pgvector extension
- ORM: Drizzle
- Real-time: Socket.IO
- Auth: Custom JWT + bcrypt (no third-party auth provider)
- Email/OTP: Resend
- File storage: Cloudflare R2
- Validation: Zod (shared between frontend and backend)
- Queue/Cache: Redis (Upstash) + BullMQ for async jobs
- NLP: Separate Python FastAPI service, pretrained/zero-shot models only, CPU-only, no fine-tuning, no paid LLM APIs
- Monorepo: Turborepo

## Repo Structure

```
embedra/
├── web/                  # Next.js frontend
│   ├── app/
│   ├── components/
│   └── ...
├── api/                   # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── sockets/       # Socket.IO handlers
│   │   ├── queues/         # BullMQ job definitions
│   │   └── middleware/      # auth, validation
│   └── ...
├── nlp/                     # Python FastAPI service
│   ├── models/                # loading pretrained models
│   ├── endpoints/              # embed, summarize, classify, caption
│   └── requirements.txt
├── packages/
│   ├── db/                       # Drizzle schema + migrations
│   └── types/                      # shared Zod schemas / TS types
├── package.json                     # root — Turborepo + shared dev tooling
└── turbo.json
```



## Hard Rules
1. **No paid third-party APIs.** No OpenAI/Anthropic/etc. calls for NLP. All models are self-hosted, pretrained, CPU-only, zero-shot (no fine-tuning — no labeled data exists).
2. **No new infrastructure without asking.** Do not introduce Kafka, RabbitMQ, GraphQL, a new DB, or a new framework unless the user explicitly approves it. Stack is finalized.
3. **Express backend is separate from Next.js.** Never move backend logic into Next.js API routes/server actions.
4. **NLP logic lives only in `nlp-service/`.** Express never runs Python or ML models directly — it calls `nlp-service` over HTTP.
5. **All shared types/validation go in `packages/types/`** using Zod. Do not duplicate a schema definition in both `apps/web` and `apps/api`.
6. **Follow DATA.md exactly for schema.** Do not add, rename, or remove columns without updating DATA.md first.
7. **Follow PHASES.md build order.** Do not build Phase 3+ features before earlier phases are functional, unless explicitly told to jump ahead.
8. **Async/slow work goes through BullMQ, not inline in a request handler.** Any NLP call, image processing, or email send must be queued, not awaited directly in an Express route.
9. **No DMs, no versioning, no blocking, no idea takedown, no active notifications, no organizations-as-entities.** These are explicitly out of scope — do not add them even if they seem like natural extensions.
10. **Community bans are scoped to one community only, never platform-wide.**
11. **Owner cannot rate their own idea. Ratings require tenure and freeze on exit.**
12. **Contribution log entries default to `pending` and require owner approval before becoming publicly visible.**

## Coding Conventions
- TypeScript everywhere in `apps/web` and `apps/api`.
- Python (typed where reasonable) in `nlp-service`.
- Zod schemas are the source of truth for request/response shapes — infer TS types from them, don't hand-write duplicate interfaces.
- Prefer explicit, readable code over cleverness — this codebase will be touched by multiple people (and an AI agent with limited reasoning capacity), so clarity > brevity.
- Every new API endpoint needs: a Zod input schema, a Zod output schema (or documented shape), and an entry in the API contract doc (once it exists).

## When Uncertain
If a requirement is ambiguous or not covered in PRD.md/DATA.md/PHASES.md, stop and ask rather than guessing — especially for anything touching auth, ratings, moderation, or data that affects multiple users.