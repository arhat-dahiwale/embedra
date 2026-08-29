# PRD.md — Embedra

## 1. Product Summary
Embedra is a platform for sharing, refining, and discussing ideas. Users post ideas, form groups around them, collaborate, and build a track record of contributions. NLP is used throughout for discovery, matching, moderation support, and content understanding — implemented via self-hosted pretrained models (no paid LLM APIs, no fine-tuning).

## 2. Users
Students, teachers, hobbyist coders, working professionals — anyone. No user type gating at the platform level (communities are the only institution-scoped layer, and only apply to institutional users).

## 3. Core Entities
- **User** — account, profile, skills, followers
- **Idea** — the central object; has a public page + one private group
- **Group** — contributor-only space tied to one idea (chat, membership)
- **Community** — optional, ownerless, institution-scoped space (e.g. "Amrita Vishwa Vidyapeetham Bangalore")

## 4. Ideas

### 4.1 States
- **Open + open access** — public, spectators can request to join
- **Open + closed access** — public visibility, joining is invite-only (owner or shareable link)
- **Closed** — no longer open to modification

### 4.2 Idea Page (public)
README-style description, domain tag, "Looking for: [skill]" list, owner (linked to profile), member count + activity level, rating, public comments, contribution log (approved only), image uploads.

### 4.3 Group Page (private, contributors only)
Real-time chat, image uploads. Not visible to spectators.

### 4.4 Ownership
One owner per idea = group admin (add/remove members). Contributor = simply "is a group member," no earned tiers. Owner cannot rate their own idea.

### 4.5 Forking
Any contributor can fork any idea into a new idea they own. Fork stores `forked_from`. Original idea is never modified, deleted, or transferred — this is the only mechanism for handling an abandoned/inactive owner. No voting, no inactivity timers, no succession system.

### 4.6 No Versioning
Ideas have no edit history/diffs. Current state only.

## 5. Groups
One group per idea. Owner has sole add/remove authority. No DMs anywhere on the platform. No platform-level in-group moderation ("owner's group, owner's problem").

## 6. Rating
- Rates idea concept only, not execution
- Contributors only (not spectators, not the owner)
- Tenure-gated: must be a member for a minimum period before rating counts
- Frozen/removed from live average on exit
- Changeable while still a member
- Feeds into feed ranking

## 7. Contribution Log
Separate tab per idea (like a commit log). Contributor submits text + optional link → `pending`. Owner approves/rejects. Public/profile view shows approved only.

## 8. Communities
- Ownerless, institution-scoped
- Different subdomains (e.g. campus-specific email domains) = separate communities
- Join flow: type name → NLP autocomplete suggests existing communities → verify via institutional email OTP → joined
- **True duplicate-prevention key is the verified email domain, not the typed name**
- One verified email = one user, per community
- Membership is permanent (v1, no expiry)
- Users can belong to multiple communities
- Applies only to institutional users; non-institutional users stay on public/global feed (non-institutional communities deferred)

## 9. Moderation & Reporting
- Single unified report queue for ideas, users, and communities (tagged by source)
- All outcomes via manual human review — no automated bans
- NLP-assisted classification triages the queue, does not decide outcomes
- Community bans (when issued) are scoped to that one community, 30 days
- Out of scope for v1: idea takedown, blocking, automated NSFW detection

## 10. Feed & Search
- Feed: NLP embedding similarity between user profile/activity and ideas, blending skill-match, domain-tags, and following signals
- Separate "Saved Ideas" page
- Search: semantic search over title/tags/domain, filters for open/closed status and rating
- Onboarding: skills-first, feeds directly into feed algorithm
- Domains: fixed, curated list (no user-created domains) in v1

## 11. Profile Page
Picture, username, bio, idea counts (open+closed), active group count, activity heatmap, social/project links, followers/following (no DMs), self-tagged skills, active groups list.

## 12. Notifications
v1 is entirely passive — no push/email notification infrastructure. Feed/log freshness is the notification system. Active notifications deferred.

## 13. NLP Feature Set
All self-hosted, pretrained, zero-shot, CPU-only:
1. Feed ranking (embeddings)
2. Semantic search (embeddings)
3. Duplicate idea detection (embeddings)
4. Image captioning (BLIP)
5. Community autocomplete (embeddings)
6. Skill extraction from bios (NER/keyword-match)
7. Conversation summarization (extractive/small pretrained summarizer)
8. Report classification (zero-shot classification)
9. Auto-drafting contribution entries (template + light rewrite)
10. Duplicate community detection (embeddings, future — non-institutional communities)

Explicitly removed: sentiment/tone analysis of group discussions.

## 14. Explicitly Out of Scope (v1)
Organizations as owned entities, non-institutional communities, idea versioning, DMs, blocking, active notifications, automated NSFW detection, idea takedown, community membership expiry.

# Tech Stack

| Layer         | Choice                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend      | Next.js + Tailwind (Typescript)                                                                                                                         |
| Backend       | Node + Express (Typescript)                                                                                                                             |
| DB            | PostgreSQL + pgvector                                                                                                                                   |
| ORM           | Drizzle                                                                                                                                                 |
| Real-time     | Socket.IO                                                                                                                                               |
| Auth          | Custom JWT + bcrypt                                                                                                                                     |
| Email/OTP     | Resend (free tier)                                                                                                                                      |
| File storage  | Cloudflare R2 (free tier)                                                                                                                               |
| Validation    | Zod                                                                                                                                                     |
| Queue / Cache | Redis (Upstash free tier) — BullMQ for job queue (NLP task offloading), Socket.IO adapter, OTP storage, caching                                         |
| NLP           | Pretrained, zero-shot, CPU-only (sentence-transformers, spaCy/keyword-match, zero-shot classifier, BLIP, distilbart) + FastAPI (Express talks via HTTP) |
| Hosting       | TBD later                                                                                                                                               |

