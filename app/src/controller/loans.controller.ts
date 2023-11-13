import { Request, Response, NextFunction } from "express";
import { CustomErrorHandler } from "../utils/errors";
import db from "../../drizzle/drizzle.helper"

export async function createLoan(req: Request, res: Response, next: NextFunction) {
    const { customer_id, loan_amount, interest_rate, tenure } = req.body
    if (!customer_id || typeof customer_id !== "number" || !loan_amount || typeof loan_amount !== "number" || !interest_rate || typeof customer_id !== "number" || !tenure || typeof tenure !== "number") {
        throw new CustomErrorHandler("invalid request object fileds", 400)
    }
    const result = await db.query("INSERT INTO LOAN (loan_amount,tenure,interest_rate,monthly_payments,bearer_id,start_date,end_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",[loan_amount,tenure,interest_rate,])

}
