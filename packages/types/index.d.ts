import { z } from "zod";
export declare const signupSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
}, {
    username: string;
    email: string;
    password: string;
}>;
export type SignupInput = z.infer<typeof signupSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const userResponseSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    profilePicUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    socials: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
    projectLinks: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    id: string;
    createdAt: string | Date;
    bio?: string | null | undefined;
    profilePicUrl?: string | null | undefined;
    socials?: unknown;
    projectLinks?: unknown;
}, {
    username: string;
    email: string;
    id: string;
    createdAt: string | Date;
    bio?: string | null | undefined;
    profilePicUrl?: string | null | undefined;
    socials?: unknown;
    projectLinks?: unknown;
}>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export declare const authResponseSchema: z.ZodObject<{
    token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        email: z.ZodString;
        bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        profilePicUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        socials: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
        projectLinks: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        email: string;
        id: string;
        createdAt: string | Date;
        bio?: string | null | undefined;
        profilePicUrl?: string | null | undefined;
        socials?: unknown;
        projectLinks?: unknown;
    }, {
        username: string;
        email: string;
        id: string;
        createdAt: string | Date;
        bio?: string | null | undefined;
        profilePicUrl?: string | null | undefined;
        socials?: unknown;
        projectLinks?: unknown;
    }>;
}, "strip", z.ZodTypeAny, {
    token: string;
    user: {
        username: string;
        email: string;
        id: string;
        createdAt: string | Date;
        bio?: string | null | undefined;
        profilePicUrl?: string | null | undefined;
        socials?: unknown;
        projectLinks?: unknown;
    };
}, {
    token: string;
    user: {
        username: string;
        email: string;
        id: string;
        createdAt: string | Date;
        bio?: string | null | undefined;
        profilePicUrl?: string | null | undefined;
        socials?: unknown;
        projectLinks?: unknown;
    };
}>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export declare const domainSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
}, {
    id: string;
    name: string;
}>;
export type Domain = z.infer<typeof domainSchema>;
export declare const skillSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
}, {
    id: string;
    name: string;
}>;
export type Skill = z.infer<typeof skillSchema>;
export declare const accessTypeEnumSchema: z.ZodEnum<["open_open", "open_closed", "closed"]>;
export declare const ideaStatusEnumSchema: z.ZodEnum<["open", "closed"]>;
export declare const createIdeaSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    domainId: z.ZodString;
    accessType: z.ZodEnum<["open_open", "open_closed", "closed"]>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["open", "closed"]>>>;
    communityId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "closed" | "open";
    title: string;
    description: string;
    domainId: string;
    accessType: "open_open" | "open_closed" | "closed";
    communityId?: string | null | undefined;
}, {
    title: string;
    description: string;
    domainId: string;
    accessType: "open_open" | "open_closed" | "closed";
    status?: "closed" | "open" | undefined;
    communityId?: string | null | undefined;
}>;
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export declare const updateIdeaSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    domainId: z.ZodOptional<z.ZodString>;
    accessType: z.ZodOptional<z.ZodEnum<["open_open", "open_closed", "closed"]>>;
    status: z.ZodOptional<z.ZodEnum<["open", "closed"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "closed" | "open" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    domainId?: string | undefined;
    accessType?: "open_open" | "open_closed" | "closed" | undefined;
}, {
    status?: "closed" | "open" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    domainId?: string | undefined;
    accessType?: "open_open" | "open_closed" | "closed" | undefined;
}>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export declare const ideaResponseSchema: z.ZodObject<{
    id: z.ZodString;
    ownerId: z.ZodString;
    ownerUsername: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodString;
    domainId: z.ZodString;
    domainName: z.ZodOptional<z.ZodString>;
    communityId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    accessType: z.ZodEnum<["open_open", "open_closed", "closed"]>;
    status: z.ZodEnum<["open", "closed"]>;
    forkedFromId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avgRating: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ratingCount: z.ZodOptional<z.ZodNumber>;
    groupId: z.ZodOptional<z.ZodString>;
    memberCount: z.ZodOptional<z.ZodNumber>;
    lookingFor: z.ZodOptional<z.ZodArray<z.ZodObject<{
        skillId: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        skillId: string;
    }, {
        name: string;
        skillId: string;
    }>, "many">>;
    inviteToken: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    status: "closed" | "open";
    id: string;
    createdAt: string | Date;
    title: string;
    description: string;
    domainId: string;
    accessType: "open_open" | "open_closed" | "closed";
    ownerId: string;
    communityId?: string | null | undefined;
    ownerUsername?: string | undefined;
    domainName?: string | undefined;
    forkedFromId?: string | null | undefined;
    avgRating?: string | null | undefined;
    ratingCount?: number | undefined;
    groupId?: string | undefined;
    memberCount?: number | undefined;
    lookingFor?: {
        name: string;
        skillId: string;
    }[] | undefined;
    inviteToken?: string | null | undefined;
}, {
    status: "closed" | "open";
    id: string;
    createdAt: string | Date;
    title: string;
    description: string;
    domainId: string;
    accessType: "open_open" | "open_closed" | "closed";
    ownerId: string;
    communityId?: string | null | undefined;
    ownerUsername?: string | undefined;
    domainName?: string | undefined;
    forkedFromId?: string | null | undefined;
    avgRating?: string | null | undefined;
    ratingCount?: number | undefined;
    groupId?: string | undefined;
    memberCount?: number | undefined;
    lookingFor?: {
        name: string;
        skillId: string;
    }[] | undefined;
    inviteToken?: string | null | undefined;
}>;
export type IdeaResponse = z.infer<typeof ideaResponseSchema>;
export declare const addLookingForSchema: z.ZodObject<{
    skillId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    skillId: string;
}, {
    skillId: string;
}>;
export type AddLookingForInput = z.infer<typeof addLookingForSchema>;
export declare const lookingForSkillResponseSchema: z.ZodObject<{
    skillId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    skillId: string;
}, {
    name: string;
    skillId: string;
}>;
export type LookingForSkillResponse = z.infer<typeof lookingForSkillResponseSchema>;
export declare const joinRequestStatusEnumSchema: z.ZodEnum<["pending", "accepted", "rejected"]>;
export declare const joinRequestResponseSchema: z.ZodObject<{
    id: z.ZodString;
    ideaId: z.ZodString;
    userId: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["pending", "accepted", "rejected"]>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "accepted" | "rejected";
    id: string;
    createdAt: string | Date;
    ideaId: string;
    userId: string;
    username?: string | undefined;
}, {
    status: "pending" | "accepted" | "rejected";
    id: string;
    createdAt: string | Date;
    ideaId: string;
    userId: string;
    username?: string | undefined;
}>;
export type JoinRequestResponse = z.infer<typeof joinRequestResponseSchema>;
export declare const processJoinRequestSchema: z.ZodObject<{
    action: z.ZodEnum<["accept", "reject"]>;
}, "strip", z.ZodTypeAny, {
    action: "accept" | "reject";
}, {
    action: "accept" | "reject";
}>;
export type ProcessJoinRequestInput = z.infer<typeof processJoinRequestSchema>;
export declare const paginatedJoinRequestsResponseSchema: z.ZodObject<{
    requests: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        ideaId: z.ZodString;
        userId: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<["pending", "accepted", "rejected"]>;
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "accepted" | "rejected";
        id: string;
        createdAt: string | Date;
        ideaId: string;
        userId: string;
        username?: string | undefined;
    }, {
        status: "pending" | "accepted" | "rejected";
        id: string;
        createdAt: string | Date;
        ideaId: string;
        userId: string;
        username?: string | undefined;
    }>, "many">;
    nextCursor: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    requests: {
        status: "pending" | "accepted" | "rejected";
        id: string;
        createdAt: string | Date;
        ideaId: string;
        userId: string;
        username?: string | undefined;
    }[];
    nextCursor: string | null;
}, {
    requests: {
        status: "pending" | "accepted" | "rejected";
        id: string;
        createdAt: string | Date;
        ideaId: string;
        userId: string;
        username?: string | undefined;
    }[];
    nextCursor: string | null;
}>;
export type PaginatedJoinRequestsResponse = z.infer<typeof paginatedJoinRequestsResponseSchema>;
export declare const addMemberSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export declare const groupMemberResponseSchema: z.ZodObject<{
    groupId: z.ZodString;
    userId: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    profilePicUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    joinedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    leftAt: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>>;
}, "strip", z.ZodTypeAny, {
    groupId: string;
    userId: string;
    joinedAt: string | Date;
    username?: string | undefined;
    profilePicUrl?: string | null | undefined;
    leftAt?: string | Date | null | undefined;
}, {
    groupId: string;
    userId: string;
    joinedAt: string | Date;
    username?: string | undefined;
    profilePicUrl?: string | null | undefined;
    leftAt?: string | Date | null | undefined;
}>;
export type GroupMemberResponse = z.infer<typeof groupMemberResponseSchema>;
export declare const groupResponseSchema: z.ZodObject<{
    id: z.ZodString;
    ideaId: z.ZodString;
    ideaTitle: z.ZodOptional<z.ZodString>;
    memberCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    memberCount: number;
    ideaId: string;
    ideaTitle?: string | undefined;
}, {
    id: string;
    memberCount: number;
    ideaId: string;
    ideaTitle?: string | undefined;
}>;
export type GroupResponse = z.infer<typeof groupResponseSchema>;
export declare const paginatedGroupMembersResponseSchema: z.ZodObject<{
    members: z.ZodArray<z.ZodObject<{
        groupId: z.ZodString;
        userId: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
        profilePicUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        joinedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
        leftAt: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>>;
    }, "strip", z.ZodTypeAny, {
        groupId: string;
        userId: string;
        joinedAt: string | Date;
        username?: string | undefined;
        profilePicUrl?: string | null | undefined;
        leftAt?: string | Date | null | undefined;
    }, {
        groupId: string;
        userId: string;
        joinedAt: string | Date;
        username?: string | undefined;
        profilePicUrl?: string | null | undefined;
        leftAt?: string | Date | null | undefined;
    }>, "many">;
    nextCursor: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nextCursor: string | null;
    members: {
        groupId: string;
        userId: string;
        joinedAt: string | Date;
        username?: string | undefined;
        profilePicUrl?: string | null | undefined;
        leftAt?: string | Date | null | undefined;
    }[];
}, {
    nextCursor: string | null;
    members: {
        groupId: string;
        userId: string;
        joinedAt: string | Date;
        username?: string | undefined;
        profilePicUrl?: string | null | undefined;
        leftAt?: string | Date | null | undefined;
    }[];
}>;
export type PaginatedGroupMembersResponse = z.infer<typeof paginatedGroupMembersResponseSchema>;
export declare const createMessageSchema: z.ZodObject<{
    content: z.ZodString;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    imageUrl?: string | null | undefined;
}, {
    content: string;
    imageUrl?: string | null | undefined;
}>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export declare const groupMessageResponseSchema: z.ZodObject<{
    id: z.ZodString;
    groupId: z.ZodString;
    userId: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    profilePicUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    groupId: string;
    userId: string;
    content: string;
    username?: string | undefined;
    profilePicUrl?: string | null | undefined;
    imageUrl?: string | null | undefined;
}, {
    id: string;
    createdAt: string | Date;
    groupId: string;
    userId: string;
    content: string;
    username?: string | undefined;
    profilePicUrl?: string | null | undefined;
    imageUrl?: string | null | undefined;
}>;
export type GroupMessageResponse = z.infer<typeof groupMessageResponseSchema>;
export declare const paginatedMessagesResponseSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        groupId: z.ZodString;
        userId: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
        profilePicUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        content: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string | Date;
        groupId: string;
        userId: string;
        content: string;
        username?: string | undefined;
        profilePicUrl?: string | null | undefined;
        imageUrl?: string | null | undefined;
    }, {
        id: string;
        createdAt: string | Date;
        groupId: string;
        userId: string;
        content: string;
        username?: string | undefined;
        profilePicUrl?: string | null | undefined;
        imageUrl?: string | null | undefined;
    }>, "many">;
    nextCursor: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nextCursor: string | null;
    messages: {
        id: string;
        createdAt: string | Date;
        groupId: string;
        userId: string;
        content: string;
        username?: string | undefined;
        profilePicUrl?: string | null | undefined;
        imageUrl?: string | null | undefined;
    }[];
}, {
    nextCursor: string | null;
    messages: {
        id: string;
        createdAt: string | Date;
        groupId: string;
        userId: string;
        content: string;
        username?: string | undefined;
        profilePicUrl?: string | null | undefined;
        imageUrl?: string | null | undefined;
    }[];
}>;
export type PaginatedMessagesResponse = z.infer<typeof paginatedMessagesResponseSchema>;
