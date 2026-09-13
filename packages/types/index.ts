import { z } from "zod";

// ---------- AUTH SCHEMAS ----------
export const signupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be at most 30 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const userResponseSchema = z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    bio: z.string().nullable().optional(),
    profilePicUrl: z.string().nullable().optional(),
    socials: z.unknown().nullable().optional(),
    projectLinks: z.unknown().nullable().optional(),
    createdAt: z.date().or(z.string()),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const authResponseSchema = z.object({
    token: z.string(),
    user: userResponseSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// ---------- DOMAIN & SKILL SCHEMAS ----------
export const domainSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
});
export type Domain = z.infer<typeof domainSchema>;

export const skillSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
});
export type Skill = z.infer<typeof skillSchema>;

// ---------- IDEA SCHEMAS ----------
export const accessTypeEnumSchema = z.enum(["open_open", "open_closed", "closed"]);
export const ideaStatusEnumSchema = z.enum(["open", "closed"]);

export const createIdeaSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title must be at most 120 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    domainId: z.string().uuid("Invalid domain ID"),
    accessType: accessTypeEnumSchema,
    status: ideaStatusEnumSchema.optional().default("open"),
    communityId: z.string().uuid().optional().nullable(),
});
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;

export const updateIdeaSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title must be at most 120 characters").optional(),
    description: z.string().min(10, "Description must be at least 10 characters").optional(),
    domainId: z.string().uuid("Invalid domain ID").optional(),
    accessType: accessTypeEnumSchema.optional(),
    status: ideaStatusEnumSchema.optional(),
});
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;

export const ideaResponseSchema = z.object({
    id: z.string().uuid(),
    ownerId: z.string().uuid(),
    ownerUsername: z.string().optional(),
    title: z.string(),
    description: z.string(),
    domainId: z.string().uuid(),
    domainName: z.string().optional(),
    communityId: z.string().uuid().nullable().optional(),
    accessType: accessTypeEnumSchema,
    status: ideaStatusEnumSchema,
    forkedFromId: z.string().uuid().nullable().optional(),
    avgRating: z.string().nullable().optional(),
    ratingCount: z.number().optional(),
    groupId: z.string().uuid().optional(),
    memberCount: z.number().optional(),
    lookingFor: z.array(
        z.object({
            skillId: z.string().uuid(),
            name: z.string(),
        })
    ).optional(),
    inviteToken: z.string().nullable().optional(),
    createdAt: z.date().or(z.string()),
});
export type IdeaResponse = z.infer<typeof ideaResponseSchema>;

// ---------- LOOKING-FOR SCHEMAS ----------
export const addLookingForSchema = z.object({
    skillId: z.string().uuid("Invalid skill ID"),
});
export type AddLookingForInput = z.infer<typeof addLookingForSchema>;

export const lookingForSkillResponseSchema = z.object({
    skillId: z.string().uuid(),
    name: z.string(),
});
export type LookingForSkillResponse = z.infer<typeof lookingForSkillResponseSchema>;

// ---------- JOIN REQUEST SCHEMAS ----------
export const joinRequestStatusEnumSchema = z.enum(["pending", "accepted", "rejected"]);

export const joinRequestResponseSchema = z.object({
    id: z.string().uuid(),
    ideaId: z.string().uuid(),
    userId: z.string().uuid(),
    username: z.string().optional(),
    status: joinRequestStatusEnumSchema,
    createdAt: z.date().or(z.string()),
});
export type JoinRequestResponse = z.infer<typeof joinRequestResponseSchema>;

export const processJoinRequestSchema = z.object({
    action: z.enum(["accept", "reject"]),
});
export type ProcessJoinRequestInput = z.infer<typeof processJoinRequestSchema>;

export const paginatedJoinRequestsResponseSchema = z.object({
    requests: z.array(joinRequestResponseSchema),
    nextCursor: z.string().nullable(),
});
export type PaginatedJoinRequestsResponse = z.infer<typeof paginatedJoinRequestsResponseSchema>;

// ---------- GROUP & MEMBER SCHEMAS ----------
export const addMemberSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const groupMemberResponseSchema = z.object({
    groupId: z.string().uuid(),
    userId: z.string().uuid(),
    username: z.string().optional(),
    profilePicUrl: z.string().nullable().optional(),
    joinedAt: z.date().or(z.string()),
    leftAt: z.date().or(z.string()).nullable().optional(),
});
export type GroupMemberResponse = z.infer<typeof groupMemberResponseSchema>;

