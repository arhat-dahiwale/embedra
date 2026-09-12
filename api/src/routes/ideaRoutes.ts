import { Router } from "express";
import {
    createIdea,
    getIdeaById,
    updateIdea,
    deleteIdea,
    requestJoinIdea,
    getJoinRequests,
    processJoinRequest,
    addLookingForSkill,
    removeLookingForSkill,
    regenerateInvite,
    joinViaInvite,
} from "../controllers/ideaController";
import { authenticateToken, authenticateTokenOptional } from "../middleware/auth";

const router = Router();

// Public routes (optional auth so owner-only fields are included only for the owner)
router.get("/:id", authenticateTokenOptional, getIdeaById);

// Protected routes
router.post("/", authenticateToken, createIdea);
router.patch("/:id", authenticateToken, updateIdea);
router.delete("/:id", authenticateToken, deleteIdea);

// Join flow routes
router.post("/:id/request-join", authenticateToken, requestJoinIdea);
router.get("/:id/join-requests", authenticateToken, getJoinRequests);
router.patch("/:id/join-requests/:requestId", authenticateToken, processJoinRequest);
router.post("/join-via-invite/:token", authenticateToken, joinViaInvite);

// Looking-for routes
router.post("/:id/looking-for", authenticateToken, addLookingForSkill);
router.delete("/:id/looking-for/:skillId", authenticateToken, removeLookingForSkill);

// Invite-link routes
router.post("/:id/regenerate-invite", authenticateToken, regenerateInvite);

export default router;
