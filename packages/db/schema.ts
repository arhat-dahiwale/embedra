import { pgTable, uuid, text, timestamp, integer, numeric, jsonb, AnyPgColumn, vector, pgEnum, unique } from "drizzle-orm/pg-core";

// ---------- ENUMS ----------
export const accessTypeEnum = pgEnum("access_type", ["open_open", "open_closed", "closed"]);
export const ideaStatusEnum = pgEnum("idea_status", ["open", "closed"]);
export const contributionStatusEnum = pgEnum("contribution_status", ["pending", "approved", "rejected"]);
export const joinRequestStatusEnum = pgEnum("join_request_status", ["pending", "accepted", "rejected"]);
export const reportTargetEnum = pgEnum("report_target_type", ["idea", "user", "community"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed"]);

// ---------- USERS ----------
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    bio: text("bio"),
    profilePicUrl: text("profile_pic_url"),
    socials: jsonb("socials"),
    projectLinks: jsonb("project_links"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- SKILLS / DOMAINS (fixed lookups) ----------
export const skills = pgTable("skills", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
});

export const domains = pgTable("domains", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
});

// ---------- JOIN TABLES: user_skills, follows ----------
export const userSkills = pgTable("user_skills", {
    userId: uuid("user_id").notNull().references(() => users.id),
    skillId: uuid("skill_id").notNull().references(() => skills.id),
});

export const follows = pgTable("follows", {
    followerId: uuid("follower_id").notNull().references(() => users.id),
    followingId: uuid("following_id").notNull().references(() => users.id),
});

// ---------- COMMUNITIES ----------
export const communities = pgTable("communities", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    emailDomain: text("email_domain").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityMembers = pgTable("community_members", {
    communityId: uuid("community_id").notNull().references(() => communities.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const communityBans = pgTable("community_bans", {
    communityId: uuid("community_id").notNull().references(() => communities.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    bannedUntil: timestamp("banned_until").notNull(),
    reason: text("reason"),
});

// ---------- IDEAS ----------
export const ideas = pgTable("ideas", {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    domainId: uuid("domain_id").notNull().references(() => domains.id),
    communityId: uuid("community_id").references(() => communities.id), // nullable = global
    accessType: accessTypeEnum("access_type").notNull(),
    status: ideaStatusEnum("status").default("open").notNull(),
    embedding: vector("embedding", { dimensions: 384 }), // matches all-MiniLM-L6-v2
    forkedFromId: uuid("forked_from_id").references((): AnyPgColumn => ideas.id),
    inviteToken: text("invite_token").unique(),
    avgRating: numeric("avg_rating"),
    ratingCount: integer("rating_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ideaLookingFor = pgTable("idea_looking_for", {
    ideaId: uuid("idea_id").notNull().references(() => ideas.id),
    skillId: uuid("skill_id").notNull().references(() => skills.id),
});

export const ideaImages = pgTable("idea_images", {
    id: uuid("id").defaultRandom().primaryKey(),
    ideaId: uuid("idea_id").notNull().references(() => ideas.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ideaComments = pgTable("idea_comments", {
    id: uuid("id").defaultRandom().primaryKey(),
    ideaId: uuid("idea_id").notNull().references(() => ideas.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    parentCommentId: uuid("parent_comment_id").references((): AnyPgColumn => ideaComments.id),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
    ideaId: uuid("idea_id").notNull().references(() => ideas.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    value: integer("value").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
    uniqIdeaUser: unique().on(t.ideaId, t.userId),
}));

export const contributions = pgTable("contributions", {
    id: uuid("id").defaultRandom().primaryKey(),
    ideaId: uuid("idea_id").notNull().references(() => ideas.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    link: text("link"),
    status: contributionStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const joinRequests = pgTable("join_requests", {
    id: uuid("id").defaultRandom().primaryKey(),
    ideaId: uuid("idea_id").notNull().references(() => ideas.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    status: joinRequestStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savedIdeas = pgTable("saved_ideas", {
    userId: uuid("user_id").notNull().references(() => users.id),
    ideaId: uuid("idea_id").notNull().references(() => ideas.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- GROUPS ----------
export const groups = pgTable("groups", {
    id: uuid("id").defaultRandom().primaryKey(),
    ideaId: uuid("idea_id").notNull().unique().references(() => ideas.id),
});

export const groupMembers = pgTable("group_members", {
    groupId: uuid("group_id").notNull().references(() => groups.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
});

export const groupMessages = pgTable("group_messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id").notNull().references(() => groups.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- REPORTS ----------
export const reports = pgTable("reports", {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id").notNull().references(() => users.id),
    targetType: reportTargetEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    communityId: uuid("community_id").references(() => communities.id),
    reason: text("reason").notNull(),
    classification: text("classification"),
    status: reportStatusEnum("status").default("pending").notNull(),
    resolution: text("resolution"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});