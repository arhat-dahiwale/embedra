import { Response } from "express";
import { db, users, skills, userSkills, follows, ideas, groups, groupMembers, savedIdeas, eq, and, isNull, count, lt, gt, desc, asc } from "../../../packages/db/index";
import { updateProfileSchema, addUserSkillSchema } from "../../../packages/types";
import { AuthenticatedRequest } from "../middleware/auth";

const pageLimit = (value: unknown) => Math.min(Math.max(parseInt(value as string) || 50, 1), 100);

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const [user] = await db.select({ id: users.id, username: users.username, bio: users.bio, profilePicUrl: users.profilePicUrl, socials: users.socials, projectLinks: users.projectLinks }).from(users).where(eq(users.id, id));
        if (!user) return res.status(404).json({ error: "User not found" });
        const [skillList, [followers], [following], ideaCounts, [activeGroups]] = await Promise.all([
            db.select({ id: skills.id, name: skills.name }).from(userSkills).innerJoin(skills, eq(userSkills.skillId, skills.id)).where(eq(userSkills.userId, id)).orderBy(asc(skills.name)),
            db.select({ count: count() }).from(follows).where(eq(follows.followingId, id)),
            db.select({ count: count() }).from(follows).where(eq(follows.followerId, id)),
            db.select({ status: ideas.status, count: count() }).from(ideas).where(eq(ideas.ownerId, id)).groupBy(ideas.status),
            db.select({ count: count() }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(and(eq(groupMembers.userId, id), isNull(groupMembers.leftAt))),
        ]);
        const openIdeaCount = Number(ideaCounts.find((row) => row.status === "open")?.count ?? 0);
        const closedIdeaCount = Number(ideaCounts.find((row) => row.status === "closed")?.count ?? 0);
        return res.json({ ...user, skills: skillList, followerCount: Number(followers.count), followingCount: Number(following.count), openIdeaCount, closedIdeaCount, activeGroupCount: Number(activeGroups.count) });
    } catch (error) { console.error("Get user profile error:", error); return res.status(500).json({ error: "Internal server error" }); }
};

export const updateMyProfile = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = updateProfileSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    try { const [user] = await db.update(users).set(parsed.data).where(eq(users.id, userId)).returning({ id: users.id, username: users.username, bio: users.bio, profilePicUrl: users.profilePicUrl, socials: users.socials, projectLinks: users.projectLinks }); return res.json(user); }
    catch (error) { console.error("Update profile error:", error); return res.status(500).json({ error: "Internal server error" }); }
};

export const addMySkill = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = addUserSkillSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    try { const [skill] = await db.select().from(skills).where(eq(skills.id, parsed.data.skillId)); if (!skill) return res.status(404).json({ error: "Skill not found" }); const [existing] = await db.select().from(userSkills).where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skill.id))); if (existing) return res.status(400).json({ error: "Skill already added" }); await db.insert(userSkills).values({ userId, skillId: skill.id }); return res.status(201).json(skill); }
    catch (error) { console.error("Add skill error:", error); return res.status(500).json({ error: "Internal server error" }); }
};

export const removeMySkill = async (req: AuthenticatedRequest, res: Response) => { const userId = req.user?.userId; if (!userId) return res.status(401).json({ error: "Unauthorized" }); try { await db.delete(userSkills).where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, req.params.skillId as string))); return res.json({ message: "Skill removed" }); } catch (error) { console.error("Remove skill error:", error); return res.status(500).json({ error: "Internal server error" }); } };

export const followUser = async (req: AuthenticatedRequest, res: Response) => { const userId = req.user?.userId; const targetId = req.params.id as string; if (!userId) return res.status(401).json({ error: "Unauthorized" }); if (userId === targetId) return res.status(400).json({ error: "Cannot follow yourself" }); try { const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetId)); if (!target) return res.status(404).json({ error: "User not found" }); const [existing] = await db.select().from(follows).where(and(eq(follows.followerId, userId), eq(follows.followingId, targetId))); if (!existing) await db.insert(follows).values({ followerId: userId, followingId: targetId }); return res.status(200).json({ message: "Following user" }); } catch (error) { console.error("Follow user error:", error); return res.status(500).json({ error: "Internal server error" }); } };
export const unfollowUser = async (req: AuthenticatedRequest, res: Response) => { const userId = req.user?.userId; if (!userId) return res.status(401).json({ error: "Unauthorized" }); try { await db.delete(follows).where(and(eq(follows.followerId, userId), eq(follows.followingId, req.params.id as string))); return res.json({ message: "Unfollowed user" }); } catch (error) { console.error("Unfollow user error:", error); return res.status(500).json({ error: "Internal server error" }); } };

