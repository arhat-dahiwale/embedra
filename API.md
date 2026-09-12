# API.md — Endpoint Reference

## Conventions
- All request/response bodies validated via Zod schemas in `packages/types/`.
- Auth required on all routes except where marked **Public**.
- Auth via `Authorization: Bearer <JWT>` header.
- All list endpoints support `?page=` and `?limit=` pagination unless noted.
- Base path: `/api/v1`

---

## Auth
| Method | Route | Notes |
|---|---|---|
| POST | `/auth/signup` | **Public.** Create user account |
| POST | `/auth/login` | **Public.** Returns JWT |
| POST | `/auth/logout` | Invalidate session (if using refresh tokens) |
| GET | `/auth/me` | Return current authenticated user |

---

## Users / Profile
| Method | Route | Notes |
|---|---|---|
| GET | `/users/:id` | **Public.** Profile page data |
| PATCH | `/users/me` | Update own profile (bio, links, pic) |
| GET | `/users/:id/ideas` | **Public.** Ideas owned by user |
| GET | `/users/:id/groups` | Active groups user is in (own profile only, or public subset) |
| GET | `/users/:id/contributions` | **Public.** Approved contributions only |
| POST | `/users/:id/follow` | Follow a user |
| DELETE | `/users/:id/follow` | Unfollow |
| GET | `/users/:id/followers` | **Public.** |
| GET | `/users/:id/following` | **Public.** |
| GET | `/users/me/saved-ideas` | Ideas the user has saved |
| POST | `/users/me/skills` | Add a skill tag |
| DELETE | `/users/me/skills/:skillId` | Remove a skill tag |

---

## Skills / Domains (fixed lookups)
| Method | Route | Notes |
|---|---|---|
| GET | `/skills` | **Public.** Full fixed list |
| GET | `/domains` | **Public.** Full fixed list |

---

## Ideas
| Method | Route | Notes |
|---|---|---|
| POST | `/ideas` | Create idea |
| GET | `/ideas/:id` | **Public.** Idea page (README, owner, tags, rating, member/activity summary, looking-for list). `invite_token` is included only in the owner's view. |
| PATCH | `/ideas/:id` | Update idea (owner only) |
| DELETE | `/ideas/:id` | Owner only — deletes idea and cascades (group, members, messages, join requests) |
| POST | `/ideas/:id/close` | Owner marks idea as closed |
| POST | `/ideas/:id/fork` | Any authenticated user forks idea they can view → creates new idea with `forked_from_id` set, `community_id` copied from source |
| GET | `/ideas/:id/forks` | **Public.** Returns fork count only (`{ count: number }`), not a list — avoids clutter when many people fork the same idea |
| POST | `/ideas/:id/request-join` | Spectator requests access (type: open+open only) |
| GET | `/ideas/:id/join-requests?cursor=&limit=` | Owner only — lists join requests. Cursor-paginated on `created_at`, descending. Default `limit=50`. Response includes `nextCursor`. |
| PATCH | `/ideas/:id/join-requests/:requestId` | Owner only — accept/reject a join request |
| POST | `/ideas/:id/looking-for` | Owner adds a skill to "Looking for" list (body `{ skillId }`, rejects duplicates) |
| DELETE | `/ideas/:id/looking-for/:skillId` | Owner removes it |
| POST | `/ideas/:id/regenerate-invite` | Owner invalidates the old invite token and generates a new one |
| POST | `/ideas/join-via-invite/:token` | Auth required. Joins an open_closed, open idea directly via shareable invite token |
| POST | `/ideas/:id/save` | Save idea to user's saved list |
| DELETE | `/ideas/:id/save` | Unsave |

## Idea Images
| Method | Route | Notes |
|---|---|---|
| POST | `/ideas/:id/images` | Upload image (idea page) → R2 |
| DELETE | `/ideas/:id/images/:imageId` | Remove (owner or uploader) |

## Idea Comments
| Method | Route | Notes |
|---|---|---|
| GET | `/ideas/:id/comments` | **Public.** Threaded (includes `parent_comment_id`) |
| POST | `/ideas/:id/comments` | Add comment or reply |
| DELETE | `/ideas/:id/comments/:commentId` | Author or owner |

---

## Groups
| Method | Route | Notes |
|---|---|---|
| GET | `/groups/:id` | Contributors only — group page data |
| GET | `/groups/:id/members?cursor=&limit=` | Contributors only. Cursor-paginated on `joined_at`, descending. Default `limit=50`. Response includes `nextCursor`. |
| POST | `/groups/:id/members` | Owner adds a member |
| DELETE | `/groups/:id/members/:userId` | Owner removes a member (sets `left_at`) |
| GET | `/groups/:id/messages?cursor=&limit=` | Contributors only. Cursor-based pagination on `created_at`, descending (most recent first). Default `limit=50`. Response includes `nextCursor` for loading older messages. |
| — | Socket.IO channel `/groups/:id` | Real-time message send/receive, not REST |

---

## Ratings
| Method | Route | Notes |
|---|---|---|
| POST | `/ideas/:id/rating` | Submit/update rating (contributor, tenure-gated, not owner) |
| GET | `/ideas/:id/rating` | **Public.** Current avg + count (cached fields) |

---

## Contributions (log)
| Method | Route | Notes |
|---|---|---|
| GET | `/ideas/:id/contributions` | **Public.** Approved-only for non-owners; owner/author see all statuses |
| POST | `/ideas/:id/contributions` | Contributor submits entry → `pending` |
| PATCH | `/contributions/:id/approve` | Owner only |
| PATCH | `/contributions/:id/reject` | Owner only |

---

## Communities
| Method | Route                      | Notes                                                                   |
| ------ | -------------------------- | ----------------------------------------------------------------------- |
| GET    | `/communities`             | **Public.** List/search (autocomplete uses this + embeddings)           |
| GET    | `/communities/:id`         | **Public.** Community info                                              |
| POST   | `/communities`             | Create new (triggers OTP flow if domain doesn't exist)                  |
| POST   | `/communities/:id/join`    | Existing community — starts OTP verification                            |
| POST   | `/communities/verify-otp`  | Submit OTP code, completes join, checks Redis                           |
| GET    | `/communities/:id/ideas`   | Only members of community can see this. Ideas scoped to this community. |
| GET    | `/communities/:id/members` | Members only                                                            |

---

## Feed / Search
| Method | Route | Notes |
|---|---|---|
| GET | `/feed` | Personalized feed (embedding-based, global by default) |
| GET | `/feed?community=:id` | Feed toggled to a specific community |
| GET | `/search?q=` | Semantic search over ideas; supports `&status=` `&rating=` filters |

---

## Reports
| Method | Route | Notes |
|---|---|---|
| POST | `/reports` | Submit report `{ target_type, target_id, community_id?, reason }` |
| GET | `/reports` | Admin/reviewer only — the unified queue |
| PATCH | `/reports/:id/resolve` | Admin/reviewer only — sets `status`, `resolution` |

---

## NLP Service (internal — called by `api`, not exposed to `web`)
| Method | Route | Notes |
|---|---|---|
| POST | `/nlp/embed` | Text → vector (feed, search, dup-detection) |
| POST | `/nlp/caption` | Image → caption text (BLIP) |
| POST | `/nlp/extract-skills` | Bio text → skill tag suggestions |
| POST | `/nlp/classify-report` | Report text → category |
| POST | `/nlp/summarize` | Group message history → summary |
| POST | `/nlp/draft-contribution` | Raw input → structured contribution draft |

All NLP calls from `api` are queued via BullMQ, not called synchronously inline in a request handler (per AGENTS.md rule 8).