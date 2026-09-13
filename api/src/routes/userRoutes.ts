import { Router } from "express";
import { addMySkill, followUser, getFollowers, getFollowing, getSavedIdeas, getUserIdeas, getUserProfile, removeMySkill, unfollowUser, updateMyProfile } from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
router.patch("/me", authenticateToken, updateMyProfile);
router.post("/me/skills", authenticateToken, addMySkill);
router.delete("/me/skills/:skillId", authenticateToken, removeMySkill);
router.get("/me/saved-ideas", authenticateToken, getSavedIdeas);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);
router.get("/:id/ideas", getUserIdeas);
router.post("/:id/follow", authenticateToken, followUser);
router.delete("/:id/follow", authenticateToken, unfollowUser);
router.get("/:id", getUserProfile);
export default router;
