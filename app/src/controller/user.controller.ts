import { Request, Response, NextFunction } from "express";
import { CustomErrorHandler, statusCodes } from "../utils/errors";
import "dotenv/config"
import db from "../../drizzle/drizzle.helper"
import * as excel from "exceljs"
import * as path from "path"
import { calculateCreditScore, readExcel, serializedUser, determineLoanApproval } from "../utils/xlsx";
import { QueryResult, QueryResultRow } from "pg";

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
        const serializedUser = {
            customerId: insertedUser.customer_id as number,
            name: `${insertedUser.first_name} ${insertedUser.last_name}` as string,
            age: insertedUser.age as number,
            monthly_Income: insertedUser.monthly_salary as number,
            approved_limit: insertedUser.approved_limit as number,
            phone_number: insertedUser.phone_no as number
        }
        return res.status(200).json({
            message: "successful",
            serializedUser
        })

    } catch (err: any) {
        return next(err)
    }
}

export async function checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
        const { customer_id, loan_amount, interest_rate, tenure } = req.body
        const loan_path = path.resolve("./loan_data.xlsx")
        const userLoanData = await readExcel(loan_path, "Sheet1")
        const result = await db.query("SELECT * FROM CUSTOMER WHERE customer_id = $1", [customer_id])
        const user: serializedUser | QueryResultRow = result.rows[0]
        if (!user) {
            throw new CustomErrorHandler("No user found with customer Id", statusCodes.NOT_FOUND)
        }
        const serializedUser: serializedUser = {
            customerId: user.customer_id,
            name: `${user.first_name} ${user.last_name}`,
            age: user.age,
            monthly_Income: user.monthly_salary,
            approved_limit: user.approved_limit,
            phone_number: user.phone_no,
        }

        const creditScore = calculateCreditScore(serializedUser.customerId, userLoanData)
        const { canApprove, correctedInterestRate } = determineLoanApproval(creditScore, userLoanData, loan_amount, interest_rate);

        // Prepare response body
        const responseBody = {
            customer_id,
            approval: canApprove,
            interest_rate: correctedInterestRate,
        };


        return res.status(200).json({
            message: "completed",
            creditScore,
            responseBody
        })

    } catch (err: any) {
        return next(err)
    }

}