const getUserList = async (res: Response, userId: string, cursor: string | undefined, limit: number, column: typeof follows.followingId | typeof follows.followerId, selectColumn: typeof follows.followerId | typeof follows.followingId) => {
    const conditions = [eq(column, userId)]; if (cursor) conditions.push(gt(selectColumn, cursor));
    const rows = await db.select({ id: users.id, username: users.username, profilePicUrl: users.profilePicUrl }).from(follows).innerJoin(users, eq(selectColumn, users.id)).where(and(...conditions)).orderBy(asc(selectColumn)).limit(limit + 1);
    const hasMore = rows.length > limit; if (hasMore) rows.pop(); return res.json({ users: rows, nextCursor: hasMore ? rows[rows.length - 1]?.id ?? null : null });
};
export const getFollowers = async (req: AuthenticatedRequest, res: Response) => { try { return await getUserList(res, req.params.id as string, req.query.cursor as string | undefined, pageLimit(req.query.limit), follows.followingId, follows.followerId); } catch (error) { console.error("Get followers error:", error); return res.status(500).json({ error: "Internal server error" }); } };
export const getFollowing = async (req: AuthenticatedRequest, res: Response) => { try { return await getUserList(res, req.params.id as string, req.query.cursor as string | undefined, pageLimit(req.query.limit), follows.followerId, follows.followingId); } catch (error) { console.error("Get following error:", error); return res.status(500).json({ error: "Internal server error" }); } };
export const getUserIdeas = async (req: AuthenticatedRequest, res: Response) => { try { const userId = req.params.id as string; const conditions = [eq(ideas.ownerId, userId)]; const cursor = req.query.cursor as string | undefined; if (cursor) { const date = new Date(cursor); if (!isNaN(date.getTime())) conditions.push(lt(ideas.createdAt, date)); } const limit = pageLimit(req.query.limit); const rows = await db.select({ id: ideas.id, title: ideas.title, description: ideas.description, domainId: ideas.domainId, accessType: ideas.accessType, status: ideas.status, createdAt: ideas.createdAt }).from(ideas).where(and(...conditions)).orderBy(desc(ideas.createdAt)).limit(limit + 1); const hasMore = rows.length > limit; if (hasMore) rows.pop(); return res.json({ ideas: rows, nextCursor: hasMore ? rows[rows.length - 1]?.createdAt.toISOString() ?? null : null }); } catch (error) { console.error("Get user ideas error:", error); return res.status(500).json({ error: "Internal server error" }); } };
export const getSavedIdeas=async(req:AuthenticatedRequest,res:Response)=>{const userId=req.user?.userId;if(!userId)return res.status(401).json({error:"Unauthorized"});try{const limit=pageLimit(req.query.limit);const conditions=[eq(savedIdeas.userId,userId)];const cursor=req.query.cursor as string|undefined;if(cursor){const date=new Date(cursor);if(!isNaN(date.getTime()))conditions.push(lt(savedIdeas.createdAt,date));}const rows=await db.select({id:ideas.id,title:ideas.title,description:ideas.description,domainId:ideas.domainId,accessType:ideas.accessType,status:ideas.status,createdAt:ideas.createdAt,savedAt:savedIdeas.createdAt}).from(savedIdeas).innerJoin(ideas,eq(savedIdeas.ideaId,ideas.id)).where(and(...conditions)).orderBy(desc(savedIdeas.createdAt)).limit(limit+1);const hasMore=rows.length>limit;if(hasMore)rows.pop();return res.json({ideas:rows,nextCursor:hasMore?rows[rows.length-1]?.savedAt.toISOString()??null:null});}catch(error){console.error("Get saved ideas error:",error);return res.status(500).json({error:"Internal server error"});}};
