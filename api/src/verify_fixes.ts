import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import healthRoutes from "./routes/healthRoutes";
import lookupRoutes from "./routes/lookupRoutes";
import ideaRoutes from "./routes/ideaRoutes";
import groupRoutes from "./routes/groupRoutes";

dotenv.config();

const PORT = 5007;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runVerification() {
    console.log("🚀 Starting batch fix verification test server on port", PORT);

    const app = express();
    app.use(cors());
    app.use(express.json());

    const server = http.createServer(app);

    // Mirror the fixed api/src/index.ts mounts — exactly one path per route group
    app.use("/api/v1", healthRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1", lookupRoutes);
    app.use("/api/v1/ideas", ideaRoutes);
    app.use("/api/v1/groups", groupRoutes);

    await new Promise<void>((resolve) => server.listen(PORT, resolve));
    console.log("✅ Verification server listening on port", PORT);

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
        let data: any = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }
        return { status: res.status, data };
    };

    const rawReq = async (url: string, method: string, options: any = {}) => {
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        let data: any = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }
        return { status: res.status, data };
    };

    const ts = Date.now();

    console.log("\n--- Step 0: Setup lookups & users ---");
    const domainsRes = await req("/domains");
    console.log("GET /api/v1/domains:", domainsRes.status, `count=${domainsRes.data?.length ?? "n/a"}`);
    const domainId = domainsRes.data[0].id;

    const skillsRes = await req("/skills");
    console.log("GET /api/v1/skills:", skillsRes.status, `count=${skillsRes.data?.length ?? "n/a"}`);
    const skillId1 = skillsRes.data[0].id;
    const skillId2 = skillsRes.data[1] ? skillsRes.data[1].id : skillsRes.data[0].id;

    const signupA = await req("/auth/signup", { method: "POST", body: { username: `owner_${ts}`, email: `owner_${ts}@example.com`, password: "password123" } });
    const signupB = await req("/auth/signup", { method: "POST", body: { username: `b_${ts}`, email: `b_${ts}@example.com`, password: "password123" } });
    const signupC = await req("/auth/signup", { method: "POST", body: { username: `c_${ts}`, email: `c_${ts}@example.com`, password: "password123" } });
    const signupD = await req("/auth/signup", { method: "POST", body: { username: `d_${ts}`, email: `d_${ts}@example.com`, password: "password123" } });
    const tokenA = signupA.data.token;
    const tokenB = signupB.data.token;
    const tokenC = signupC.data.token;
    const tokenD = signupD.data.token;
    const userB = signupB.data.user;
    const userC = signupC.data.user;
    const userD = signupD.data.user;
    console.log("A (owner):", signupA.status, "B:", signupB.status, "C:", signupC.status, "D:", signupD.status);

    console.log("\n--- Test 1: no route responds at old duplicate paths ---");
    const oldHealth = await rawReq(`http://localhost:${PORT}/health`, "GET");
    console.log("GET /health (old) -> ", oldHealth.status, JSON.stringify(oldHealth.data));
    const newHealth = await rawReq(`http://localhost:${PORT}/api/v1/health`, "GET");
    console.log("GET /api/v1/health (new) -> ", newHealth.status, JSON.stringify(newHealth.data));
    const oldAuth = await rawReq(`http://localhost:${PORT}/auth/signup`, "POST", { body: { username: "x", email: "x@y.com", password: "pass123" } });
    console.log("POST /auth/signup (old) -> ", oldAuth.status, JSON.stringify(oldAuth.data));
    const newAuth = await rawReq(`http://localhost:${PORT}/api/v1/auth/signup`, "POST", { body: { username: `authcheck_${ts}`, email: `authcheck_${ts}@example.com`, password: "password123" } });
    console.log("POST /api/v1/auth/signup (new) -> ", newAuth.status, JSON.stringify({ username: newAuth.data?.user?.username }));

    console.log("\n--- Step 1: idea (open_open) + join-request pagination ---");
    const idea1 = await req("/ideas", { method: "POST", token: tokenA, body: { title: `Open Idea ${ts}`, description: "Open idea for pagination + looking-for tests.", domainId, accessType: "open_open" } });
    console.log("POST /ideas (open_open):", idea1.status, "groupId:", idea1.data.idea.groupId);
    const idea1Id = idea1.data.idea.id;
    const group1Id = idea1.data.idea.groupId;

    const jrB = await req(`/ideas/${idea1Id}/request-join`, { method: "POST", token: tokenB });
    const jrC = await req(`/ideas/${idea1Id}/request-join`, { method: "POST", token: tokenC });
    const jrD = await req(`/ideas/${idea1Id}/request-join`, { method: "POST", token: tokenD });
    console.log("request-join B/C/D:", jrB.status, jrC.status, jrD.status);

    const jrPage1 = await req(`/ideas/${idea1Id}/join-requests?limit=2`, { token: tokenA });
    console.log("GET /ideas/:id/join-requests?limit=2 ->", jrPage1.status, JSON.stringify(jrPage1.data));

    if (jrPage1.data?.nextCursor) {
        const jrPage2 = await req(`/ideas/${idea1Id}/join-requests?limit=2&cursor=${encodeURIComponent(jrPage1.data.nextCursor)}`, { token: tokenA });
        console.log("GET /ideas/:id/join-requests?limit=2&cursor=... ->", jrPage2.status, JSON.stringify(jrPage2.data));
    }

    console.log("\n--- Step 2: group members pagination ---");
    const addB = await req(`/groups/${group1Id}/members`, { method: "POST", token: tokenA, body: { userId: userB.id } });
    const addC = await req(`/groups/${group1Id}/members`, { method: "POST", token: tokenA, body: { userId: userC.id } });
    const addD = await req(`/groups/${group1Id}/members`, { method: "POST", token: tokenA, body: { userId: userD.id } });
    console.log("POST /groups/:id/members B/C/D:", addB.status, addC.status, addD.status);

    const memPage1 = await req(`/groups/${group1Id}/members?limit=2`, { token: tokenA });
    console.log("GET /groups/:id/members?limit=2 ->", memPage1.status, JSON.stringify(memPage1.data));

    if (memPage1.data?.nextCursor) {
        const memPage2 = await req(`/groups/${group1Id}/members?limit=2&cursor=${encodeURIComponent(memPage1.data.nextCursor)}`, { token: tokenA });
        console.log("GET /groups/:id/members?limit=2&cursor=... ->", memPage2.status, JSON.stringify(memPage2.data));
    }

    console.log("\n--- Step 3: looking-for list ---");
    const lfAdd = await req(`/ideas/${idea1Id}/looking-for`, { method: "POST", token: tokenA, body: { skillId: skillId1 } });
    console.log("POST /ideas/:id/looking-for ->", lfAdd.status, JSON.stringify(lfAdd.data));

    const lfDup = await req(`/ideas/${idea1Id}/looking-for`, { method: "POST", token: tokenA, body: { skillId: skillId1 } });
    console.log("POST /ideas/:id/looking-for (duplicate) ->", lfDup.status, JSON.stringify(lfDup.data));

    const ideaAfterAdd = await req(`/ideas/${idea1Id}`);
    console.log("GET /ideas/:id (after add) lookingFor ->", ideaAfterAdd.status, JSON.stringify(ideaAfterAdd.data.lookingFor));

    const lfRemove = await req(`/ideas/${idea1Id}/looking-for/${skillId1}`, { method: "DELETE", token: tokenA });
    console.log("DELETE /ideas/:id/looking-for/:skillId ->", lfRemove.status, JSON.stringify(lfRemove.data));

    const ideaAfterRemove = await req(`/ideas/${idea1Id}`);
    console.log("GET /ideas/:id (after remove) lookingFor ->", ideaAfterRemove.status, JSON.stringify(ideaAfterRemove.data.lookingFor));

    console.log("\n--- Step 4: invite link (open_closed) ---");
    const idea2 = await req("/ideas", { method: "POST", token: tokenA, body: { title: `Closed Access Idea ${ts}`, description: "Invite-only idea via shareable link.", domainId, accessType: "open_closed" } });
    console.log("POST /ideas (open_closed):", idea2.status, "groupId:", idea2.data.idea.groupId);
    const idea2Id = idea2.data.idea.id;
    const token1 = idea2.data.idea.inviteToken;
    console.log("invite_token from creation response present?", typeof token1 === "string" && token1.length > 0);

    const idea2Public = await req(`/ideas/${idea2Id}`);
    console.log("GET /ideas/:id (public, no auth) has inviteToken?", idea2Public.status, "inviteToken in body:", "inviteToken" in (idea2Public.data || {}));

    const idea2Owner = await req(`/ideas/${idea2Id}`, { token: tokenA });
    console.log("GET /ideas/:id (owner) has inviteToken?", idea2Owner.status, "inviteToken in body:", "inviteToken" in (idea2Owner.data || {}));

    const joinViaToken1 = await req(`/ideas/join-via-invite/${token1}`, { method: "POST", token: tokenB });
    console.log("POST /ideas/join-via-invite/:token (user B, token1) ->", joinViaToken1.status, JSON.stringify(joinViaToken1.data));

    const regen = await req(`/ideas/${idea2Id}/regenerate-invite`, { method: "POST", token: tokenA });
    console.log("POST /ideas/:id/regenerate-invite ->", regen.status, JSON.stringify(regen.data));
    const token2 = regen.data.inviteToken;

    const oldTokenJoin = await req(`/ideas/join-via-invite/${token1}`, { method: "POST", token: tokenC });
    console.log("POST /ideas/join-via-invite/:token (user C, OLD token) ->", oldTokenJoin.status, JSON.stringify(oldTokenJoin.data));

    const newTokenJoin = await req(`/ideas/join-via-invite/${token2}`, { method: "POST", token: tokenC });
    console.log("POST /ideas/join-via-invite/:token (user C, NEW token) ->", newTokenJoin.status, JSON.stringify(newTokenJoin.data));

    console.log("\n✅ VERIFICATION COMPLETE");

    server.close();
    process.exit(0);
}

runVerification().catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
});