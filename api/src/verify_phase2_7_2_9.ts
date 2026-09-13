import http from "http";
import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from "./routes/authRoutes";
import lookupRoutes from "./routes/lookupRoutes";
import ideaRoutes from "./routes/ideaRoutes";
import userRoutes from "./routes/userRoutes";
import { communities, db } from "../../packages/db/index";

const PORT = 5009;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runVerification() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1", lookupRoutes);
    app.use("/api/v1/ideas", ideaRoutes);
    app.use("/api/v1/users", userRoutes);

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(PORT, resolve));
    console.log("Phase 2.7–2.9 verification server listening on", PORT);

    const jsonRequest = async (path: string, method = "GET", token?: string, body?: unknown) => {
        const response = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const data = await response.json();
        console.log(`${method} ${path} -> ${response.status}`, JSON.stringify(data));
        return { status: response.status, data };
    };

    try {
        const suffix = Date.now();
        const owner = await jsonRequest("/auth/signup", "POST", undefined, {
            username: `phase2_owner_${suffix}`, email: `phase2_owner_${suffix}@example.com`, password: "password123",
        });
        const outsider = await jsonRequest("/auth/signup", "POST", undefined, {
            username: `phase2_outsider_${suffix}`, email: `phase2_outsider_${suffix}@example.com`, password: "password123",
        });
        const ownerToken = owner.data.token as string;
        const outsiderToken = outsider.data.token as string;

        const domains = await jsonRequest("/domains");
        const [community] = await db.insert(communities).values({
            name: `Verification Community ${suffix}`,
            emailDomain: `verify-${suffix}.example.edu`,
        }).returning();

        const source = await jsonRequest("/ideas", "POST", ownerToken, {
            title: `Closed source idea ${suffix}`,
            description: "A closed idea used to verify unrestricted forking and image uploads.",
            domainId: domains.data[0].id,
            accessType: "closed",
            status: "closed",
            communityId: community.id,
        });
        const sourceId = source.data.idea.id as string;

        console.log("\n--- 2.7 Image upload, public URL fetch, and delete ---");
        const imageForm = new FormData();
        imageForm.append("image", new Blob([Uint8Array.of(137, 80, 78, 71)], { type: "image/png" }), "verification.png");
        const uploadResponse = await fetch(`${BASE_URL}/ideas/${sourceId}/images`, {
            method: "POST", headers: { Authorization: `Bearer ${ownerToken}` }, body: imageForm,
        });
        const uploadedImage = await uploadResponse.json();
        console.log(`POST /ideas/${sourceId}/images -> ${uploadResponse.status}`, JSON.stringify(uploadedImage));
        const publicFetch = await fetch(uploadedImage.imageUrl);
        console.log(`GET returned imageUrl -> ${publicFetch.status}`, uploadedImage.imageUrl);
        await jsonRequest(`/ideas/${sourceId}/images/${uploadedImage.id}`, "DELETE", ownerToken);

        console.log("\n--- 2.8 Closed-idea fork by non-contributor ---");
        const fork = await jsonRequest(`/ideas/${sourceId}/fork`, "POST", outsiderToken);
        console.log("Fork community inheritance:", fork.data.idea.communityId, "expected", community.id);
        console.log("Fork owner:", fork.data.idea.ownerId, "expected", outsider.data.user.id);
        console.log("Fork access type:", fork.data.idea.accessType, "expected open_open");
        await jsonRequest(`/ideas/${sourceId}/forks`);

        console.log("\n--- 2.9 Saved ideas: save, idempotent re-save, list, unsave ---");
        await jsonRequest(`/ideas/${sourceId}/save`, "POST", outsiderToken);
        await jsonRequest(`/ideas/${sourceId}/save`, "POST", outsiderToken);
        await jsonRequest("/users/me/saved-ideas?limit=1", "GET", outsiderToken);
        await jsonRequest(`/ideas/${sourceId}/save`, "DELETE", outsiderToken);

        console.log("✅ PHASE 2.7–2.9 VERIFICATION COMPLETE");
    } catch (error) {
        console.error("❌ Phase 2.7–2.9 verification failed:", error);
        process.exitCode = 1;
    } finally {
        server.close();
    }
}

runVerification();
