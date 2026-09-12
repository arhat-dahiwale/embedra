import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
    userId: string;
    username: string;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return res.status(401).json({ error: "Access token missing or invalid" });
    }

    const secret = process.env.JWT_SECRET || "embedra_super_secret_jwt_key_2026";

    try {
        const decoded = jwt.verify(token, secret) as AuthenticatedUser;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

export const authenticateTokenOptional = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return next();
    }

    const secret = process.env.JWT_SECRET || "embedra_super_secret_jwt_key_2026";

    try {
        const decoded = jwt.verify(token, secret) as AuthenticatedUser;
        req.user = decoded;
    } catch (err) {
        // Invalid token — fall through as unauthenticated (public view)
    }

    next();
};
