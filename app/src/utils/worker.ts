import * as worker_threads from 'worker_threads';
import db from '../../drizzle/drizzle.helper';
import { customerRowData, readCustomerExcel, readLoanExcel, RowData } from './xlsx'; // Adjust the path accordingly

type SerializedUser = {
    customer_id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    monthly_salary: number;
    approved_limit: number;
    current_debts: number;
};

type LoanRowData = {
    customer_id: number;
    loan_id: number;
    loan_amount: number;
    tenure: number;
    interest_rate: number;
    monthly_payment: number;
    EMIs_paid_on_time: number;
    start_date: Date;
    end_date: Date;
};

export default async function startDataIngestionWorker() {
    try {
        const loanData: RowData[] = await readLoanExcel('./loan_data.xlsx', 'Sheet1');
        const userData: customerRowData[] = await readCustomerExcel('./customer_data.xlsx', 'Sheet1');

        for (const loan of loanData) {
            const result = await db.query("INSERT INTO loans (loan_id,loan_amount, interest_rate, monthly_payments, bearer_id, start_date, end_date, tenure)VALUES($1, $2, $3, $4, $5, $6, $7);",
                [loan.loan_id,
                loan.loan_amount,
                loan.interest_rate,
                loan.monthly_payment,
                loan.customer_id,
                loan.start_date,
                loan.end_date,
                ]);

            console.log(result.rows[0])

        }

        for (const user of userData) {
            const result = await db.query("INSERT INTO customer (customer_id,first_name, last_name, phone_no, monthly_salary, approved_limit, current_debts, age)VALUES($1,$2,$3.$4,$5,$6,$7,$8);",
                [
                    user.customer_id,
                    user.first_name,
                    user.last_name,
                    user.phone_number,
                    user.monthly_salary,
                    user.approved_limit,
                    user.current_debt,
                    user.age,
                ]);
            console.log(result.rows[0])
        }

        console.log('Data ingestion task completed successfully');
    } catch (error) {
        console.error('Error in data ingestion:', error);
    }
}

if (worker_threads.isMainThread) {
    console.log('This file should be used as a worker thread.');
}
