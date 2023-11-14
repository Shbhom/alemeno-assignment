import * as worker_threads from 'worker_threads';
import db from '../../drizzle/drizzle.helper';
import { customerRowData, readCustomerExcel, readLoanExcel, LoanRowData } from './xlsx'; // Adjust the path accordingly
import { NextFunction } from 'express';

type SerializedUser = {
    customer_id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    monthly_salary: number;
    approved_limit: number;
    current_debts: number;
};

// type LoanRowData = {
//     customer_id: number;
//     loan_id: number;
//     loan_amount: number;
//     tenure: number;
//     interest_rate: number;
//     monthly_payment: number;
//     EMIs_paid_on_time: number;
//     start_date: Date;
//     end_date: Date;
// };

export default async function startDataIngestionWorker(next: NextFunction) {
    try {
        const loanData: LoanRowData[] = await readLoanExcel('./loan_data.xlsx', 'Sheet1');
        const userData: customerRowData[] = await readCustomerExcel('./customer_data.xlsx', 'Sheet1');

        console.log("userData")
        for (let i = 0; i < userData.length; i++) {
            if (i > 0) {
                const user = userData[i];
                console.log(user)
                const result = await db.query("INSERT INTO customer (customer_id,first_name, last_name, phone_no, monthly_salary, approved_limit, age)VALUES($1,$2,$3,$4,$5,$6,$7);",
                    [
                        user.customer_id,
                        user.first_name,
                        user.last_name,
                        user.phone_number,
                        user.monthly_salary,
                        user.approved_limit,
                        user.age,
                    ]);

                console.log(result.rows[0]);
            }
        }

        console.log("loanData")
        for (let i = 0; i < loanData.length; i++) {
            if (i > 0) {
                const loan = loanData[i];
                const result = await db.query("INSERT INTO loans (loan_id,loan_amount, interest_rate, monthly_payments, bearer_id, start_date, end_date, tenure)VALUES($1, $2, $3, $4, $5, $6, $7,$8);",
                    [
                        loan.loan_id,
                        loan.loan_amount,
                        loan.interest_rate,
                        loan.monthly_payment,
                        loan.customer_id,
                        loan.start_date,
                        loan.end_date,
                        loan.tenure
                    ]);

                console.log(result.rows[0]);
            }
        }



        console.log('Data ingestion task completed successfully');
    } catch (error) {
        console.error('Error in data ingestion:', error);
        return next(error)
    }
}

if (worker_threads.isMainThread) {
    console.log('This file should be used as a worker thread.');
}
