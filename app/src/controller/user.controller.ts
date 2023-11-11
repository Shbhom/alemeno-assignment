import { Request, Response, NextFunction } from "express";
import { CustomErrorHandler } from "../utils/errors";
import { sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema"
import postgres from "postgres";
import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DB_URL as string
const queryClient = postgres({
    host: 'localhost',
    port: 5432,
    user: 'root',
    password: 'root',
    database: 'alemenodb',
})
const DB = drizzle(queryClient)


export async function registerHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { first_name, last_name, phone_number, age, monthly_salary } = req.body

        if (!first_name || typeof first_name !== "string" || !last_name || typeof first_name !== "string" || !phone_number || typeof phone_number !== "number" || !age || typeof phone_number !== "number" || !monthly_salary || typeof phone_number !== "number") {
            throw new CustomErrorHandler("invalid input or input types", 400)
        }

        console.log("passed type check")

        let approved_limit = 36 * monthly_salary
        approved_limit = Math.round(approved_limit / 100000) * 100000

        console.log("got the approved limit")


        const user = await DB.execute(sql`INSERT INTO customer (first_name, last_name, phone_no, month_salary, approved_limit, age) VALUES (${first_name}, ${last_name}, ${phone_number}, ${monthly_salary}, ${approved_limit}, ${age});`).then(() => { console.log("query completed") }).catch((err) => { throw new CustomErrorHandler(err) })
        console.log("created user")
        return res.status(200).json({
            message: "successful",
            user
        })


    } catch (err: any) {

    }
}