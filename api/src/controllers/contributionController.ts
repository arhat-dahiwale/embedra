import { Response } from "express";
import { db, ideas, groups, contributions, users, eq, and, or, lt, desc } from "../../../packages/db/index";
import { submitContributionSchema } from "../../../packages/types";
import { AuthenticatedRequest } from "../middleware/auth";
import { checkContributorAccess } from "./groupController";

export const submitContribution = async (req: AuthenticatedRequest, res: Response) => {
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

        const [group] = await db.select().from(groups).where(eq(groups.ideaId, id));
        if (!group) {
            return res.status(403).json({ error: "must be an active contributor to submit a contribution" });
        }

        const isContributor = await checkContributorAccess(group.id, userId);
        if (!isContributor) {
            return res.status(403).json({ error: "must be an active contributor to submit a contribution" });
        }

        const parseResult = submitContributionSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const { content, link } = parseResult.data;

        const [contribution] = await db
            .insert(contributions)
            .values({
                ideaId: id,
                userId,
                content,
                link: link ?? null,
                status: "pending",
            })
            .returning();

        return res.status(201).json({
            id: contribution.id,
            ideaId: contribution.ideaId,
            userId: contribution.userId,
            content: contribution.content,
            link: contribution.link,
            status: contribution.status,
            createdAt: contribution.createdAt,
        });
    } catch (err: any) {
        console.error("Submit contribution error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getIdeaContributions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        const limitParam = parseInt(req.query.limit as string) || 50;
        const limit = Math.min(Math.max(limitParam, 1), 100);
        const cursor = req.query.cursor as string | undefined;

        const queryConditions = [eq(contributions.ideaId, id)];

        if (userId && idea.ownerId === userId) {
            // owner sees all statuses
        } else if (userId) {
            queryConditions.push(or(eq(contributions.status, "approved"), eq(contributions.userId, userId))!);
        } else {
            queryConditions.push(eq(contributions.status, "approved"));
        }

        if (cursor) {
            const cursorDate = new Date(cursor);
            if (!isNaN(cursorDate.getTime())) {
                queryConditions.push(lt(contributions.createdAt, cursorDate));
            }
        }

        const fetched = await db
            .select({
                id: contributions.id,
                ideaId: contributions.ideaId,
                userId: contributions.userId,
                username: users.username,
                content: contributions.content,
                link: contributions.link,
                status: contributions.status,
                createdAt: contributions.createdAt,
            })
            .from(contributions)
            .innerJoin(users, eq(contributions.userId, users.id))
            .where(and(...queryConditions))
            .orderBy(desc(contributions.createdAt))
            .limit(limit + 1);

        let nextCursor: string | null = null;
        if (fetched.length > limit) {
            fetched.pop();
            const last = fetched[fetched.length - 1];
            if (last) {
                nextCursor = new Date(last.createdAt).toISOString();
            }
        }

        return res.status(200).json({ contributions: fetched, nextCursor });
    } catch (err: any) {
        console.error("Get idea contributions error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const setContributionStatus = async (req: AuthenticatedRequest, res: Response, status: "approved" | "rejected") => {
    try {
        const userId = req.user?.userId;
        const contributionId = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [contribution] = await db.select().from(contributions).where(eq(contributions.id, contributionId));
        if (!contribution) {
            return res.status(404).json({ error: "Contribution not found" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, contribution.ideaId));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        if (idea.ownerId !== userId) {
            return res.status(403).json({ error: "Only the idea owner can review contributions" });
        }

        const [updated] = await db
            .update(contributions)
            .set({ status })
            .where(eq(contributions.id, contributionId))
            .returning();

        return res.status(200).json({
            id: updated.id,
            ideaId: updated.ideaId,
            userId: updated.userId,
            content: updated.content,
            link: updated.link,
            status: updated.status,
            createdAt: updated.createdAt,
        });
    } catch (err: any) {
        console.error("Review contribution error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const approveContribution = async (req: AuthenticatedRequest, res: Response) => {
    return setContributionStatus(req, res, "approved");
};

export const rejectContribution = async (req: AuthenticatedRequest, res: Response) => {
    return setContributionStatus(req, res, "rejected");
};
