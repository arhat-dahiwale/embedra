"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedMessagesResponseSchema = exports.groupMessageResponseSchema = exports.createMessageSchema = exports.paginatedGroupMembersResponseSchema = exports.groupResponseSchema = exports.groupMemberResponseSchema = exports.addMemberSchema = exports.paginatedJoinRequestsResponseSchema = exports.processJoinRequestSchema = exports.joinRequestResponseSchema = exports.joinRequestStatusEnumSchema = exports.lookingForSkillResponseSchema = exports.addLookingForSchema = exports.ideaResponseSchema = exports.updateIdeaSchema = exports.createIdeaSchema = exports.ideaStatusEnumSchema = exports.accessTypeEnumSchema = exports.skillSchema = exports.domainSchema = exports.authResponseSchema = exports.userResponseSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
// ---------- AUTH SCHEMAS ----------
exports.signupSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be at most 30 characters"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.userResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    username: zod_1.z.string(),
    email: zod_1.z.string().email(),
    bio: zod_1.z.string().nullable().optional(),
    profilePicUrl: zod_1.z.string().nullable().optional(),
    socials: zod_1.z.unknown().nullable().optional(),
    projectLinks: zod_1.z.unknown().nullable().optional(),
    createdAt: zod_1.z.date().or(zod_1.z.string()),
});
exports.authResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    user: exports.userResponseSchema,
});
// ---------- DOMAIN & SKILL SCHEMAS ----------
exports.domainSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
});
exports.skillSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
});
// ---------- IDEA SCHEMAS ----------
exports.accessTypeEnumSchema = zod_1.z.enum(["open_open", "open_closed", "closed"]);
exports.ideaStatusEnumSchema = zod_1.z.enum(["open", "closed"]);
exports.createIdeaSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters").max(120, "Title must be at most 120 characters"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters"),
    domainId: zod_1.z.string().uuid("Invalid domain ID"),
    accessType: exports.accessTypeEnumSchema,
    status: exports.ideaStatusEnumSchema.optional().default("open"),
    communityId: zod_1.z.string().uuid().optional().nullable(),
});
exports.updateIdeaSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters").max(120, "Title must be at most 120 characters").optional(),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters").optional(),
    domainId: zod_1.z.string().uuid("Invalid domain ID").optional(),
    accessType: exports.accessTypeEnumSchema.optional(),
    status: exports.ideaStatusEnumSchema.optional(),
});
exports.ideaResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    ownerId: zod_1.z.string().uuid(),
    ownerUsername: zod_1.z.string().optional(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    domainId: zod_1.z.string().uuid(),
    domainName: zod_1.z.string().optional(),
    communityId: zod_1.z.string().uuid().nullable().optional(),
    accessType: exports.accessTypeEnumSchema,
    status: exports.ideaStatusEnumSchema,
    forkedFromId: zod_1.z.string().uuid().nullable().optional(),
    avgRating: zod_1.z.string().nullable().optional(),
    ratingCount: zod_1.z.number().optional(),
    groupId: zod_1.z.string().uuid().optional(),
    memberCount: zod_1.z.number().optional(),
    lookingFor: zod_1.z.array(zod_1.z.object({
        skillId: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
    })).optional(),
    inviteToken: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.date().or(zod_1.z.string()),
});
// ---------- LOOKING-FOR SCHEMAS ----------
exports.addLookingForSchema = zod_1.z.object({
    skillId: zod_1.z.string().uuid("Invalid skill ID"),
});
exports.lookingForSkillResponseSchema = zod_1.z.object({
    skillId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
});
// ---------- JOIN REQUEST SCHEMAS ----------
exports.joinRequestStatusEnumSchema = zod_1.z.enum(["pending", "accepted", "rejected"]);
exports.joinRequestResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    ideaId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    username: zod_1.z.string().optional(),
    status: exports.joinRequestStatusEnumSchema,
    createdAt: zod_1.z.date().or(zod_1.z.string()),
});
exports.processJoinRequestSchema = zod_1.z.object({
    action: zod_1.z.enum(["accept", "reject"]),
});
exports.paginatedJoinRequestsResponseSchema = zod_1.z.object({
    requests: zod_1.z.array(exports.joinRequestResponseSchema),
    nextCursor: zod_1.z.string().nullable(),
});
// ---------- GROUP & MEMBER SCHEMAS ----------
exports.addMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid user ID"),
});
exports.groupMemberResponseSchema = zod_1.z.object({
    groupId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    username: zod_1.z.string().optional(),
    profilePicUrl: zod_1.z.string().nullable().optional(),
    joinedAt: zod_1.z.date().or(zod_1.z.string()),
    leftAt: zod_1.z.date().or(zod_1.z.string()).nullable().optional(),
});
exports.groupResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    ideaId: zod_1.z.string().uuid(),
    ideaTitle: zod_1.z.string().optional(),
    memberCount: zod_1.z.number(),
});
exports.paginatedGroupMembersResponseSchema = zod_1.z.object({
    members: zod_1.z.array(exports.groupMemberResponseSchema),
    nextCursor: zod_1.z.string().nullable(),
});
// ---------- GROUP MESSAGE SCHEMAS ----------
exports.createMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Message content cannot be empty"),
    imageUrl: zod_1.z.string().url("Invalid image URL").optional().nullable(),
});
exports.groupMessageResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    username: zod_1.z.string().optional(),
    profilePicUrl: zod_1.z.string().nullable().optional(),
    content: zod_1.z.string(),
    imageUrl: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.date().or(zod_1.z.string()),
});
exports.paginatedMessagesResponseSchema = zod_1.z.object({
    messages: zod_1.z.array(exports.groupMessageResponseSchema),
    nextCursor: zod_1.z.string().nullable(),
});
