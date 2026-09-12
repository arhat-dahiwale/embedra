import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db, users, eq, or } from "../../../packages/db/index";

import { signupSchema, loginSchema } from "../../../packages/types/index";
import { AuthenticatedRequest } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "embedra_super_secret_jwt_key_2026";

export const signup = async (req: Request, res: Response) => {
    try {
        const parseResult = signupSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const { username, email, password } = parseResult.data;

        // Check if user already exists
        const existingUsers = await db
            .select()
            .from(users)
            .where(or(eq(users.email, email), eq(users.username, username)));

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "Username or email already in use" });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new user
        const [newUser] = await db
            .insert(users)
            .values({
                username,
                email,
                passwordHash,
            })
            .returning();

        // Sign JWT token
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username, email: newUser.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

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
    } catch (err: any) {
        console.error("Signup error:", err);
        return res.status(500).json({ error: "Internal server error during signup" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const parseResult = loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: "Validation failed", details: parseResult.error.flatten() });
        }

        const { email, password } = parseResult.data;

        // Find user by email
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Sign JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

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
    } catch (err: any) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal server error during login" });
    }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, req.user.userId));

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
    } catch (err: any) {
        console.error("Me endpoint error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
