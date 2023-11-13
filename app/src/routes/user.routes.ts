import express, { Response } from "express"
import { checkEligibility, registerHandler } from "../controller/user.controller"
const userRouter = express.Router()

// userRouter.post("/register", (_, res: Response) => {
//     return res.status(200).json({
//         message: "heheheh"
//     })
// })

userRouter.post("/register", registerHandler)
userRouter.get("/checkEligibility", checkEligibility)

export default userRouter