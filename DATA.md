# DATA.md — Schema Reference

## users
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| username | text, unique | |
| email | text, unique | |
| password_hash | text | bcrypt |
| bio | text | |
| profile_pic_url | text | |
| socials | jsonb | |
| project_links | jsonb | |
| created_at | timestamp | |

## skills
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text, unique | fixed lookup list |

## user_skills
| Column | Type | Notes |
|---|---|---|
| user_id | FK users | |
| skill_id | FK skills | |

## follows
| Column | Type | Notes |
|---|---|---|
| follower_id | FK users | |
| following_id | FK users | |

## domains
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text, unique | fixed lookup list |

## ideas
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| owner_id | FK users | |
| title | text | |
| description | text | README-style writeup |
| domain_id | FK domains | |
| community_id | FK communities, nullable | NULL = global/public idea; set = belongs to one community (ASSUMPTION: idea belongs to at most one community — confirm if cross-posting to multiple communities is needed instead) |
| access_type | enum(open_open, open_closed, closed) | |
| status | enum(open, closed) | |
| embedding | vector | pgvector, for feed/search/dup-detection |
| forked_from_id | FK ideas, nullable | self-reference, lineage |
| avg_rating | numeric, nullable | cached, recomputed on rating change/freeze |
| rating_count | int, default 0 | cached, recomputed on rating change/freeze |
| created_at | timestamp | |

## idea_looking_for
| Column | Type | Notes |
|---|---|---|
| idea_id | FK ideas | |
| skill_id | FK skills | |

## idea_images
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| idea_id | FK ideas | |
| user_id | FK users | uploader |
| image_url | text | stored in Cloudflare R2 |
| created_at | timestamp | |

## saved_ideas
| Column | Type | Notes |
|---|---|---|
| user_id | FK users | |
| idea_id | FK ideas | |
| created_at | timestamp | |

## groups
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| idea_id | FK ideas, unique | strict 1-to-1 with idea |

## group_members
| Column | Type | Notes |
|---|---|---|
| group_id | FK groups | |
| user_id | FK users | |
| joined_at | timestamp | used for rating tenure gate |
| left_at | timestamp, nullable | used for rating freeze-on-exit |

## group_messages
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| group_id | FK groups | |
| user_id | FK users | |
| content | text | |
| image_url | text, nullable | stored in Cloudflare R2 |
| created_at | timestamp | |

## join_requests
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| idea_id | FK ideas | |
| user_id | FK users | requester |
| status | enum(pending, accepted, rejected) | |
| created_at | timestamp | |

## idea_comments
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| idea_id | FK ideas | |
| user_id | FK users | |
| parent_comment_id | FK idea_comments, nullable | self-reference; NULL = top-level, set = reply |
| content | text | |
| image_url | text, nullable | |
| created_at | timestamp | |

## ratings
| Column | Type | Notes |
|---|---|---|
| idea_id | FK ideas | |
| user_id | FK users | |
| value | int | |
| updated_at | timestamp | changeable while member; unique on (idea_id, user_id) |

## contributions
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| idea_id | FK ideas | |
| user_id | FK users | |
| content | text | |
| link | text, nullable | |
| status | enum(pending, approved, rejected) | |
| created_at | timestamp | |

## communities
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | display name, from first submission |
| email_domain | text, unique | actual identity key, not the name |
| created_at | timestamp | |

## community_members
| Column | Type | Notes |
|---|---|---|
| community_id | FK communities | |
| user_id | FK users | |
| joined_at | timestamp | permanent membership, no expiry |

*Note: OTP codes themselves are NOT stored in Postgres — they live in Redis with a short TTL (`otp:{email}` key, expires in minutes). A `community_members` row only exists once OTP verification succeeds, so its existence is the record of "this user is verified for this community."*

## community_bans
| Column | Type | Notes |
|---|---|---|
| community_id | FK communities | |
| user_id | FK users | |
| banned_until | timestamp | |
| reason | text | |

## reports
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| reporter_id | FK users | |
| target_type | enum(idea, user, community) | |
| target_id | uuid | polymorphic reference |
| community_id | FK communities, nullable | filled only when source = community |
| reason | text | |
| classification | text, nullable | NLP-assigned category |
| status | enum(pending, reviewed) | |
| resolution | text, nullable | |
| created_at | timestamp | |

## Relationships Summary
- User 1—N Ideas (owner)
- User N—N Skills (via user_skills)
- User N—N Users (via follows)
- Idea N—N Skills (via idea_looking_for)
- Idea 1—N idea_images
- Idea 1—1 Group
- Group N—N Users (via group_members)
- Group 1—N group_messages
- Idea 1—N idea_comments (self-referencing via parent_comment_id for replies)
- Idea N—N Users (via ratings, contributions)
- Idea 1—N Idea (self-reference, forked_from_id)
- Idea N—1 Community (nullable — see assumption above)
- User N—N Communities (via community_members)
- Community 1—N community_bans
- User/Idea/Community 1—N reports (polymorphic via target_type/target_id)