import { db, groups, groupMembers, ideas, ratings, eq, and, isNull, count, sql } from "../../../packages/db/index";

export const TENURE_DAYS = 7;

export const recomputeIdeaRatingCache = async (ideaId: string): Promise<{ avgRating: number | null; ratingCount: number }> => {
    const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.ideaId, ideaId));

    let avgRating: number | null = null;
    let ratingCount = 0;

    if (group) {
        const [result] = await db
            .select({
                avgRating: sql<string | null>`avg(${ratings.value})`,
                ratingCount: count(),
            })
            .from(ratings)
            .innerJoin(
                groupMembers,
                and(
                    eq(groupMembers.userId, ratings.userId),
                    eq(groupMembers.groupId, group.id),
                    isNull(groupMembers.leftAt)
                )
            )
            .where(eq(ratings.ideaId, ideaId));

        const rawAvg = result?.avgRating ?? null;
        ratingCount = Number(result?.ratingCount ?? 0);
        avgRating = rawAvg === null ? null : Number(rawAvg);
    }

    await db
        .update(ideas)
        .set({
            avgRating: avgRating === null ? null : String(avgRating),
            ratingCount,
        })
        .where(eq(ideas.id, ideaId));

    return { avgRating, ratingCount };
};
