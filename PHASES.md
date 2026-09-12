# PHASES.md — Build Order (Expanded)

## Phase 0 — Foundations ✅ COMPLETE
0.1 Repo scaffold (web/, api/, nlp/, packages/db/, packages/types/)
0.2 Drizzle schema + migrations against Neon
0.3 Seed fixed lookup tables (skills, domains)
0.4 Auth: signup/login/me (JWT + bcrypt)
0.5 Health-check (api ↔ web communication)

---

## Phase 1 — Core Loop (no NLP)
1.1 Idea CRUD — create, view, edit (title, description, domain from fixed list)
1.2 Idea page — public README-style view (owner, domain, looking-for list placeholder, empty rating/contribution sections for now)
1.3 Join flow — request-to-join (open+open) and owner-invite/shareable link (open+closed)
1.4 Group creation — auto-created alongside idea, 1:1 relationship
1.5 Group page — private view, contributor-only access check
1.6 Group chat — Socket.IO wiring, paginated message history (per AGENTS.md rule 13)
1.7 Add/remove contributors — owner-only group membership management
1.8 Basic profile page — manually entered skills, bio, links (no heatmap/counts logic yet)

**Exit criteria:** a user can create an idea, get others to join, and chat in real time.

---

## Phase 2 — Trust & Contribution Mechanics
2.1 Rating — submit/update endpoint, tenure-gate check, owner-exclusion check
2.2 Rating freeze-on-exit — triggered when a group_members row gets `left_at` set
2.3 Rating cache — recompute `avg_rating`/`rating_count` on ideas after any rating change
2.4 Contribution log — submit entry (pending), list entry (approved-only for public)
2.5 Contribution review — owner approve/reject actions
2.6 Idea page comments — top-level + threaded replies (parent_comment_id)
2.7 Image upload wiring — Cloudflare R2 integration for idea_images and group_messages
2.8 Fork feature — fork endpoint, forked_from_id lineage, reverse "forked by" list
2.9 Saved ideas — save/unsave endpoints + saved ideas page

---

## Phase 3 — NLP, First Pass
3.1 nlp/ service skeleton — FastAPI app, health-check endpoint
3.2 BullMQ + Redis wiring — job queue setup in api/, connecting to nlp/ async (per AGENTS.md rule 8)
3.3 Embeddings — sentence-transformers endpoint (`/nlp/embed`), wire into idea creation (store embedding on ideas)
3.4 Feed ranking — embedding similarity query, replacing any placeholder feed logic
3.5 Semantic search — search endpoint using embeddings + status/rating filters
3.6 Duplicate idea detection — check similarity against existing ideas on creation
3.7 Image captioning — BLIP endpoint (`/nlp/caption`), auto-run on idea_images/group_messages uploads
3.8 Skill extraction — NER/keyword-match endpoint (`/nlp/extract-skills`), wire into profile bio save
3.9 Report classification — zero-shot endpoint (`/nlp/classify-report`), wire into report submission

---

## Phase 4 — Communities
4.1 Community creation — name input, NLP autocomplete suggestion (reuses 3.3 embeddings)
4.2 OTP flow — Redis-based OTP generation/verification, Resend email integration
4.3 Domain-keyed join — verify email domain against existing communities.email_domain, merge or create
4.4 Community membership — community_members row creation on verified join
4.5 Community feed toggle — filter feed by community_id
4.6 Idea-to-community linking — community_id set at idea creation, scoped visibility
4.7 Unified report queue — reports table wired for idea/user/community sources, tagged appropriately
4.8 Community bans — manual review action, scoped 30-day ban via community_bans

---

## Phase 5 — Harder NLP + Polish
5.1 Conversation summarization — pretrained summarizer endpoint (`/nlp/summarize`), triggered on-demand or periodically for group_messages
5.2 Auto-drafting contribution entries — template + light rewrite endpoint (`/nlp/draft-contribution`)
5.3 Duplicate community detection — semantic check on community description (future-proofing for non-institutional communities)
5.4 Search filter refinement — combine status + rating filters cleanly with semantic ranking
5.5 Performance pass — pagination audit across all list endpoints, query optimization
5.6 Hosting setup — deploy web/, api/, nlp/, finalize env vars for production

---

## Notes
- Each numbered sub-step should be handed to the coding agent as its own scoped prompt, not batched, per the Phase 0 precedent.
- Do not start a later phase's sub-steps before the current phase's exit criteria (where defined) are met, unless explicitly instructed to jump ahead.
- Sub-steps within a phase are listed in a sensible build order but are not strictly sequential where marked independent (e.g. 1.8 profile page can be built in parallel with 1.1–1.7 by a different teammate).