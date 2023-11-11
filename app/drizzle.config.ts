import type { Config } from "drizzle-kit";
import "dotenv/config"

const DB_URL=process.env.DB_URL as string

export default {
    schema: "./drizzle/schema.ts",
    out: "./drizzle/migrations",
    driver:"pg",
    dbCredentials:{
        connectionString: DB_URL
    }
} satisfies Config