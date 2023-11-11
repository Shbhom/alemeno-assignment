import express, { NextFunction, Response } from "express"
import cookieparser from "cookie-parser"
import "dotenv/config"
import { ErrorHandlingMiddleware } from "./utils/errors"

const port = process.env.PORT
const app = express()

app.use(express.json())
app.use(cookieparser())
app.use(express.urlencoded({ extended: false }))

app.get("/healthCheck", (_, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json({
            message: "working Fine"
        })
    } catch (err: any) {
        return next(err)

    }
})

app.use(ErrorHandlingMiddleware)

app.listen(port, async () => {
    console.log(`app is listening to port ${port}`)
})