import { Response, Request, NextFunction } from "express"

export class CustomErrorHandler extends Error {
    statusCode: number
    constructor(msg: string, statusCode?: number) {
        super(msg)
        this.statusCode = statusCode || 500
    }
}

export async function ErrorHandlingMiddleware(err: CustomErrorHandler, req: Request, res: Response, next: NextFunction) {
    err.statusCode = err.statusCode || 500

    return res.status(err.statusCode).json({
        err: err.message
    })
}