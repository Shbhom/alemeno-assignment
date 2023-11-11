import { migrate } from "drizzle-orm/postgres-js/migrator"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import "dotenv/config"
import * as schema from "./schema"


const connectionString = process.env.DB_URL as string

const sql = postgres(connectionString, { max: 1 })
const db = drizzle(sql, { schema })


async function runMigrations() {
    await migrate(db, { migrationsFolder: "./drizzle/schema.ts" })
}
