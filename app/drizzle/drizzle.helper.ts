import { migrate } from "drizzle-orm/postgres-js/migrator"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import "dotenv/config"


const connectionString = process.env.DB_URL as string

export const sql = postgres(connectionString, { max: 1 })
export const db = drizzle(sql)


async function runMigrations() {
    await migrate(db, { migrationsFolder: "./drizzle/schema.ts" })
}
    