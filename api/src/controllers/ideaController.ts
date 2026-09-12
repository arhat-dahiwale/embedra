import { Response } from "express";
import { randomBytes } from "crypto";
import { db, ideas, groups, groupMembers, domains, users, joinRequests, groupMessages, skills, ideaLookingFor, eq, and, isNull, count, sql, lt, desc } from "../../../packages/db/index";
import {
    createIdeaSchema,
    updateIdeaSchema,
    processJoinRequestSchema,
    addLookingForSchema,
} from "../../../packages/types/index";
import { AuthenticatedRequest } from "../middleware/auth";

const generateInviteToken = (): string => randomBytes(32).toString("hex");

export const createIdea = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const parseResult = createIdeaSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const { title, description, domainId, accessType, status, communityId } = parseResult.data;

        // Verify domain exists
        const [domain] = await db.select().from(domains).where(eq(domains.id, domainId));
        if (!domain) {
            return res.status(400).json({ error: "Domain not found" });
        }

        // Insert Idea
        const [newIdea] = await db
            .insert(ideas)
            .values({
                ownerId: userId,
                title,
                description,
                domainId,
                accessType,
                status: status || "open",
                communityId: communityId || null,
                inviteToken: accessType === "open_closed" ? generateInviteToken() : null,
            })
            .returning();

        // Auto-create 1:1 Group alongside Idea
        const [newGroup] = await db
            .insert(groups)
            .values({
                ideaId: newIdea.id,
            })
            .returning();

        // Add owner as initial group member
        await db.insert(groupMembers).values({
            groupId: newGroup.id,
            userId: userId,
        });

        return res.status(201).json({
            idea: {
                ...newIdea,
                domainName: domain.name,
                groupId: newGroup.id,
                memberCount: 1,
            },
            group: newGroup,
        });
    } catch (err: any) {
        console.error("Create idea error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getIdeaById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        const [idea] = await db
            .select({
                id: ideas.id,
                ownerId: ideas.ownerId,
                title: ideas.title,
                description: ideas.description,
                domainId: ideas.domainId,
                communityId: ideas.communityId,
                accessType: ideas.accessType,
                status: ideas.status,
                forkedFromId: ideas.forkedFromId,
                avgRating: ideas.avgRating,
                ratingCount: ideas.ratingCount,
                inviteToken: ideas.inviteToken,
                createdAt: ideas.createdAt,
                ownerUsername: users.username,
                domainName: domains.name,
            })
            .from(ideas)
            .leftJoin(users, eq(ideas.ownerId, users.id))
            .leftJoin(domains, eq(ideas.domainId, domains.id))
            .where(eq(ideas.id, id));

        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        // Fetch associated group details
        const [group] = await db.select().from(groups).where(eq(groups.ideaId, idea.id));

        let memberCount = 0;
        if (group) {
            const [memberCountRes] = await db
                .select({ count: count() })
                .from(groupMembers)
                .where(and(eq(groupMembers.groupId, group.id), isNull(groupMembers.leftAt)));
            memberCount = Number(memberCountRes?.count || 0);
        }

        const lookingFor = await db
            .select({
                skillId: skills.id,
                name: skills.name,
            })
            .from(ideaLookingFor)
            .innerJoin(skills, eq(ideaLookingFor.skillId, skills.id))
            .where(eq(ideaLookingFor.ideaId, idea.id));

        const isOwner = req.user?.userId === idea.ownerId;

        const response: any = {
            ...idea,
            groupId: group?.id,
            memberCount,
            lookingFor,
        };

        if (isOwner) {
            response.inviteToken = idea.inviteToken;
        } else {
            delete response.inviteToken;
        }

        return res.status(200).json(response);
    } catch (err: any) {
        console.error("Get idea error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateIdea = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [existingIdea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!existingIdea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        if (existingIdea.ownerId !== userId) {
            return res.status(403).json({ error: "Only the idea owner can edit this idea" });
        }

        const parseResult = updateIdeaSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const updates = parseResult.data;

        if (updates.domainId) {
            const [domain] = await db.select().from(domains).where(eq(domains.id, updates.domainId));
            if (!domain) {
                return res.status(400).json({ error: "Domain not found" });
            }
        }

        const setValues: Record<string, any> = { ...updates };

        const newAccessType = updates.accessType ?? existingIdea.accessType;
        if (newAccessType === "open_closed" && !existingIdea.inviteToken) {
            setValues.inviteToken = generateInviteToken();
        }

        const [updatedIdea] = await db
            .update(ideas)
            .set(setValues)
            .where(eq(ideas.id, id))
            .returning();

        return res.status(200).json(updatedIdea);
    } catch (err: any) {
        console.error("Update idea error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteIdea = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [existingIdea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!existingIdea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        if (existingIdea.ownerId !== userId) {
            return res.status(403).json({ error: "Only the idea owner can delete this idea" });
        }

        // Clean up group, group_members, group_messages, join_requests
        const [group] = await db.select().from(groups).where(eq(groups.ideaId, id));
        if (group) {
            await db.delete(groupMessages).where(eq(groupMessages.groupId, group.id));
            await db.delete(groupMembers).where(eq(groupMembers.groupId, group.id));
            await db.delete(groups).where(eq(groups.id, group.id));
        }
        await db.delete(joinRequests).where(eq(joinRequests.ideaId, id));
        await db.delete(ideas).where(eq(ideas.id, id));

        return res.status(200).json({ message: "Idea deleted successfully" });
    } catch (err: any) {
        console.error("Delete idea error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const requestJoinIdea = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        if (idea.accessType !== "open_open") {
            return res.status(400).json({ error: "Join requests are only allowed for open+open ideas" });
        }

        if (idea.status !== "open") {
            return res.status(400).json({ error: "Cannot request to join a closed idea" });
        }

        // Check if user is already an active member of group
        const [group] = await db.select().from(groups).where(eq(groups.ideaId, idea.id));
        if (group) {
            const [activeMember] = await db
                .select()
                .from(groupMembers)
                .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId), isNull(groupMembers.leftAt)));
            if (activeMember) {
                return res.status(400).json({ error: "You are already a member of this idea's group" });
            }
        }

        // Check for existing pending join request
        const [existingReq] = await db
            .select()
            .from(joinRequests)
            .where(and(eq(joinRequests.ideaId, idea.id), eq(joinRequests.userId, userId), eq(joinRequests.status, "pending")));

        if (existingReq) {
            return res.status(400).json({ error: "You already have a pending join request for this idea" });
        }

        const [newJoinReq] = await db
            .insert(joinRequests)
            .values({
                ideaId: idea.id,
                userId: userId,
                status: "pending",
            })
            .returning();

        return res.status(201).json(newJoinReq);
    } catch (err: any) {
        console.error("Request join error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getJoinRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        if (idea.ownerId !== userId) {
            return res.status(403).json({ error: "Only the idea owner can view join requests" });
        }

        const limitParam = parseInt(req.query.limit as string) || 50;
        const limit = Math.min(Math.max(limitParam, 1), 100);
        const cursor = req.query.cursor as string | undefined;

        const queryConditions = [eq(joinRequests.ideaId, idea.id)];

        if (cursor) {
            const cursorDate = new Date(cursor);
            if (!isNaN(cursorDate.getTime())) {
                queryConditions.push(lt(joinRequests.createdAt, cursorDate));
            }
        }

        const fetchedRequests = await db
            .select({
                id: joinRequests.id,
                ideaId: joinRequests.ideaId,
                userId: joinRequests.userId,
                username: users.username,
                status: joinRequests.status,
                createdAt: joinRequests.createdAt,
            })
            .from(joinRequests)
            .innerJoin(users, eq(joinRequests.userId, users.id))
            .where(and(...queryConditions))
            .orderBy(desc(joinRequests.createdAt))
            .limit(limit + 1);

        let nextCursor: string | null = null;
        if (fetchedRequests.length > limit) {
            fetchedRequests.pop();
            const lastRequest = fetchedRequests[fetchedRequests.length - 1];
            if (lastRequest) {
                nextCursor = new Date(lastRequest.createdAt).toISOString();
            }
        }

        return res.status(200).json({ requests: fetchedRequests, nextCursor });
    } catch (err: any) {
        console.error("Get join requests error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const processJoinRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;
        const requestId = req.params.requestId as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        if (idea.ownerId !== userId) {
            return res.status(403).json({ error: "Only the idea owner can process join requests" });
        }

        const parseResult = processJoinRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const { action } = parseResult.data;

        const [joinReq] = await db
            .select()
            .from(joinRequests)
            .where(and(eq(joinRequests.id, requestId), eq(joinRequests.ideaId, id)));

        if (!joinReq) {
            return res.status(404).json({ error: "Join request not found" });
        }

        const newStatus = action === "accept" ? "accepted" : "rejected";
        const [updatedReq] = await db
            .update(joinRequests)
            .set({ status: newStatus })
            .where(eq(joinRequests.id, requestId))
            .returning();

        if (action === "accept") {
            const [group] = await db.select().from(groups).where(eq(groups.ideaId, id));
            if (group) {
                // Add to group_members or clear leftAt
                const [existingMember] = await db
                    .select()
                    .from(groupMembers)
                    .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, joinReq.userId)));

                if (existingMember) {
                    await db
                        .update(groupMembers)
                        .set({ leftAt: null, joinedAt: new Date() })
                        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, joinReq.userId)));
                } else {
                    await db.insert(groupMembers).values({
                        groupId: group.id,
                        userId: joinReq.userId,
                    });
                }
            }
        }

        return res.status(200).json(updatedReq);
    } catch (err: any) {
        console.error("Process join request error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const addLookingForSkill = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        if (idea.ownerId !== userId) {
            return res.status(403).json({ error: "Only the idea owner can modify the looking-for list" });
        }

        const parseResult = addLookingForSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const { skillId } = parseResult.data;

        const [skill] = await db.select().from(skills).where(eq(skills.id, skillId));
        if (!skill) {
            return res.status(404).json({ error: "Skill not found" });
        }

        const [existing] = await db
            .select()
            .from(ideaLookingFor)
            .where(and(eq(ideaLookingFor.ideaId, id), eq(ideaLookingFor.skillId, skillId)));

        if (existing) {
            return res.status(400).json({ error: "Skill is already in the looking-for list" });
        }

        await db.insert(ideaLookingFor).values({
            ideaId: id,
            skillId,
        });

        return res.status(201).json({ ideaId: id, skillId, name: skill.name });
    } catch (err: any) {
        console.error("Add looking-for skill error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const removeLookingForSkill = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;
        const skillId = req.params.skillId as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        if (idea.ownerId !== userId) {
            return res.status(403).json({ error: "Only the idea owner can modify the looking-for list" });
        }

        await db
            .delete(ideaLookingFor)
            .where(and(eq(ideaLookingFor.ideaId, id), eq(ideaLookingFor.skillId, skillId)));

        return res.status(200).json({ message: "Skill removed from looking-for list" });
    } catch (err: any) {
        console.error("Remove looking-for skill error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const regenerateInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        if (idea.ownerId !== userId) {
            return res.status(403).json({ error: "Only the idea owner can regenerate the invite link" });
        }

        const newToken = generateInviteToken();

        await db
            .update(ideas)
            .set({ inviteToken: newToken })
            .where(eq(ideas.id, id));

        return res.status(200).json({ inviteToken: newToken });
    } catch (err: any) {
        console.error("Regenerate invite error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const joinViaInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const token = req.params.token as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.inviteToken, token));
        if (!idea) {
            return res.status(404).json({ error: "Invalid invite link" });
        }

        if (idea.accessType !== "open_closed") {
            return res.status(400).json({ error: "This idea does not accept invite-link joins" });
        }

        if (idea.status !== "open") {
            return res.status(400).json({ error: "Cannot join a closed idea" });
        }

        const [group] = await db.select().from(groups).where(eq(groups.ideaId, idea.id));
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const [existingMember] = await db
            .select()
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId)));

        if (existingMember && existingMember.leftAt === null) {
            return res.status(400).json({ error: "You are already a member of this group" });
        }

        if (existingMember) {
            await db
                .update(groupMembers)
                .set({ leftAt: null, joinedAt: new Date() })
                .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId)));
        } else {
            await db.insert(groupMembers).values({
                groupId: group.id,
                userId,
            });
        }

        return res.status(200).json({
            message: "Joined group successfully",
            groupId: group.id,
            ideaId: idea.id,
        });
    } catch (err: any) {
        console.error("Join via invite error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
