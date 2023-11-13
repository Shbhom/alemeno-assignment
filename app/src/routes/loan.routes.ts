import express from "express"
import { checkEligibility, createLoan, getLoan, getStatement, makePayments } from "../controller/loans.controller"
const loanRouter = express.Router()

loanRouter.post("/check-eligibility", checkEligibility)
loanRouter.post("/create-loan", createLoan)
loanRouter.get("/view-loan/:loanId", getLoan)
loanRouter.post("/make-payment/:customerId/:loanId", makePayments)
loanRouter.get("/view-statement/:customerId/:loanId", getStatement)


export default loanRouter