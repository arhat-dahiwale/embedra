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
    uploadIdeaImage, deleteIdeaImage, forkIdea, getForkCount, saveIdea, unsaveIdea,
} from "../controllers/ideaController";
import {
    submitRating,
    getIdeaRating,
} from "../controllers/ratingController";
import {
    submitContribution,
    getIdeaContributions,
} from "../controllers/contributionController";
import {
    getIdeaComments,
    addIdeaComment,
    deleteIdeaComment,
} from "../controllers/commentController";
import { authenticateToken, authenticateTokenOptional } from "../middleware/auth";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req,file,cb)=>cb(null,file.mimetype.startsWith("image/")) });

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
router.post("/:id/images", authenticateToken, upload.single("image"), uploadIdeaImage);
router.delete("/:id/images/:imageId", authenticateToken, deleteIdeaImage);
router.post("/:id/fork", authenticateToken, forkIdea);
router.get("/:id/forks", getForkCount);
router.post("/:id/save", authenticateToken, saveIdea);
router.delete("/:id/save", authenticateToken, unsaveIdea);

// Rating routes
router.get("/:id/rating", getIdeaRating);
router.post("/:id/rating", authenticateToken, submitRating);

// Contribution routes (nested under idea)
router.get("/:id/contributions", authenticateTokenOptional, getIdeaContributions);
router.post("/:id/contributions", authenticateToken, submitContribution);

// Idea comment routes
router.get("/:id/comments", getIdeaComments);
router.post("/:id/comments", authenticateToken, addIdeaComment);
router.delete("/:id/comments/:commentId", authenticateToken, deleteIdeaComment);

export default router;
