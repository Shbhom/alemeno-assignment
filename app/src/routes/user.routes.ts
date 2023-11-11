import express, { Response } from "express"
import { registerHandler } from "../controller/user.controller"
const userRouter = express.Router()

// userRouter.post("/register", (_, res: Response) => {
//     return res.status(200).json({
//         message: "heheheh"
//     })
// })

userRouter.post("/register", registerHandler)

export default userRouter