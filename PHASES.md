# PHASES.md — Build Order

## Phase 0 — Foundations
- Monorepo scaffold (Turborepo), apps/web, apps/api, packages/db, packages/types, nlp-service
- DB schema + migrations (Drizzle) per DATA.md
- Auth: signup/login, JWT + bcrypt
- Express + Next.js skeletons communicating successfully
- No NLP yet

## Phase 1 — Core Loop (no NLP)
- Create idea (title, description, fixed-list domain)
- Idea page (public, README view)
- Request-to-join (open access) / owner-invite or link (closed access)
- Group creation + group page
- Real-time group chat (Socket.IO)
- Add/remove contributors (owner only)
- Basic profile page (manually entered skills)

**Exit criteria:** a user can create an idea, get others to join, and chat in real time. No NLP, no communities, no rating yet.

## Phase 2 — Trust & Contribution Mechanics
- Rating (tenure gate, freeze-on-exit, changeable, owner excluded)
- Contribution log (submit → pending → owner approve/reject)
- Idea page public comments
- Image upload wired to Cloudflare R2 (no captioning yet)
- Fork feature (forked_from lineage, reverse pointer)

## Phase 3 — NLP, First Pass
Build order within this phase (cheapest/most reliable first):
1. Embeddings service (sentence-transformers) → powers feed ranking, semantic search, duplicate idea detection
2. Image captioning (BLIP) → plugs into existing image upload
3. Skill extraction (NER/keyword-match) → profile bio auto-tagging
4. Report classification (zero-shot) → plugs into report queue
- BullMQ + Redis formalized for all NLP calls (async, non-blocking)

## Phase 4 — Communities
- Community creation/join flow, domain-keyed identity, OTP verification (Resend)
- Community feed toggle
- Community membership + community-scoped bans (via unified report queue)
- Community autocomplete (reuses Phase 3 embeddings)

## Phase 5 — Harder NLP + Polish
- Conversation summarization (heaviest NLP feature — build last, after easier features validate the pipeline)
- Auto-drafting contribution entries
- Search filter refinement (rating, status)
- General polish, performance pass, hosting setup

## Notes
- NLP work (Phase 3+) should not block Phase 1/2 frontend or backend work — different people, parallel tracks once schema is stable.
- Do not skip ahead to Phase 5 features before Phase 3's easier NLP features are working — validates the self-hosted pipeline approach before committing to the hardest feature.