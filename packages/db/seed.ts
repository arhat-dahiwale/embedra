import { db, pool, skills, domains } from "./index";

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
        await db.insert(domains).values({ name: domainName }).onConflictDoNothing({ target: domains.name });
    }

    // Seed skills
    console.log("Seeding skills...");
    for (const skillName of STARTER_SKILLS) {
        await db.insert(skills).values({ name: skillName }).onConflictDoNothing({ target: skills.name });
    }

    console.log("✅ Seeding complete!");
    await pool.end();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("❌ Seeding failed:", err);
    await pool.end();
    process.exit(1);
});
