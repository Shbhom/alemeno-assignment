import express, { Response } from "express"
import { registerHandler } from "../controller/user.controller"
const userRouter = express.Router()


userRouter.post("/register", registerHandler)

export default userRouter