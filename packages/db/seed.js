"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const STARTER_DOMAINS = [
    "Artificial Intelligence & Machine Learning",
    "Web Development",
    "Mobile App Development",
    "Blockchain & Web3",
    "Cybersecurity & Privacy",
    "Cloud & DevOps",
    "Data Science & Analytics",
    "Game Development",
    "Internet of Things & Hardware",
    "Healthcare & BioTech",
    "EdTech & E-Learning",
    "FinTech & E-Commerce",
];
const STARTER_SKILLS = [
    "TypeScript",
    "JavaScript",
    "Python",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "FastAPI",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "Kubernetes",
    "PyTorch",
    "TensorFlow",
    "Swift",
    "Kotlin",
    "Rust",
    "Go",
    "UI/UX Design",
    "Product Management",
];
async function seed() {
    console.log("🌱 Seeding database...");
    // Seed domains
    console.log("Seeding domains...");
    for (const domainName of STARTER_DOMAINS) {
        await index_1.db.insert(index_1.domains).values({ name: domainName }).onConflictDoNothing({ target: index_1.domains.name });
    }
    // Seed skills
    console.log("Seeding skills...");
    for (const skillName of STARTER_SKILLS) {
        await index_1.db.insert(index_1.skills).values({ name: skillName }).onConflictDoNothing({ target: index_1.skills.name });
    }
    console.log("✅ Seeding complete!");
    await index_1.pool.end();
    process.exit(0);
}
seed().catch(async (err) => {
    console.error("❌ Seeding failed:", err);
    await index_1.pool.end();
    process.exit(1);
});
