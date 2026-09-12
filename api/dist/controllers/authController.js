"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../../../packages/db/index");
const index_2 = require("../../../packages/types/index");
const JWT_SECRET = process.env.JWT_SECRET || "embedra_super_secret_jwt_key_2026";
const signup = async (req, res) => {
    try {
        const parseResult = index_2.signupSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }
        const { username, email, password } = parseResult.data;
        // Check if user already exists
        const existingUsers = await index_1.db
            .select()
            .from(index_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(index_1.users.email, email), (0, drizzle_orm_1.eq)(index_1.users.username, username)));
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "Username or email already in use" });
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Insert new user
        const [newUser] = await index_1.db
            .insert(index_1.users)
            .values({
            username,
            email,
            passwordHash,
        })
            .returning();
        // Sign JWT token
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id, username: newUser.username, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });
        const sanitizedUser = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            bio: newUser.bio,
            profilePicUrl: newUser.profilePicUrl,
            socials: newUser.socials,
            projectLinks: newUser.projectLinks,
            createdAt: newUser.createdAt,
        };
        return res.status(201).json({ token, user: sanitizedUser });
    }
    catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ error: "Internal server error during signup" });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const parseResult = index_2.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }
        const { email, password } = parseResult.data;
        // Find user by email
        const [user] = await index_1.db
            .select()
            .from(index_1.users)
            .where((0, drizzle_orm_1.eq)(index_1.users.email, email));
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        // Compare password
        const isMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        // Sign JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        const sanitizedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            profilePicUrl: user.profilePicUrl,
            socials: user.socials,
            projectLinks: user.projectLinks,
            createdAt: user.createdAt,
        };
        return res.status(200).json({ token, user: sanitizedUser });
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal server error during login" });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const [user] = await index_1.db
            .select()
            .from(index_1.users)
            .where((0, drizzle_orm_1.eq)(index_1.users.id, req.user.userId));
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const sanitizedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            profilePicUrl: user.profilePicUrl,
            socials: user.socials,
            projectLinks: user.projectLinks,
            createdAt: user.createdAt,
        };
        return res.status(200).json({ user: sanitizedUser });
    }
    catch (err) {
        console.error("Me endpoint error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.me = me;
