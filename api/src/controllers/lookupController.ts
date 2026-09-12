import { Request, Response } from "express";
import { db, domains, skills, asc } from "../../../packages/db/index";

export const getDomains = async (req: Request, res: Response) => {
    try {
        const domainList = await db
            .select()
            .from(domains)
            .orderBy(asc(domains.name));
        return res.status(200).json(domainList);
    } catch (err: any) {
        console.error("Error fetching domains:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getSkills = async (req: Request, res: Response) => {
    try {
        const skillList = await db
            .select()
            .from(skills)
            .orderBy(asc(skills.name));
        return res.status(200).json(skillList);
    } catch (err: any) {
        console.error("Error fetching skills:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
