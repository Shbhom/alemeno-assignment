import * as excel from "exceljs"
import { CustomErrorHandler } from "./errors";
import { loan } from "../../drizzle/schema";


interface RowData {
    customer_id: number;
    loan_id: number;
    loan_amount: number;
    tenure: number;
    interest_rate: number;
    monthly_payment: number;
    EMIs_paid_on_time: number;
    start_date: Date;
    end_date: Date;
}

export interface serializedUser {
    customerId: number;
    name: string;
    age: number;
    monthly_Income: number;
    approved_limit: number;
    phone_number: number
    number_of_past_loans?: number;
    has_loan_activity_current_year?: boolean;
    current_debts?: number
    loan_approved_volume?: number
}

// Function to read an Excel sheet and return the data
export async function readExcel(filePath: string, sheetName: string): Promise<RowData[]> {
    const workbook = new excel.Workbook();
    const rowData: RowData[] = [];

    try {
        // Load the workbook
        await workbook.xlsx.readFile(filePath);

        // Get the specified sheet
        const sheet = workbook.getWorksheet(sheetName);

        if (!sheet) {
            throw new CustomErrorHandler(`unable to read sheet ${sheetName}`, 500)
        }

        // Process rows
        sheet!.eachRow((row) => {
            // Access cell values and push to rowData array
            rowData.push({
                customer_id: row.getCell(1).value as number,
                loan_id: row.getCell(2).value as number,
                loan_amount: row.getCell(3).value as number,
                tenure: row.getCell(4).value as number,
                interest_rate: row.getCell(5).value as number,
                monthly_payment: row.getCell(6).value as number,
                EMIs_paid_on_time: row.getCell(7).value as number,
                start_date: row.getCell(8).value as Date,
                end_date: row.getCell(9).value as Date,
            });
        });

        return rowData;

    } catch (error: any) {
        console.error('Error reading Excel file:', error.message);
        return [];
    }
}

// Function to calculate credit score based on the provided components for a specific user
export function calculateCreditScore(customerId: number, userLoanData: RowData[]): number {
    let creditScore = 0;

    const userSpecificLoanData = userLoanData.filter((loan) => loan.customer_id === customerId);

    creditScore += userSpecificLoanData.reduce((score, loan) => score + loan.EMIs_paid_on_time * 0.5, 0);

    creditScore += Math.min(userSpecificLoanData.length);

    const currentYear = new Date().getFullYear();
    const loanActivityScore = userSpecificLoanData.filter((loan) => loan.start_date.getFullYear() === currentYear).length * 10;
    creditScore += (loanActivityScore * 0.5);

    const maxLoanVolumeScore = 50; // Adjusted maximum score for loan volume
    const loanVolumeScore = Math.min(
        userSpecificLoanData.reduce((score, loan) => score + loan.loan_amount * loan.tenure * 0.005, 0),
        maxLoanVolumeScore
    );
    creditScore += loanVolumeScore;

    const sumOfCurrentLoans = userSpecificLoanData.reduce((sum, loan) => sum + loan.monthly_payment * loan.tenure, 0);
    const approvedLimit = userSpecificLoanData[0]?.loan_amount; // Assuming approved limit is the first loan amount
    if (sumOfCurrentLoans > approvedLimit) {
        creditScore = 0;
    }

    return Math.round(creditScore);
}


export function determineLoanApproval(
    creditScore: number,
    userLoanData: RowData[],
    loanAmount: number,
    interestRate: number
): { canApprove: boolean; correctedInterestRate: number } {
    let result: { canApprove: boolean; correctedInterestRate: number } = { canApprove: false, correctedInterestRate: interestRate };
    let correctedInterest_rate = 5
    if (creditScore > 50) {
        result.canApprove = true
    } else if (creditScore < 50 || creditScore > 30) {
        result.canApprove = true
        result.correctedInterestRate = 12
    } else if (creditScore < 30 || creditScore > 10) {
        result.canApprove = true
        result.correctedInterestRate = 16
    } else if (creditScore < 10) {
        result.canApprove = false
    }
    return result
}

export function calculateEMI(loanAmount: number, annualInterestRate: number, tenureInMonths: number) {
    const monthlyInterestRate = (annualInterestRate / 12) / 100;

    const tenureInDays = tenureInMonths * 30;

    const emi = loanAmount * monthlyInterestRate * Math.pow((1 + monthlyInterestRate), tenureInDays) /
        (Math.pow((1 + monthlyInterestRate), tenureInDays) - 1);

    return emi.toFixed(2);
}

export function calculateEndDate(startDate: string, tenureInMonths: number) {
    try {
        const [year, month, date] = startDate.split('-').map(Number);

        const newMonth = (month + tenureInMonths) % 12;
        const newYear = year + Math.floor((month + tenureInMonths) / 12);

        const formattedMonth = String(newMonth).padStart(2, '0');

        const endDate = `${newYear}-${formattedMonth}-${date}`;

        return endDate;
    } catch (err: any) {
        throw new CustomErrorHandler("Cannot calculate end date for the loan");
    }
}

