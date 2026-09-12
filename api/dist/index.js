"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Mount health route (both top-level and under /api/v1)
app.use("/", healthRoutes_1.default);
app.use("/api/v1", healthRoutes_1.default);
// Mount auth routes (under /api/v1/auth and /auth)
app.use("/api/v1/auth", authRoutes_1.default);
app.use("/auth", authRoutes_1.default);
app.listen(PORT, () => {
    console.log(`🚀 Embedra API Server running on port ${PORT}`);
});
exports.default = app;
