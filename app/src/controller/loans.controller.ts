import { Request, Response, NextFunction } from "express";
import { CustomErrorHandler, statusCodes } from "../utils/errors";
import db from "../../drizzle/drizzle.helper"
import * as path from "path"
import { calculateCreditScore, readExcel, serializedUser, determineLoanApproval, calculateEMI, calculateEndDate, isSameDayOfMonthWithinTenure, updateEMI } from "../utils/xlsx";
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
export async function getLoan(req: Request, res: Response, next: NextFunction) {
    try {
        let { loanId } = req.params

        const loanQueryResult = await db.query(`SELECT loan_id,bearer_id,loan_amount,interest_rate,monthly_payments,tenure FROM LOANS WHERE loan_id=$1`, [Number(loanId)])
        const loan = loanQueryResult.rows[0]
        const userQueryResult = await db.query(`SELECT customer_id,first_name,last_name,monthly_salary,age,phone_no FROM CUSTOMER WHERE customer_id=$1`, [loan.bearer_id])
        const user = userQueryResult.rows[0]
        if (!loan) {
            throw new CustomErrorHandler(`No loan found with loanId:${loanId}`)
        }
        const serializeResponse = {
            loan_Id: Number(loan.loan_id),
            customer: user,
            loan_amount: Number(loan.loan_amount),
            interest_rate: Number(loan.interest_rate),
            monthly_installments: Number(loan.monthly_payments),
            tenure: Number(loan.tenure)
        }
        res.status(200).json({
            serializeResponse
        })
    } catch (err: any) {
        return next(err)
    }
}

export async function makePayments(req: Request, res: Response, next: NextFunction) {
    try {
        const { customerId, loanId } = req.params
        const { amountTobePaid } = req.body
        const loanQueryResult = await db.query(`SELECT monthly_payments,tenure,start_date,end_date,"EMIs_paid_on_time" FROM LOANS WHERE loan_id=$1 AND bearer_id=$2`, [Number(loanId), Number(customerId)])
        const loan = loanQueryResult.rows[0]
        if (!loan) {
            throw new CustomErrorHandler(`No loan found for loanId:${loanId} and customerId:${customerId}`)
        }
        const EMI = Number(loan.monthly_payments)
        let date = new Date().toISOString().split('T')[0]
        let start_date = new Date(loan.start_date)
        let today = calculateEndDate(date)
        let end_date = new Date(loan.end_date)

        const isEmiDate = isSameDayOfMonthWithinTenure(today, start_date, end_date, loan.tenure)
        let updatedLoan, updatedEMI;
        if (amountTobePaid === EMI) {
            if (isEmiDate) {
                const updateLoanQuery = await db.query(`UPDATE loans SET "EMIs_paid_on_time" = "EMIs_paid_on_time" + 1 WHERE loan_id = $1 AND bearer_id = $2 RETURNING * ;`, [loanId, customerId])
                updatedLoan = updateLoanQuery.rows[0]
            }
            return res.status(200).json({
                customer_Id: customerId,
                loan
            })
        } else {
            let updatedEMI = updateEMI(amountTobePaid, EMI, Number(loan.tenure))
            const updateLoanQuery = isEmiDate ? await db.query(`UPDATE loans SET "EMIs_paid_on_time" = "EMIs_paid_on_time" + 1,monthly_payments = $1 WHERE loan_id = $2 AND bearer_id = $3 RETURNING * ;`, [updatedEMI, loanId, customerId]) : await db.query(`UPDATE loans SET monthly_payments = $1 WHERE loan_id = $2 AND bearer_id = $3 RETURNING * ;`, [updatedEMI, loanId, customerId])
            updatedLoan = updateLoanQuery.rows[0]
            return res.status(200).json({
                customerId,
                loan: updatedLoan
            })
        }
    } catch (err: any) {
        return next(err)
    }
}







