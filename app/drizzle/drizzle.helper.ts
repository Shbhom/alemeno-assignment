import { migrate } from "drizzle-orm/node-postgres/migrator"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool, QueryResult, QueryResultRow } from "pg"
import "dotenv/config"
import * as schema from "./schema"


const connectionString = process.env.DB_URL as string

const pool = new Pool({
    connectionString: connectionString
})
const db = drizzle(pool, { schema })


async function runMigrations() {
    await migrate(db, { migrationsFolder: "./drizzle/schema.ts" })
}

const query = async<T extends QueryResultRow>(text: string, params: any[] = []): Promise<QueryResult<T>> => {
    const result = await pool.query<T>(text, params)
    return result
}

export default {
    query,
    pool
}
