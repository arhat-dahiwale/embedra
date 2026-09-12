"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reports = exports.groupMessages = exports.groupMembers = exports.groups = exports.savedIdeas = exports.joinRequests = exports.contributions = exports.ratings = exports.ideaComments = exports.ideaImages = exports.ideaLookingFor = exports.ideas = exports.communityBans = exports.communityMembers = exports.communities = exports.follows = exports.userSkills = exports.domains = exports.skills = exports.users = exports.reportStatusEnum = exports.reportTargetEnum = exports.joinRequestStatusEnum = exports.contributionStatusEnum = exports.ideaStatusEnum = exports.accessTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// ---------- ENUMS ----------
exports.accessTypeEnum = (0, pg_core_1.pgEnum)("access_type", ["open_open", "open_closed", "closed"]);
exports.ideaStatusEnum = (0, pg_core_1.pgEnum)("idea_status", ["open", "closed"]);
exports.contributionStatusEnum = (0, pg_core_1.pgEnum)("contribution_status", ["pending", "approved", "rejected"]);
exports.joinRequestStatusEnum = (0, pg_core_1.pgEnum)("join_request_status", ["pending", "accepted", "rejected"]);
exports.reportTargetEnum = (0, pg_core_1.pgEnum)("report_target_type", ["idea", "user", "community"]);
exports.reportStatusEnum = (0, pg_core_1.pgEnum)("report_status", ["pending", "reviewed"]);
// ---------- USERS ----------
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    bio: (0, pg_core_1.text)("bio"),
    profilePicUrl: (0, pg_core_1.text)("profile_pic_url"),
    socials: (0, pg_core_1.jsonb)("socials"),
    projectLinks: (0, pg_core_1.jsonb)("project_links"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ---------- SKILLS / DOMAINS (fixed lookups) ----------
exports.skills = (0, pg_core_1.pgTable)("skills", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)("name").notNull().unique(),
});
exports.domains = (0, pg_core_1.pgTable)("domains", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)("name").notNull().unique(),
});
// ---------- JOIN TABLES: user_skills, follows ----------
exports.userSkills = (0, pg_core_1.pgTable)("user_skills", {
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    skillId: (0, pg_core_1.uuid)("skill_id").notNull().references(() => exports.skills.id),
});
exports.follows = (0, pg_core_1.pgTable)("follows", {
    followerId: (0, pg_core_1.uuid)("follower_id").notNull().references(() => exports.users.id),
    followingId: (0, pg_core_1.uuid)("following_id").notNull().references(() => exports.users.id),
});
// ---------- COMMUNITIES ----------
exports.communities = (0, pg_core_1.pgTable)("communities", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    emailDomain: (0, pg_core_1.text)("email_domain").notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.communityMembers = (0, pg_core_1.pgTable)("community_members", {
    communityId: (0, pg_core_1.uuid)("community_id").notNull().references(() => exports.communities.id),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    joinedAt: (0, pg_core_1.timestamp)("joined_at").defaultNow().notNull(),
});
exports.communityBans = (0, pg_core_1.pgTable)("community_bans", {
    communityId: (0, pg_core_1.uuid)("community_id").notNull().references(() => exports.communities.id),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    bannedUntil: (0, pg_core_1.timestamp)("banned_until").notNull(),
    reason: (0, pg_core_1.text)("reason"),
});
// ---------- IDEAS ----------
exports.ideas = (0, pg_core_1.pgTable)("ideas", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    ownerId: (0, pg_core_1.uuid)("owner_id").notNull().references(() => exports.users.id),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    domainId: (0, pg_core_1.uuid)("domain_id").notNull().references(() => exports.domains.id),
    communityId: (0, pg_core_1.uuid)("community_id").references(() => exports.communities.id), // nullable = global
    accessType: (0, exports.accessTypeEnum)("access_type").notNull(),
    status: (0, exports.ideaStatusEnum)("status").default("open").notNull(),
    embedding: (0, pg_core_1.vector)("embedding", { dimensions: 384 }), // matches all-MiniLM-L6-v2
    forkedFromId: (0, pg_core_1.uuid)("forked_from_id").references(() => exports.ideas.id),
    inviteToken: (0, pg_core_1.text)("invite_token").unique(),
    avgRating: (0, pg_core_1.numeric)("avg_rating"),
    ratingCount: (0, pg_core_1.integer)("rating_count").default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.ideaLookingFor = (0, pg_core_1.pgTable)("idea_looking_for", {
    ideaId: (0, pg_core_1.uuid)("idea_id").notNull().references(() => exports.ideas.id),
    skillId: (0, pg_core_1.uuid)("skill_id").notNull().references(() => exports.skills.id),
});
exports.ideaImages = (0, pg_core_1.pgTable)("idea_images", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    ideaId: (0, pg_core_1.uuid)("idea_id").notNull().references(() => exports.ideas.id),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    imageUrl: (0, pg_core_1.text)("image_url").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.ideaComments = (0, pg_core_1.pgTable)("idea_comments", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    ideaId: (0, pg_core_1.uuid)("idea_id").notNull().references(() => exports.ideas.id),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    parentCommentId: (0, pg_core_1.uuid)("parent_comment_id").references(() => exports.ideaComments.id),
    content: (0, pg_core_1.text)("content").notNull(),
    imageUrl: (0, pg_core_1.text)("image_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.ratings = (0, pg_core_1.pgTable)("ratings", {
    ideaId: (0, pg_core_1.uuid)("idea_id").notNull().references(() => exports.ideas.id),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    value: (0, pg_core_1.integer)("value").notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (t) => ({
    uniqIdeaUser: (0, pg_core_1.unique)().on(t.ideaId, t.userId),
}));
exports.contributions = (0, pg_core_1.pgTable)("contributions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    ideaId: (0, pg_core_1.uuid)("idea_id").notNull().references(() => exports.ideas.id),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    content: (0, pg_core_1.text)("content").notNull(),
    link: (0, pg_core_1.text)("link"),
    status: (0, exports.contributionStatusEnum)("status").default("pending").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.joinRequests = (0, pg_core_1.pgTable)("join_requests", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    ideaId: (0, pg_core_1.uuid)("idea_id").notNull().references(() => exports.ideas.id),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    status: (0, exports.joinRequestStatusEnum)("status").default("pending").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.savedIdeas = (0, pg_core_1.pgTable)("saved_ideas", {
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    ideaId: (0, pg_core_1.uuid)("idea_id").notNull().references(() => exports.ideas.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ---------- GROUPS ----------
exports.groups = (0, pg_core_1.pgTable)("groups", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    ideaId: (0, pg_core_1.uuid)("idea_id").notNull().unique().references(() => exports.ideas.id),
});
exports.groupMembers = (0, pg_core_1.pgTable)("group_members", {
    groupId: (0, pg_core_1.uuid)("group_id").notNull().references(() => exports.groups.id),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    joinedAt: (0, pg_core_1.timestamp)("joined_at").defaultNow().notNull(),
    leftAt: (0, pg_core_1.timestamp)("left_at"),
});
exports.groupMessages = (0, pg_core_1.pgTable)("group_messages", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    groupId: (0, pg_core_1.uuid)("group_id").notNull().references(() => exports.groups.id),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(() => exports.users.id),
    content: (0, pg_core_1.text)("content").notNull(),
    imageUrl: (0, pg_core_1.text)("image_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ---------- REPORTS ----------
exports.reports = (0, pg_core_1.pgTable)("reports", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    reporterId: (0, pg_core_1.uuid)("reporter_id").notNull().references(() => exports.users.id),
    targetType: (0, exports.reportTargetEnum)("target_type").notNull(),
    targetId: (0, pg_core_1.uuid)("target_id").notNull(),
    communityId: (0, pg_core_1.uuid)("community_id").references(() => exports.communities.id),
    reason: (0, pg_core_1.text)("reason").notNull(),
    classification: (0, pg_core_1.text)("classification"),
    status: (0, exports.reportStatusEnum)("status").default("pending").notNull(),
    resolution: (0, pg_core_1.text)("resolution"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
