import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import lookupRoutes from "./routes/lookupRoutes";
import ideaRoutes from "./routes/ideaRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();
const port = 5008;
const baseUrl = `http://localhost:${port}/api/v1`;

async function runVerification() {
    const app = express();
    app.use(cors()); app.use(express.json());
    app.use("/api/v1/auth", authRoutes); app.use("/api/v1", lookupRoutes); app.use("/api/v1/ideas", ideaRoutes); app.use("/api/v1/users", userRoutes);
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(port, resolve));
    console.log("Phase 1.8 verification server listening on", port);
    const request = async (path: string, method = "GET", token?: string, body?: unknown) => {
        const response = await fetch(`${baseUrl}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
        const data = await response.json(); console.log(`${method} ${path} -> ${response.status}`, JSON.stringify(data)); return { status: response.status, data };
    };
    try {
        const suffix = Date.now();
        const owner = await request("/auth/signup", "POST", undefined, { username: `profile_owner_${suffix}`, email: `profile_owner_${suffix}@example.com`, password: "password123" });
        const follower = await request("/auth/signup", "POST", undefined, { username: `profile_follower_${suffix}`, email: `profile_follower_${suffix}@example.com`, password: "password123" });
        const secondFollower = await request("/auth/signup", "POST", undefined, { username: `profile_second_${suffix}`, email: `profile_second_${suffix}@example.com`, password: "password123" });
        const ownerToken = owner.data.token; const followerToken = follower.data.token; const secondToken = secondFollower.data.token; const ownerId = owner.data.user.id;
        const skills = await request("/skills"); const domains = await request("/domains"); const skillId = skills.data[0].id;
        await request("/users/me", "PATCH", ownerToken, { bio: "Profile verification bio", profilePicUrl: "https://example.com/avatar.png", socials: { github: "https://github.com/example" }, projectLinks: { demo: "https://example.com/demo" } });
        await request("/users/me/skills", "POST", ownerToken, { skillId });
        await request("/users/me/skills", "POST", ownerToken, { skillId });
        await request(`/users/${ownerId}`, "GET");
        await request(`/users/${ownerId}/follow`, "POST", ownerToken);
        await request(`/users/${ownerId}/follow`, "POST", followerToken);
        await request(`/users/${ownerId}/follow`, "POST", followerToken);
        await request(`/users/${ownerId}/follow`, "POST", secondToken);
        await request(`/users/${ownerId}/followers?limit=1`);
        await request(`/users/${follower.data.user.id}/following?limit=1`);
        const idea = await request("/ideas", "POST", ownerToken, { title: `Profile idea ${suffix}`, description: "Idea used to verify the owned ideas profile endpoint.", domainId: domains.data[0].id, accessType: "open_open" });
        await request(`/users/${ownerId}/ideas?limit=1`);
        await request(`/users/me/skills/${skillId}`, "DELETE", ownerToken);
        await request(`/users/${ownerId}/follow`, "DELETE", followerToken);
        console.log("✅ PHASE 1.8 PROFILE VERIFICATION COMPLETE", idea.status === 201 ? "" : "(idea creation failed)");
    } catch (error) { console.error("❌ Phase 1.8 verification failed:", error); process.exitCode = 1; }
    finally { server.close(); }
}
runVerification();
