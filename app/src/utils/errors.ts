import { Response, Request, NextFunction } from "express"

export class CustomErroHandler extends Error {
    statusCode: number
    constructor(msg: string, statusCode?: number) {
        super(msg)
        this.statusCode = statusCode ? statusCode : 500
    }
}

export async function ErrorHandlingMiddleware(err: CustomErroHandler, req: Request, res: Response, next: NextFunction) {
    err.message = err.message || "Internal Server Error"
    err.statusCode = err.statusCode || 500

    return res.status(err.statusCode).json({
        err: err.message,
        statusCode: err.statusCode
    })
}