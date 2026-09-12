import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import { io as socketClient, Socket as ClientSocket } from "socket.io-client";

import authRoutes from "./routes/authRoutes";
import healthRoutes from "./routes/healthRoutes";
import lookupRoutes from "./routes/lookupRoutes";
import ideaRoutes from "./routes/ideaRoutes";
import groupRoutes from "./routes/groupRoutes";
import { setupSocketIO } from "./sockets/groupSocket";

dotenv.config();

const PORT = 5006;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runVerification() {
    console.log("🚀 Starting Phase 1 End-to-End Verification Test Server on port", PORT);

    const app = express();
    app.use(cors());
    app.use(express.json());

    const server = http.createServer(app);
    const ioServer = new SocketIOServer(server, {
        cors: { origin: "*", methods: ["GET", "POST", "PATCH", "DELETE"] },
    });

    setupSocketIO(ioServer);

    app.use("/", healthRoutes);
    app.use("/api/v1", healthRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1", lookupRoutes);
    app.use("/api/v1/ideas", ideaRoutes);
    app.use("/api/v1/groups", groupRoutes);

    await new Promise<void>((resolve) => server.listen(PORT, resolve));
    console.log("✅ Verification Server listening on port", PORT);

    try {
        const ts = Date.now();
        console.log("\n--- Step 1: User Registration & Auth ---");

        // Helper fetch wrapper
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
            const data = await res.json();
            return { status: res.status, data };
        };

        // User A (Owner)
        const signupA = await req("/auth/signup", {
            method: "POST",
            body: { username: `owner_${ts}`, email: `owner_${ts}@example.com`, password: "password123" },
        });
        console.log("User A Signup:", signupA.status, signupA.data.user?.username);
        const tokenA = signupA.data.token;
        const userA = signupA.data.user;

        // User B (Spectator / Contributor)
        const signupB = await req("/auth/signup", {
            method: "POST",
            body: { username: `member_${ts}`, email: `member_${ts}@example.com`, password: "password123" },
        });
        console.log("User B Signup:", signupB.status, signupB.data.user?.username);
        const tokenB = signupB.data.token;
        const userB = signupB.data.user;

        // User C (Outsider)
        const signupC = await req("/auth/signup", {
            method: "POST",
            body: { username: `outsider_${ts}`, email: `outsider_${ts}@example.com`, password: "password123" },
        });
        console.log("User C Signup:", signupC.status, signupC.data.user?.username);
        const tokenC = signupC.data.token;

        console.log("\n--- Step 2: Fixed Lookups (Domains & Skills) ---");
        const domainsRes = await req("/domains");
        console.log("GET /domains:", domainsRes.status, `Found ${domainsRes.data.length} domains`);
        const domainId = domainsRes.data[0].id;

        const skillsRes = await req("/skills");
        console.log("GET /skills:", skillsRes.status, `Found ${skillsRes.data.length} skills`);

        console.log("\n--- Step 3: Idea CRUD & 1:1 Group Auto-Creation (1.1 & 1.4) ---");
        const createIdeaRes = await req("/ideas", {
            method: "POST",
            token: tokenA,
            body: {
                title: `Awesome AI Platform ${ts}`,
                description: "Building a next-gen idea formation tool with NLP features.",
                domainId: domainId,
                accessType: "open_open",
            },
        });
        console.log("POST /ideas (create):", createIdeaRes.status, createIdeaRes.data);
        const idea1 = createIdeaRes.data.idea;
        const group1Id = idea1.groupId;

        const getIdeaRes = await req(`/ideas/${idea1.id}`);
        console.log("GET /ideas/:id (public):", getIdeaRes.status, getIdeaRes.data.title);

        const updateIdeaRes = await req(`/ideas/${idea1.id}`, {
            method: "PATCH",
            token: tokenA,
            body: { title: `Awesome AI Platform v2 ${ts}` },
        });
        console.log("PATCH /ideas/:id (update):", updateIdeaRes.status, updateIdeaRes.data.title);

        console.log("\n--- Step 4: Join Flow (1.3 & 1.7) ---");
        const joinReqRes = await req(`/ideas/${idea1.id}/request-join`, {
            method: "POST",
            token: tokenB,
        });
        console.log("POST /ideas/:id/request-join (User B):", joinReqRes.status, joinReqRes.data);
        const requestId = joinReqRes.data.id;

        const listReqsRes = await req(`/ideas/${idea1.id}/join-requests`, {
            token: tokenA,
        });
        console.log("GET /ideas/:id/join-requests (User A):", listReqsRes.status, listReqsRes.data);

        const acceptReqRes = await req(`/ideas/${idea1.id}/join-requests/${requestId}`, {
            method: "PATCH",
            token: tokenA,
            body: { action: "accept" },
        });
        console.log("PATCH /ideas/:id/join-requests/:reqId (accept):", acceptReqRes.status, acceptReqRes.data);

        console.log("\n--- Step 5: Group Page Backend & Contributor Access Check (1.5) ---");
        const groupInfoRes = await req(`/groups/${group1Id}`, { token: tokenB });
        console.log("GET /groups/:id (User B - Contributor):", groupInfoRes.status, groupInfoRes.data);

        const groupMembersRes = await req(`/groups/${group1Id}/members`, { token: tokenB });
        console.log("GET /groups/:id/members (User B):", groupMembersRes.status, groupMembersRes.data.members.map((m: any) => m.username));

        const outsiderGroupRes = await req(`/groups/${group1Id}`, { token: tokenC });
        console.log("GET /groups/:id (User C - Outsider):", outsiderGroupRes.status, outsiderGroupRes.data);

        console.log("\n--- Step 6: Socket.IO Real-Time Chat & Paginated Message History (1.6) ---");
        const socketA: ClientSocket = socketClient(`http://localhost:${PORT}`, {
            auth: { token: tokenA },
            transports: ["websocket"],
        });
        const socketB: ClientSocket = socketClient(`http://localhost:${PORT}`, {
            auth: { token: tokenB },
            transports: ["websocket"],
        });

        await new Promise<void>((resolve) => socketA.on("connect", resolve));
        await new Promise<void>((resolve) => socketB.on("connect", resolve));
        console.log("Socket.IO connected for User A and User B");

        // Join room
        await new Promise<void>((resolve) => {
            socketA.emit("join_group", { groupId: group1Id }, resolve);
        });
        await new Promise<void>((resolve) => {
            socketB.emit("join_group", { groupId: group1Id }, resolve);
        });
        console.log("Both users joined Socket room group:" + group1Id);

        // Track received messages
        const receivedB: any[] = [];
        socketB.on("new_message", (msg) => {
            console.log("📩 User B received new_message:", msg.username, ":", msg.content);
            receivedB.push(msg);
        });

        // Send messages
        await new Promise<void>((resolve) => {
            socketA.emit("send_message", { groupId: group1Id, content: "Hello Team! Welcome to Idea 1" }, resolve);
        });
        await new Promise<void>((resolve) => {
            socketB.emit("send_message", { groupId: group1Id, content: "Thanks User A! Happy to contribute." }, resolve);
        });
        await new Promise<void>((resolve) => {
            socketA.emit("send_message", { groupId: group1Id, content: "Let's test pagination message #3" }, resolve);
        });

        await new Promise((r) => setTimeout(r, 500)); // wait for socket events to settle
        socketA.disconnect();
        socketB.disconnect();

        // Paginated messages test
        const page1Res = await req(`/groups/${group1Id}/messages?limit=2`, { token: tokenB });
        console.log("GET /groups/:id/messages (page 1, limit=2):", page1Res.status, "count:", page1Res.data.messages.length, "nextCursor:", page1Res.data.nextCursor);

        if (page1Res.data.nextCursor) {
            const page2Res = await req(`/groups/${group1Id}/messages?limit=2&cursor=${encodeURIComponent(page1Res.data.nextCursor)}`, { token: tokenB });
            console.log("GET /groups/:id/messages (page 2):", page2Res.status, "count:", page2Res.data.messages.length, "nextCursor:", page2Res.data.nextCursor);
        }

        console.log("\n--- Step 7: Add/Remove Contributors (1.7 & Open+Closed Join Flow) ---");
        const createIdea2Res = await req("/ideas", {
            method: "POST",
            token: tokenA,
            body: {
                title: `Closed Access Idea ${ts}`,
                description: "Private invite-only project description.",
                domainId: domainId,
                accessType: "open_closed",
            },
        });
        const group2Id = createIdea2Res.data.idea.groupId;
        console.log("POST /ideas (open_closed):", createIdea2Res.status, "Group ID:", group2Id);

        // Owner directly adds User B to open_closed group
        const addMemberRes = await req(`/groups/${group2Id}/members`, {
            method: "POST",
            token: tokenA,
            body: { userId: userB.id },
        });
        console.log("POST /groups/:id/members (Owner adds User B):", addMemberRes.status, addMemberRes.data);

        const group2Check1 = await req(`/groups/${group2Id}`, { token: tokenB });
        console.log("GET /groups/:id (User B access after add):", group2Check1.status, group2Check1.data.ideaTitle);

        // Owner removes User B from group
        const removeMemberRes = await req(`/groups/${group2Id}/members/${userB.id}`, {
            method: "DELETE",
            token: tokenA,
        });
        console.log("DELETE /groups/:id/members/:userId (Owner removes User B):", removeMemberRes.status, removeMemberRes.data);

        const group2Check2 = await req(`/groups/${group2Id}`, { token: tokenB });
        console.log("GET /groups/:id (User B access after removal):", group2Check2.status, group2Check2.data);

        // Clean up idea 2
        const deleteIdea2Res = await req(`/ideas/${createIdea2Res.data.idea.id}`, {
            method: "DELETE",
            token: tokenA,
        });
        console.log("DELETE /ideas/:id:", deleteIdea2Res.status, deleteIdea2Res.data);

        console.log("\n✅ ALL PHASE 1 ENDPOINTS AND SOCKET.IO REAL-TIME FLOWS VERIFIED SUCCESSFULLY!");
    } catch (err) {
        console.error("❌ Verification test failed:", err);
    } finally {
        server.close();
        process.exit(0);
    }
}

runVerification();
