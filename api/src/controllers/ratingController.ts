import { Response } from "express";
import { db, ideas, groups, groupMembers, ratings, eq, and, isNull } from "../../../packages/db/index";
import { submitRatingSchema } from "../../../packages/types";
import { AuthenticatedRequest } from "../middleware/auth";
import { TENURE_DAYS, recomputeIdeaRatingCache } from "../services/ratingService";

export const submitRating = async (req: AuthenticatedRequest, res: Response) => {
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

        if (idea.ownerId === userId) {
            return res.status(403).json({ error: "owners cannot rate their own idea" });
        }

        const [group] = await db.select().from(groups).where(eq(groups.ideaId, idea.id));
        if (!group) {
            return res.status(403).json({ error: "must be an active contributor to rate" });
        }

        const [member] = await db
            .select()
            .from(groupMembers)
            .where(
                and(
                    eq(groupMembers.groupId, group.id),
                    eq(groupMembers.userId, userId),
                    isNull(groupMembers.leftAt)
                )
            );

        if (!member) {
            return res.status(403).json({ error: "must be an active contributor to rate" });
        }

        const tenureMs = TENURE_DAYS * 24 * 60 * 60 * 1000;
        if (Date.now() - new Date(member.joinedAt).getTime() < tenureMs) {
            return res.status(403).json({ error: "tenure requirement not met" });
        }

        const parseResult = submitRatingSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const { value } = parseResult.data;

        const [rating] = await db
            .insert(ratings)
            .values({ ideaId: idea.id, userId, value })
            .onConflictDoUpdate({
                target: [ratings.ideaId, ratings.userId],
                set: { value, updatedAt: new Date() },
            })
            .returning();

        const cache = await recomputeIdeaRatingCache(idea.id);

        return res.status(200).json({
            ideaId: rating.ideaId,
            userId: rating.userId,
            value: rating.value,
            updatedAt: rating.updatedAt,
            avgRating: cache.avgRating,
            ratingCount: cache.ratingCount,
        });
    } catch (err: any) {
        console.error("Submit rating error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getIdeaRating = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        const [idea] = await db
            .select({
                avgRating: ideas.avgRating,
                ratingCount: ideas.ratingCount,
            })
            .from(ideas)
            .where(eq(ideas.id, id));

        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        return res.status(200).json({
            avgRating: idea.avgRating === null ? null : Number(idea.avgRating),
            ratingCount: Number(idea.ratingCount),
        });
    } catch (err: any) {
        console.error("Get idea rating error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
