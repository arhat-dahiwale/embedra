import { Response } from "express";
import { db, groups, groupMembers, ideas, users, groupMessages, joinRequests, eq, and, isNull, count, lt, desc } from "../../../packages/db/index";
import { addMemberSchema } from "../../../packages/types/index";
import { AuthenticatedRequest } from "../middleware/auth";

export const checkContributorAccess = async (groupId: string, userId: string): Promise<boolean> => {
    const [member] = await db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId), isNull(groupMembers.leftAt)));
    return !!member;
};

export const getGroupById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const isContributor = await checkContributorAccess(id, userId);
        if (!isContributor) {
            return res.status(403).json({ error: "Access denied: contributor-only space" });
        }

        const [group] = await db
            .select({
                id: groups.id,
                ideaId: groups.ideaId,
                ideaTitle: ideas.title,
                ownerId: ideas.ownerId,
            })
            .from(groups)
            .innerJoin(ideas, eq(groups.ideaId, ideas.id))
            .where(eq(groups.id, id));

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const [memberCountRes] = await db
            .select({ count: count() })
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, id), isNull(groupMembers.leftAt)));

        return res.status(200).json({
            ...group,
            memberCount: Number(memberCountRes?.count || 0),
        });
    } catch (err: any) {
        console.error("Get group error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getGroupMembers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const isContributor = await checkContributorAccess(id, userId);
        if (!isContributor) {
            return res.status(403).json({ error: "Access denied: contributor-only space" });
        }

        const limitParam = parseInt(req.query.limit as string) || 50;
        const limit = Math.min(Math.max(limitParam, 1), 100);
        const cursor = req.query.cursor as string | undefined;

        const queryConditions = [eq(groupMembers.groupId, id), isNull(groupMembers.leftAt)];

        if (cursor) {
            const cursorDate = new Date(cursor);
            if (!isNaN(cursorDate.getTime())) {
                queryConditions.push(lt(groupMembers.joinedAt, cursorDate));
            }
        }

        const fetchedMembers = await db
            .select({
                groupId: groupMembers.groupId,
                userId: groupMembers.userId,
                username: users.username,
                profilePicUrl: users.profilePicUrl,
                joinedAt: groupMembers.joinedAt,
                leftAt: groupMembers.leftAt,
            })
            .from(groupMembers)
            .innerJoin(users, eq(groupMembers.userId, users.id))
            .where(and(...queryConditions))
            .orderBy(desc(groupMembers.joinedAt))
            .limit(limit + 1);

        let nextCursor: string | null = null;
        if (fetchedMembers.length > limit) {
            fetchedMembers.pop();
            const lastMember = fetchedMembers[fetchedMembers.length - 1];
            if (lastMember) {
                nextCursor = new Date(lastMember.joinedAt).toISOString();
            }
        }

        return res.status(200).json({ members: fetchedMembers, nextCursor });
    } catch (err: any) {
        console.error("Get group members error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const addMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const groupId = req.params.id as string;

        if (!currentUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, group.ideaId));
        if (!idea || idea.ownerId !== currentUserId) {
            return res.status(403).json({ error: "Only the idea owner can add members to this group" });
        }

        const parseResult = addMemberSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const { userId: targetUserId } = parseResult.data;

        const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));
        if (!targetUser) {
            return res.status(404).json({ error: "User to add not found" });
        }

        // Check if user is already an active member
        const [existingMember] = await db
            .select()
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

        if (existingMember && existingMember.leftAt === null) {
            return res.status(400).json({ error: "User is already an active group member" });
        }

        if (existingMember) {
            await db
                .update(groupMembers)
                .set({ leftAt: null, joinedAt: new Date() })
                .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));
        } else {
            await db.insert(groupMembers).values({
                groupId: groupId,
                userId: targetUserId,
            });
        }

        // Auto-accept any pending join request for this user on this idea
        await db
            .update(joinRequests)
            .set({ status: "accepted" })
            .where(and(eq(joinRequests.ideaId, idea.id), eq(joinRequests.userId, targetUserId), eq(joinRequests.status, "pending")));

        return res.status(200).json({
            message: "Member added successfully",
            groupId,
            userId: targetUserId,
            username: targetUser.username,
        });
    } catch (err: any) {
        console.error("Add member error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const groupId = req.params.id as string;
        const targetUserId = req.params.userId as string;

        if (!currentUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, group.ideaId));
        if (!idea || idea.ownerId !== currentUserId) {
            return res.status(403).json({ error: "Only the idea owner can remove members from this group" });
        }

        if (targetUserId === idea.ownerId) {
            return res.status(400).json({ error: "Idea owner cannot be removed from their own group" });
        }

        const [activeMember] = await db
            .select()
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId), isNull(groupMembers.leftAt)));

        if (!activeMember) {
            return res.status(404).json({ error: "User is not an active member of this group" });
        }

        // Set leftAt = now() (do NOT delete row, per rating freeze-on-exit rules)
        await db
            .update(groupMembers)
            .set({ leftAt: new Date() })
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

        return res.status(200).json({ message: "Member removed from group successfully" });
    } catch (err: any) {
        console.error("Remove member error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getGroupMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const groupId = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const isContributor = await checkContributorAccess(groupId, userId);
        if (!isContributor) {
            return res.status(403).json({ error: "Access denied: contributor-only space" });
        }

        const limitParam = parseInt(req.query.limit as string) || 50;
        const limit = Math.min(Math.max(limitParam, 1), 100);
        const cursor = req.query.cursor as string | undefined;

        let queryConditions = [eq(groupMessages.groupId, groupId)];

        if (cursor) {
            const cursorDate = new Date(cursor);
            if (!isNaN(cursorDate.getTime())) {
                queryConditions.push(lt(groupMessages.createdAt, cursorDate));
            }
        }

        // Fetch limit + 1 items to check if next cursor exists
        const fetchedMessages = await db
            .select({
                id: groupMessages.id,
                groupId: groupMessages.groupId,
                userId: groupMessages.userId,
                username: users.username,
                profilePicUrl: users.profilePicUrl,
                content: groupMessages.content,
                imageUrl: groupMessages.imageUrl,
                createdAt: groupMessages.createdAt,
            })
            .from(groupMessages)
            .innerJoin(users, eq(groupMessages.userId, users.id))
            .where(and(...queryConditions))
            .orderBy(desc(groupMessages.createdAt))
            .limit(limit + 1);

        let nextCursor: string | null = null;
        if (fetchedMessages.length > limit) {
            fetchedMessages.pop(); // remove extra (limit + 1)-th item
            const lastMessageOnPage = fetchedMessages[fetchedMessages.length - 1];
            if (lastMessageOnPage) {
                nextCursor = new Date(lastMessageOnPage.createdAt).toISOString();
            }
        }

        return res.status(200).json({
            messages: fetchedMessages,
            nextCursor,
        });

    } catch (err: any) {
        console.error("Get group messages error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
