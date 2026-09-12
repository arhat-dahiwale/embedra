import { Router } from "express";
import { getDomains, getSkills } from "../controllers/lookupController";

const router = Router();

router.get("/domains", getDomains);
router.get("/skills", getSkills);

export default router;
