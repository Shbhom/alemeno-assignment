import express, { NextFunction, Response, Request } from "express"
import cookieparser from "cookie-parser"
import "dotenv/config"
import { ErrorHandlingMiddleware } from "./utils/errors"
import userRouter from "./routes/user.routes"
import loanRouter from "./routes/loan.routes"
import startDataIngestionWorker from './utils/worker';


const port = process.env.PORT
const app = express()

app.use(express.json())
app.use(cookieparser())
app.use(express.urlencoded({ extended: false }))

app.get("/healthCheck", (_, res: Response, next: NextFunction) => {
    try {
        console.log("hello")
        return res.status(200).json({
            message: "working Fine"
        })
    } catch (err: any) {
        return next(err)

    }
})

app.post("/trigger-data-ingest", async (_: Request, res: Response, next: NextFunction) => {
    try {
        const result = await startDataIngestionWorker(next).then(() => { console.log("data ingested") }).catch((err: any) => { return next(err) })
        res.status(200).json({
            message: "upload"
        })
    } catch (err: any) {
        return next(err)
    }
})

app.use("/", userRouter)
app.use("/", loanRouter)

app.use(ErrorHandlingMiddleware)

app.listen(port, async () => {
    console.log(`app is listening to port ${port}`)
})