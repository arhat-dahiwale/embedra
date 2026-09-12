import { Router } from "express";
import {
    getGroupById,
    getGroupMembers,
    addMember,
    removeMember,
    getGroupMessages,
} from "../controllers/groupController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All group routes are protected
router.use(authenticateToken);

router.get("/:id", getGroupById);
router.get("/:id/members", getGroupMembers);
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);
router.get("/:id/messages", getGroupMessages);

export default router;
