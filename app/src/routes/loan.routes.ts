import express from "express"
import { checkEligibility, createLoan } from "../controller/loans.controller"
const loanRouter = express.Router()

loanRouter.post("/check-eligibility", checkEligibility)
loanRouter.post("/create-loan", createLoan)

export default loanRouter