import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
    schema: "./schema.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});