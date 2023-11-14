import { Request, Response, NextFunction } from "express";
import { CustomErrorHandler, statusCodes } from "../utils/errors";
import "dotenv/config"
import db from "../../drizzle/drizzle.helper"

const connectionString = process.env.DB_URL as string

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { first_name, last_name, phone_number, age, monthly_salary } = req.body

        if (!first_name || typeof first_name !== "string" || !last_name || typeof first_name !== "string" || !phone_number || typeof phone_number !== "number" || !age || typeof phone_number !== "number" || !monthly_salary || typeof phone_number !== "number") {
            throw new CustomErrorHandler("invalid input or input types", statusCodes.BAD_REQUEST)
        }


        let approved_limit = 36 * monthly_salary
        approved_limit = Math.round(approved_limit / 100000) * 100000

        const result = await db.query("INSERT INTO CUSTOMER (first_name,last_name,phone_no,age,monthly_salary,approved_limit) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", [first_name, last_name, phone_number, age, monthly_salary, approved_limit])
        const insertedUser = result.rows[0]

        return res.status(200).json({
            customerId: insertedUser.customer_id as number,
            name: `${insertedUser.first_name} ${insertedUser.last_name}` as string,
            age: insertedUser.age as number,
            monthly_Income: insertedUser.monthly_salary as number,
            approved_limit: insertedUser.approved_limit as number,
            phone_number: insertedUser.phone_no as number
        })

    } catch (err: any) {
        return next(err)
    }
}
