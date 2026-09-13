import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";

import authRoutes from "./routes/authRoutes";
import healthRoutes from "./routes/healthRoutes";
import lookupRoutes from "./routes/lookupRoutes";
import ideaRoutes from "./routes/ideaRoutes";
import groupRoutes from "./routes/groupRoutes";
import contributionRoutes from "./routes/contributionRoutes";
import { setupSocketIO } from "./sockets/groupSocket";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
    },
});

setupSocketIO(io);

// Mount API v1 routes (single path each)
app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", lookupRoutes);
app.use("/api/v1/ideas", ideaRoutes);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/contributions", contributionRoutes);

server.listen(PORT, () => {
    console.log(`🚀 Embedra API Server running on port ${PORT}`);
});

export { app, server, io };
export default app;