export const groupResponseSchema = z.object({
    id: z.string().uuid(),
    ideaId: z.string().uuid(),
    ideaTitle: z.string().optional(),
    memberCount: z.number(),
});
export type GroupResponse = z.infer<typeof groupResponseSchema>;

export const paginatedGroupMembersResponseSchema = z.object({
    members: z.array(groupMemberResponseSchema),
    nextCursor: z.string().nullable(),
});
export type PaginatedGroupMembersResponse = z.infer<typeof paginatedGroupMembersResponseSchema>;

// ---------- GROUP MESSAGE SCHEMAS ----------
export const createMessageSchema = z.object({
    content: z.string().min(1, "Message content cannot be empty"),
    imageUrl: z.string().url("Invalid image URL").optional().nullable(),
});
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const groupMessageResponseSchema = z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    userId: z.string().uuid(),
    username: z.string().optional(),
    profilePicUrl: z.string().nullable().optional(),
    content: z.string(),
    imageUrl: z.string().nullable().optional(),
    createdAt: z.date().or(z.string()),
});
export type GroupMessageResponse = z.infer<typeof groupMessageResponseSchema>;

export const paginatedMessagesResponseSchema = z.object({
    messages: z.array(groupMessageResponseSchema),
    nextCursor: z.string().nullable(),
});
export type PaginatedMessagesResponse = z.infer<typeof paginatedMessagesResponseSchema>;

// ---------- RATING SCHEMAS ----------
export const submitRatingSchema = z.object({
    value: z.number().int("Rating must be an integer").min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
});
export type SubmitRatingInput = z.infer<typeof submitRatingSchema>;

export const ratingResponseSchema = z.object({
    ideaId: z.string().uuid(),
    userId: z.string().uuid(),
    value: z.number().int().min(1).max(5),
    updatedAt: z.date().or(z.string()),
    avgRating: z.number().nullable(),
    ratingCount: z.number().int(),
});
export type RatingResponse = z.infer<typeof ratingResponseSchema>;

export const ideaRatingSummarySchema = z.object({
    avgRating: z.number().nullable(),
    ratingCount: z.number().int(),
});
export type IdeaRatingSummary = z.infer<typeof ideaRatingSummarySchema>;

// ---------- CONTRIBUTION SCHEMAS ----------
export const contributionStatusEnumSchema = z.enum(["pending", "approved", "rejected"]);

export const submitContributionSchema = z.object({
    content: z.string().min(1, "Contribution content cannot be empty"),
    link: z.string().url("Invalid link URL").optional().nullable(),
});
export type SubmitContributionInput = z.infer<typeof submitContributionSchema>;

export const contributionResponseSchema = z.object({
    id: z.string().uuid(),
    ideaId: z.string().uuid(),
    userId: z.string().uuid(),
    username: z.string().optional(),
    content: z.string(),
    link: z.string().nullable().optional(),
    status: contributionStatusEnumSchema,
    createdAt: z.date().or(z.string()),
});
export type ContributionResponse = z.infer<typeof contributionResponseSchema>;

export const paginatedContributionsResponseSchema = z.object({
    contributions: z.array(contributionResponseSchema),
    nextCursor: z.string().nullable(),
});
export type PaginatedContributionsResponse = z.infer<typeof paginatedContributionsResponseSchema>;

// ---------- IDEA COMMENT SCHEMAS ----------
export const createCommentSchema = z.object({
    content: z.string().min(1, "Comment content cannot be empty"),
    parentCommentId: z.string().uuid("Invalid parent comment ID").optional().nullable(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const commentResponseSchema = z.object({
    id: z.string().uuid(),
    ideaId: z.string().uuid(),
    userId: z.string().uuid(),
    username: z.string().optional(),
    profilePicUrl: z.string().nullable().optional(),
    parentCommentId: z.string().uuid().nullable(),
    content: z.string(),
    imageUrl: z.string().nullable().optional(),
    createdAt: z.date().or(z.string()),
});
export type CommentResponse = z.infer<typeof commentResponseSchema>;

export const paginatedCommentsResponseSchema = z.object({
    comments: z.array(commentResponseSchema),
    nextCursor: z.string().nullable(),
});
export type PaginatedCommentsResponse = z.infer<typeof paginatedCommentsResponseSchema>;

