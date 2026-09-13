import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { AuthenticatedUser } from "../middleware/auth";
import { checkContributorAccess } from "../controllers/groupController";
import { db, groupMessages, users, eq } from "../../../packages/db/index";
import { createMessageSchema } from "../../../packages/types";


const JWT_SECRET = process.env.JWT_SECRET || "embedra_super_secret_jwt_key_2026";

interface CustomSocket extends Socket {
    data: {
        user?: AuthenticatedUser;
    };
}

export function setupSocketIO(io: SocketIOServer) {
    // 1. Wire Redis Adapter for multi-instance scaling if REDIS_URL is configured
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        try {
            const pubClient = new Redis(redisUrl);
            const subClient = pubClient.duplicate();

            pubClient.on("error", (err) => console.warn("⚠️ Redis pubClient error:", err.message));
            subClient.on("error", (err) => console.warn("⚠️ Redis subClient error:", err.message));

            io.adapter(createAdapter(pubClient, subClient));
            console.log("⚡ Socket.IO Redis Adapter configured successfully!");
        } catch (err: any) {
            console.warn("⚠️ Redis Adapter setup skipped/failed:", err.message);
        }
    } else {
        console.log("ℹ️ No REDIS_URL found — running Socket.IO in in-memory single instance mode.");
    }

    // 2. Authentication Middleware
    io.use((socket: CustomSocket, next) => {
        const token =
            socket.handshake.auth?.token ||
            (socket.handshake.headers?.authorization &&
                socket.handshake.headers.authorization.startsWith("Bearer ")
                ? socket.handshake.headers.authorization.split(" ")[1]
                : null);

        if (!token) {
            return next(new Error("Authentication error: Token missing"));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
            socket.data.user = decoded;
            next();
        } catch (err) {
            return next(new Error("Authentication error: Invalid or expired token"));
        }
    });

    // 3. Connection & Event Handlers
    io.on("connection", (socket: CustomSocket) => {
        const user = socket.data.user;
        console.log(`🔌 Socket connected: ${user?.username} (${socket.id})`);

        // Handler: Join group room
        socket.on("join_group", async (data: { groupId: string }, callback?: Function) => {
            try {
                const { groupId } = data;
                if (!user?.userId || !groupId) {
                    if (callback) callback({ status: "error", error: "Invalid payload" });
                    return;
                }

                const isContributor = await checkContributorAccess(groupId, user.userId);
                if (!isContributor) {
                    socket.emit("group_error", { error: "Access denied: contributor-only space" });
                    if (callback) callback({ status: "error", error: "Contributor access required" });
                    return;
                }

                const roomName = `group:${groupId}`;
                await socket.join(roomName);
                console.log(`👤 User ${user.username} joined room ${roomName}`);

                socket.emit("joined_group", { groupId, room: roomName });
                if (callback) callback({ status: "ok", room: roomName });
            } catch (err: any) {
                console.error("join_group error:", err);
                socket.emit("group_error", { error: "Failed to join group" });
            }
        });

        // Handler: Leave group room
        socket.on("leave_group", async (data: { groupId: string }) => {
            const { groupId } = data;
            if (groupId) {
                const roomName = `group:${groupId}`;
                await socket.leave(roomName);
                console.log(`👤 User ${user?.username} left room ${roomName}`);
            }
        });

        // Handler: Send real-time chat message
        socket.on("send_message", async (data: { groupId: string; content: string; imageUrl?: string }, callback?: Function) => {
            try {
                if (!user?.userId) {
                    if (callback) callback({ status: "error", error: "Unauthorized" });
                    return;
                }

                const { groupId, content, imageUrl } = data;
                if (!groupId) {
                    if (callback) callback({ status: "error", error: "groupId is required" });
                    return;
                }

                const parseResult = createMessageSchema.safeParse({ content, imageUrl });
                if (!parseResult.success) {
                    socket.emit("message_error", { error: "Validation failed", details: parseResult.error.flatten() });
                    if (callback) callback({ status: "error", error: "Validation failed" });
                    return;
                }

                const isContributor = await checkContributorAccess(groupId, user.userId);
                if (!isContributor) {
                    socket.emit("message_error", { error: "Access denied: contributor-only space" });
                    if (callback) callback({ status: "error", error: "Contributor access required" });
                    return;
                }

                // Insert message into DB
                const [newMessage] = await db
                    .insert(groupMessages)
                    .values({
                        groupId,
                        userId: user.userId,
                        content: parseResult.data.content,
                        imageUrl: parseResult.data.imageUrl || null,
                    })
                    .returning();

                // Fetch sender user details
                const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId));

                const formattedMessage = {
                    id: newMessage.id,
                    groupId: newMessage.groupId,
                    userId: newMessage.userId,
                    username: dbUser?.username || user.username,
                    profilePicUrl: dbUser?.profilePicUrl || null,
                    content: newMessage.content,
                    imageUrl: newMessage.imageUrl,
                    createdAt: newMessage.createdAt,
                };

                // Broadcast message to room group:<groupId>
                const roomName = `group:${groupId}`;
                io.to(roomName).emit("new_message", formattedMessage);

                if (callback) callback({ status: "ok", message: formattedMessage });
            } catch (err: any) {
                console.error("send_message socket error:", err);
                socket.emit("message_error", { error: "Internal error processing message" });
                if (callback) callback({ status: "error", error: "Internal server error" });
            }
        });

        socket.on("disconnect", () => {
            console.log(`🔌 Socket disconnected: ${user?.username} (${socket.id})`);
        });
    });
}
