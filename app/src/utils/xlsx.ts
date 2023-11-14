import * as excel from "exceljs"
import { CustomErrorHandler } from "./errors";


export interface LoanRowData {
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


export interface customerRowData {
    customer_id: number
    first_name: string
    last_name: string
    phone_number: number
    monthly_salary: number
    approved_limit: number
    age: number
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



export async function readLoanExcel(filePath: string, sheetName: string,): Promise<LoanRowData[]> {
    const workbook = new excel.Workbook();
    const loanRowData: LoanRowData[] = [];

    try {
        await workbook.xlsx.readFile(filePath);

        const sheet = workbook.getWorksheet(sheetName);

        if (!sheet) {
            throw new CustomErrorHandler(`unable to read sheet ${sheetName}`, 500)
        }
        sheet!.eachRow((row) => {
            if (typeof row == "undefined") {
                return;
            }
            loanRowData.push({
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

        return loanRowData;

    } catch (error: any) {
        console.error('Error reading Excel file:', error.message);
        return [];
    }
}

export async function readCustomerExcel(filePath: string, sheetName: string): Promise<customerRowData[]> {
    const workbook = new excel.Workbook();
    const customerRowData: customerRowData[] = [];

    try {
        await workbook.xlsx.readFile(filePath);

        const sheet = workbook.getWorksheet(sheetName);

        if (!sheet) {
            throw new CustomErrorHandler(`unable to read sheet ${sheetName}`, 500)
        }
        sheet!.eachRow((row) => {
            if (typeof row === "undefined") {
                return;
            } else {
                customerRowData.push({
                    customer_id: row.getCell(1).value as number,
                    first_name: row.getCell(2).value as string,
                    last_name: row.getCell(3).value as string,
                    age: row.getCell(4).value as number,
                    phone_number: row.getCell(5).value as number,
                    monthly_salary: row.getCell(6).value as number,
                    approved_limit: row.getCell(7).value as number,
                });
            }

        });

        return customerRowData;

    } catch (error: any) {
        console.error('Error reading Excel file:', error.message);
        return [];
    }
}

export function calculateCreditScore(customerId: number, userLoanData: LoanRowData[], approved_limit: number): number {
    let creditScore = 0;
    const maxCreditScore = 100;

    const userSpecificLoanData = userLoanData.filter((loan) => loan.customer_id === customerId);

    const pastLoansPaidOnTimeScore = userSpecificLoanData.reduce((score, loan) => score + loan.EMIs_paid_on_time * 0.05, 0);
    creditScore += Math.min(pastLoansPaidOnTimeScore, maxCreditScore - creditScore);

    const numberOfLoansScore = Math.min(userSpecificLoanData.length, maxCreditScore - creditScore);
    creditScore += numberOfLoansScore;


    const currentYear = new Date().getFullYear();
    const loanActivityScore = userSpecificLoanData.filter((loan) => loan.start_date.getFullYear() === currentYear).length * 10;
    creditScore += (loanActivityScore * 0.1)

    const loanVolumeScore = userSpecificLoanData.reduce((score, loan) => score + loan.loan_amount * 0.005, 0);
    if (loanVolumeScore > 100) {
        creditScore += loanVolumeScore * 0.005
    } else {
        creditScore += loanVolumeScore;
    }

    const sumOfCurrentLoans = userSpecificLoanData.reduce((sum, loan) => sum + loan.loan_amount, 0);
    if (sumOfCurrentLoans > approved_limit) {
        creditScore = 0;
    }

    return Math.round(creditScore);
}



export function determineLoanApproval(
    creditScore: number,
    userLoanData: LoanRowData[],
    loanAmount: number,
    interestRate: number,
    monthlySalary: number
): { canApprove: boolean; correctedInterestRate?: number } {
    let result: { canApprove: boolean; correctedInterestRate?: number } = { canApprove: false };

    if (creditScore > 50) {
        return { canApprove: true, correctedInterestRate: interestRate }
    } else if (creditScore > 30) {
        if (interestRate < 12) {
            result.correctedInterestRate = 12;
        }
        return { canApprove: true, correctedInterestRate: 12 || result.correctedInterestRate }
    } else if (creditScore > 10) {
        result.canApprove = true;
        if (interestRate < 16) {
            result.correctedInterestRate = 16;
        }
        return { canApprove: true, correctedInterestRate: 16 || result.correctedInterestRate }
    }

    const sumOfCurrentEMIs = userLoanData.reduce((sum, loan) => sum + loan.monthly_payment, 0);
    if (sumOfCurrentEMIs > 0.5 * monthlySalary) {
        result.canApprove = false;
    }

    return result;
}


export function calculateEMI(loanAmount: number, annualInterestRate: number, tenureInMonths: number) {
    const monthlyInterestRate = (annualInterestRate / 12) / 100;

    const tenureInDays = tenureInMonths * 30;

    const emi = loanAmount * monthlyInterestRate * Math.pow((1 + monthlyInterestRate), tenureInDays) /
        (Math.pow((1 + monthlyInterestRate), tenureInDays) - 1);

    return emi.toFixed(2);
}

export function calculateEndDate(startDate: string, tenureInMonths?: number) {
    try {
        const [year, month, date] = startDate.split('-').map(Number);
        let newMonth, newYear
        if (tenureInMonths) {
            newMonth = (month + tenureInMonths) % 12;
            newYear = year + Math.floor((month + tenureInMonths) / 12);
        }
        newMonth = month
        newYear = year

        const formattedMonth = String(newMonth).padStart(2, '0');

        const endDate = `${newYear}-${formattedMonth}-${date}`;

        return endDate;
    } catch (err: any) {
        throw new CustomErrorHandler("Cannot calculate end date for the loan");
    }
}

export function isSameDayOfMonthWithinTenure(dateToCheck: string, start_date: Date, end_date: Date, tenure: number) {
    const today = new Date(dateToCheck)

    return (
        today >= start_date &&
        today <= end_date &&
        today.getDate() === start_date.getDate()
    );
}

export function updateEMI(amountPaid: number, currentEMI: number, tenure: number): number {
    let updatedEMI = currentEMI;
    let diff, amtToBechanged = 0;
    if (currentEMI > amountPaid) {
        diff = currentEMI - amountPaid
        amtToBechanged = diff / tenure
        updatedEMI += amtToBechanged
    } else {
        diff = amountPaid - currentEMI
        amtToBechanged = diff / tenure
        updatedEMI -= amtToBechanged
    }

    return updatedEMI
}
