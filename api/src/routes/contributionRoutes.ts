import { Router } from "express";
import { approveContribution, rejectContribution } from "../controllers/contributionController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.patch("/:id/approve", approveContribution);
router.patch("/:id/reject", rejectContribution);

export default router;