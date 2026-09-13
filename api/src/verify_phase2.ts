import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import healthRoutes from "./routes/healthRoutes";
import lookupRoutes from "./routes/lookupRoutes";
import ideaRoutes from "./routes/ideaRoutes";
import groupRoutes from "./routes/groupRoutes";
import contributionRoutes from "./routes/contributionRoutes";

import { db, groupMembers, ratings, eq, and } from "../../packages/db/index";

dotenv.config();

const PORT = 5007;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runVerification() {
    console.log("🚀 Starting Phase 2 End-to-End Verification Test Server on port", PORT);

    const app = express();
    app.use(cors());
    app.use(express.json());

    const server = http.createServer(app);

    app.use("/api/v1", healthRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1", lookupRoutes);
    app.use("/api/v1/ideas", ideaRoutes);
    app.use("/api/v1/groups", groupRoutes);
    app.use("/api/v1/contributions", contributionRoutes);

    await new Promise<void>((resolve) => server.listen(PORT, resolve));
    console.log("✅ Verification Server listening on port", PORT);

    try {
        const ts = Date.now();

        const req = async (path: string, options: any = {}) => {
            const res = await fetch(`${BASE_URL}${path}`, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
                    ...(options.headers || {}),
                },
                body: options.body ? JSON.stringify(options.body) : undefined,
            });
            const data = await res.json().catch(() => null);
            return { status: res.status, data };
        };

        // ---- Setup users ----
        console.log("\n--- Step 0: Sign up users ---");
        const ownerSignup = await req("/auth/signup", {
            method: "POST",
            body: { username: `owner_${ts}`, email: `owner_${ts}@example.com`, password: "password123" },
        });
        console.log("Owner signup:", ownerSignup.status, ownerSignup.data?.user?.username);
        const tokenOwner = ownerSignup.data.token;
        const userOwner = ownerSignup.data.user;

        const contributorSignup = await req("/auth/signup", {
            method: "POST",
            body: { username: `contrib_${ts}`, email: `contrib_${ts}@example.com`, password: "password123" },
        });
        console.log("Contributor signup:", contributorSignup.status, contributorSignup.data?.user?.username);
        const tokenContrib = contributorSignup.data.token;
        const userContrib = contributorSignup.data.user;

        const outsiderSignup = await req("/auth/signup", {
            method: "POST",
            body: { username: `outsider_${ts}`, email: `outsider_${ts}@example.com`, password: "password123" },
        });
        console.log("Outsider signup:", outsiderSignup.status, outsiderSignup.data?.user?.username);
        const tokenOutsider = outsiderSignup.data.token;
        const userOutsider = outsiderSignup.data.user;

        // ---- Setup idea + group membership ----
        const domainsRes = await req("/domains");
        const domainId = domainsRes.data[0].id;

        const createIdeaRes = await req("/ideas", {
            method: "POST",
            token: tokenOwner,
            body: {
                title: `Rating Test Idea ${ts}`,
                description: "An idea used to exercise Phase 2 rating, contribution and comment flows.",
                domainId,
                accessType: "open_open",
            },
        });
        console.log("\nPOST /ideas (create):", createIdeaRes.status, createIdeaRes.data?.idea?.id);
        const idea = createIdeaRes.data.idea;
        const ideaId = idea.id;
        const groupId = idea.groupId;

        // Contributor joins via open+open flow
        const joinReqRes = await req(`/ideas/${ideaId}/request-join`, { method: "POST", token: tokenContrib });
        console.log("POST /ideas/:id/request-join:", joinReqRes.status, joinReqRes.data);
        const joinRequestId = joinReqRes.data.id;
        const acceptRes = await req(`/ideas/${ideaId}/join-requests/${joinRequestId}`, {
            method: "PATCH",
            token: tokenOwner,
            body: { action: "accept" },
        });
        console.log("PATCH join-request accept:", acceptRes.status, acceptRes.data);

        // =========================================================
        console.log("\n=== 2.1–2.3 RATING TESTS ===");

        console.log("\n[1] Owner rates own idea (expect 403)");
        const ownerRate = await req(`/ideas/${ideaId}/rating`, {
            method: "POST",
            token: tokenOwner,
            body: { value: 5 },
        });
        console.log("Status:", ownerRate.status);
        console.log("Body:", JSON.stringify(ownerRate.data));

        console.log("\n[2] Contributor with <7 days tenure rates (expect 403)");
        const tenureRate = await req(`/ideas/${ideaId}/rating`, {
            method: "POST",
            token: tokenContrib,
            body: { value: 5 },
        });
        console.log("Status:", tenureRate.status);
        console.log("Body:", JSON.stringify(tenureRate.data));

        console.log("\n[3] Backdate contributor tenure to 8 days ago (direct DB)");
        await db
            .update(groupMembers)
            .set({ joinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) })
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userContrib.id)));
        console.log("Updated group_members.joined_at for contributor.");

        console.log("\n[4] Contributor with sufficient tenure rates 5 (expect 200)");
        const validRate = await req(`/ideas/${ideaId}/rating`, {
            method: "POST",
            token: tokenContrib,
            body: { value: 5 },
        });
        console.log("Status:", validRate.status);
        console.log("Body:", JSON.stringify(validRate.data));

        console.log("\n[5] GET rating cache (expect avg=5, count=1)");
        const getRating1 = await req(`/ideas/${ideaId}/rating`);
        console.log("Status:", getRating1.status);
        console.log("Body:", JSON.stringify(getRating1.data));

        console.log("\n[6] Contributor re-rates to 3 (expect 200, avg=3, count=1, no dup row)");
        const updateRate = await req(`/ideas/${ideaId}/rating`, {
            method: "POST",
            token: tokenContrib,
            body: { value: 3 },
        });
        console.log("Status:", updateRate.status);
        console.log("Body:", JSON.stringify(updateRate.data));

        const ratingRows = await db.select().from(ratings).where(eq(ratings.ideaId, ideaId));
        console.log("DB rating rows for idea:", ratingRows.length, JSON.stringify(ratingRows));

        console.log("\n[7] Owner removes contributor (freeze-on-exit, expect avg=null, count=0)");
        const removeRes = await req(`/groups/${groupId}/members/${userContrib.id}`, {
            method: "DELETE",
            token: tokenOwner,
        });
        console.log("Status:", removeRes.status);
        console.log("Body:", JSON.stringify(removeRes.data));

        const getRating2 = await req(`/ideas/${ideaId}/rating`);
        console.log("GET rating after removal:");
        console.log("Status:", getRating2.status);
        console.log("Body:", JSON.stringify(getRating2.data));

        // =========================================================
        console.log("\n=== 2.4–2.5 CONTRIBUTION TESTS ===");

        console.log("\n[8] Re-add contributor as active member");
        const reAddRes = await req(`/groups/${groupId}/members`, {
            method: "POST",
            token: tokenOwner,
            body: { userId: userContrib.id },
        });
        console.log("Status:", reAddRes.status);
        console.log("Body:", JSON.stringify(reAddRes.data));

        console.log("\n[9] Non-contributor submits contribution (expect 403)");
        const outsiderCont = await req(`/ideas/${ideaId}/contributions`, {
            method: "POST",
            token: tokenOutsider,
            body: { content: "I want to help!" },
        });
        console.log("Status:", outsiderCont.status);
        console.log("Body:", JSON.stringify(outsiderCont.data));

        console.log("\n[10] Contributor submits contribution (expect 201, status=pending)");
        const submitCont = await req(`/ideas/${ideaId}/contributions`, {
            method: "POST",
            token: tokenContrib,
            body: { content: "Built the initial API scaffolding.", link: "https://example.com/pr" },
        });
        console.log("Status:", submitCont.status);
        console.log("Body:", JSON.stringify(submitCont.data));
        const contributionId = submitCont.data.id;

        console.log("\n[11] Non-owner/non-submitter fetches list (expect approved-only -> empty)");
        const listContBefore = await req(`/ideas/${ideaId}/contributions`, { token: tokenOutsider });
        console.log("Status:", listContBefore.status);
        console.log("Body:", JSON.stringify(listContBefore.data));

        console.log("\n[12] Owner approves contribution (expect 200)");
        const approveCont = await req(`/contributions/${contributionId}/approve`, {
            method: "PATCH",
            token: tokenOwner,
        });
        console.log("Status:", approveCont.status);
        console.log("Body:", JSON.stringify(approveCont.data));

        console.log("\n[13] Outsider fetches list again (expect 1 approved entry)");
        const listContAfter = await req(`/ideas/${ideaId}/contributions`, { token: tokenOutsider });
        console.log("Status:", listContAfter.status);
        console.log("Body:", JSON.stringify(listContAfter.data));

        // =========================================================
        console.log("\n=== 2.6 COMMENT TESTS ===");

        console.log("\n[14] Contributor posts top-level comment (expect 201, parentCommentId=null)");
        const topComment = await req(`/ideas/${ideaId}/comments`, {
            method: "POST",
            token: tokenContrib,
            body: { content: "Great idea, let's go!" },
        });
        console.log("Status:", topComment.status);
        console.log("Body:", JSON.stringify(topComment.data));
        const topCommentId = topComment.data.id;

        console.log("\n[15] Outsider posts a reply referencing the top-level comment (expect 201)");
        const replyComment = await req(`/ideas/${ideaId}/comments`, {
            method: "POST",
            token: tokenOutsider,
            body: { content: "Agreed, I'm in.", parentCommentId: topCommentId },
        });
        console.log("Status:", replyComment.status);
        console.log("Body:", JSON.stringify(replyComment.data));

        console.log("\n[16] Reply with bogus parent id (expect 400)");
        const badReply = await req(`/ideas/${ideaId}/comments`, {
            method: "POST",
            token: tokenOutsider,
            body: { content: "This should fail.", parentCommentId: "00000000-0000-4000-8000-000000000000" },
        });
        console.log("Status:", badReply.status);
        console.log("Body:", JSON.stringify(badReply.data));

        console.log("\n[17] Fetch comments list (public) — expect 2 comments with correct linkage");
        const commentsRes = await req(`/ideas/${ideaId}/comments`);
        console.log("Status:", commentsRes.status);
        console.log("Body:", JSON.stringify(commentsRes.data));

        console.log("\n✅ PHASE 2 END-TO-END VERIFICATION COMPLETE!");
    } catch (err) {
        console.error("❌ Verification test failed:", err);
    } finally {
        server.close();
        process.exit(0);
    }
}

runVerification();