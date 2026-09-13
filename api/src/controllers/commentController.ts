import { Response } from "express";
import { db, ideas, ideaComments, users, eq, and, gt, asc } from "../../../packages/db/index";
import { createCommentSchema } from "../../../packages/types";
import { AuthenticatedRequest } from "../middleware/auth";

export const getIdeaComments = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        const [idea] = await db.select({ id: ideas.id }).from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        const limitParam = parseInt(req.query.limit as string) || 50;
        const limit = Math.min(Math.max(limitParam, 1), 100);
        const cursor = req.query.cursor as string | undefined;

        const queryConditions = [eq(ideaComments.ideaId, id)];

        if (cursor) {
            const cursorDate = new Date(cursor);
            if (!isNaN(cursorDate.getTime())) {
                queryConditions.push(gt(ideaComments.createdAt, cursorDate));
            }
        }

        const fetched = await db
            .select({
                id: ideaComments.id,
                ideaId: ideaComments.ideaId,
                userId: ideaComments.userId,
                username: users.username,
                profilePicUrl: users.profilePicUrl,
                parentCommentId: ideaComments.parentCommentId,
                content: ideaComments.content,
                imageUrl: ideaComments.imageUrl,
                createdAt: ideaComments.createdAt,
            })
            .from(ideaComments)
            .innerJoin(users, eq(ideaComments.userId, users.id))
            .where(and(...queryConditions))
            .orderBy(asc(ideaComments.createdAt))
            .limit(limit + 1);

        let nextCursor: string | null = null;
        if (fetched.length > limit) {
            fetched.pop();
            const last = fetched[fetched.length - 1];
            if (last) {
                nextCursor = new Date(last.createdAt).toISOString();
            }
        }

        return res.status(200).json({ comments: fetched, nextCursor });
    } catch (err: any) {
        console.error("Get idea comments error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const addIdeaComment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [idea] = await db.select({ id: ideas.id }).from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        const parseResult = createCommentSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const { content, parentCommentId } = parseResult.data;

        if (parentCommentId) {
            const [parent] = await db
                .select()
                .from(ideaComments)
                .where(eq(ideaComments.id, parentCommentId));

            if (!parent || parent.ideaId !== id) {
                return res.status(400).json({ error: "Parent comment does not belong to this idea" });
            }
        }

        const [comment] = await db
            .insert(ideaComments)
            .values({
                ideaId: id,
                userId,
                parentCommentId: parentCommentId ?? null,
                content,
                imageUrl: null,
            })
            .returning();

        return res.status(201).json({
            id: comment.id,
            ideaId: comment.ideaId,
            userId: comment.userId,
            parentCommentId: comment.parentCommentId,
            content: comment.content,
            imageUrl: comment.imageUrl,
            createdAt: comment.createdAt,
        });
    } catch (err: any) {
        console.error("Add idea comment error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteIdeaComment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;
        const commentId = req.params.commentId as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        const [comment] = await db
            .select()
            .from(ideaComments)
            .where(and(eq(ideaComments.id, commentId), eq(ideaComments.ideaId, id)));

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.userId !== userId && idea.ownerId !== userId) {
            return res.status(403).json({ error: "Only the comment author or idea owner can delete this comment" });
        }

        await db.delete(ideaComments).where(eq(ideaComments.id, commentId));

        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err: any) {
        console.error("Delete idea comment error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
