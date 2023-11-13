import { Request, Response, NextFunction } from "express";
import { CustomErrorHandler, statusCodes } from "../utils/errors";
import db from "../../drizzle/drizzle.helper"
import * as path from "path"
import { calculateCreditScore, readExcel, serializedUser, determineLoanApproval, calculateEMI, calculateEndDate } from "../utils/xlsx";
import { QueryResultRow } from "pg";

export async function createLoan(req: Request, res: Response, next: NextFunction) {
    try {
        const { customer_id, loan_amount, interest_rate, tenure } = req.body
        if (!customer_id || typeof customer_id !== "number" || !loan_amount || typeof loan_amount !== "number" || !interest_rate || typeof customer_id !== "number" || !tenure || typeof tenure !== "number") {
            throw new CustomErrorHandler("invalid request object fileds", 400)
        }

        const EMI = calculateEMI(loan_amount, interest_rate, tenure)
        const startDate = new Date()
        const startDateISO = startDate.toISOString().split('T')[0]; // Extract the date part
        const endDate = calculateEndDate(startDateISO, tenure)

        const result = await db.query(`
    INSERT INTO LOANS("loan_amount", "tenure", "interest_rate", "monthly_payments", "bearer_id", "start_date", "end_date")
    VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *
`, [loan_amount, tenure, interest_rate, EMI, customer_id, startDateISO, endDate]);

        const loan = result.rows[0]
        res.status(201).json({
            loan
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
