import { Request, Response, NextFunction } from "express";
import { CustomErrorHandler, statusCodes } from "../utils/errors";
import db from "../../drizzle/drizzle.helper"
import * as path from "path"
import { calculateCreditScore, readLoanExcel, serializedUser, determineLoanApproval, calculateEMI, calculateEndDate, isSameDayOfMonthWithinTenure, updateEMI } from "../utils/xlsx";
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
            loan_id: loan.loan_id,
            customer_id: loan.bearer_id,
            loan_approved: true,
            message: "congratulations on loan approval",
            monthly_installments: EMI
        })

    } catch (err: any) {
        return next(err)
    }
}
export async function checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
        const { customer_id, loan_amount, interest_rate, tenure } = req.body
        const loan_path = path.resolve("./loan_data.xlsx")
        const userLoanData = await readLoanExcel(loan_path, "Sheet1")
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
        const EMI = calculateEMI(loan_amount, interest_rate, tenure)
        const creditScore = calculateCreditScore(serializedUser.customerId, userLoanData, serializedUser.approved_limit)
        const { canApprove, correctedInterestRate } = determineLoanApproval(creditScore, userLoanData, loan_amount, interest_rate, serializedUser.monthly_Income);

        const responseBody = {
            customer_id,
            approval: canApprove,
            interest_rate: interest_rate,
            correctedInterestRate: correctedInterestRate,
            tenure: tenure,
            monthly_Installments: EMI
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
        res.status(200).json({
            loan_Id: Number(loan.loan_id),
            customer: user,
            loan_amount: Number(loan.loan_amount),
            interest_rate: Number(loan.interest_rate),
            monthly_installments: Number(loan.monthly_payments),
            tenure: Number(loan.tenure)
        })
    } catch (err: any) {
        return next(err)
    }
}

export async function makePayments(req: Request, res: Response, next: NextFunction) {
    try {
        const { customerId, loanId } = req.params;
        const { amountTobePaid } = req.body;

        // Fetch loan details from the database
        const loanQueryResult = await db.query(
            `SELECT loan_id, bearer_id, monthly_payments, tenure, start_date, end_date, "EMIs_paid", "EMIs_paid_on_time"
             FROM LOANS 
             WHERE loan_id = $1 AND bearer_id = $2`,
            [Number(loanId), Number(customerId)]
        );

        const loan = loanQueryResult.rows[0];

        if (!loan) {
            throw new CustomErrorHandler(`No loan found for loanId:${loanId} and customerId:${customerId}`);
        }

        const { monthly_payments, tenure, start_date, end_date, EMIs_paid, EMIs_paid_on_time } = loan;

        if (tenure > EMIs_paid) {
            let date = new Date().toISOString().split('T')[0];
            let today = calculateEndDate(date);

            const isEmiDate = isSameDayOfMonthWithinTenure(today, new Date(start_date), new Date(end_date), tenure);

            if (amountTobePaid === monthly_payments) {
                const updateLoanQuery = await db.query(
                    `UPDATE LOANS 
                     SET "EMIs_paid" = "EMIs_paid" + 1,
                         "EMIs_paid_on_time" = CASE WHEN $1 THEN "EMIs_paid_on_time" + 1 ELSE "EMIs_paid_on_time" END
                     WHERE loan_id = $2 AND bearer_id = $3
                     RETURNING *;`,
                    [isEmiDate, loanId, customerId]
                );
                const updatedLoan = updateLoanQuery.rows[0];

                return res.status(200).json({
                    customerId,
                    loan: updatedLoan
                });
            } else {
                const updatedEMI = updateEMI(amountTobePaid, monthly_payments, tenure);

                const updateLoanQuery = await db.query(
                    `UPDATE LOANS 
                     SET "EMIs_paid" = "EMIs_paid" + 1,
                         "EMIs_paid_on_time" = CASE WHEN $1 THEN "EMIs_paid_on_time" + 1 ELSE "EMIs_paid_on_time" END,
                         monthly_payments = $2
                     WHERE loan_id = $3 AND bearer_id = $4
                     RETURNING *;`,
                    [isEmiDate, updatedEMI, loanId, customerId]
                );

                const updatedLoan = updateLoanQuery.rows[0];

                return res.status(200).json({
                    customerId,
                    loan: updatedLoan
                });
            }
        } else {
            return res.status(400).json({
                error: "No EMIs left for the loan"
            });
        }
    } catch (err: any) {
        return next(err);
    }
}




export async function getStatement(req: Request, res: Response, next: NextFunction) {
    try {
        const { customerId, loanId } = req.params;
        const loanQuery = await db.query("SELECT * FROM LOANS WHERE loan_id=$1 AND bearer_id=$2;", [loanId, customerId]);
        const loan = loanQuery.rows[0];

        const repayments_left = loan.tenure - loan.EMIs_paid
        const amount_paid = loan.loan_amount - (repayments_left * loan.tenure)

        res.status(200).json({
            customer_id: Number(customerId),
            loan_id: Number(loanId),
            principal: Number(loan.loan_amount),
            interest_rate: Number(loan.interest_rate),
            amount_paid: Number(amount_paid),
            monthly_installments: Number(loan.monthly_payments),
            repayments_left: Number(repayments_left),
        });
    } catch (err: any) {
        return next(err);
    }
}





