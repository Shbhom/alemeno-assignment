import { Response, Request, NextFunction } from "express";

export enum statusCodes {
    OK = 200,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
}

export class CustomErrorHandler extends Error {
    statusCode: statusCodes;

    constructor(msg: string, statusCode?: number) {
        super(msg);
        this.statusCode = statusCode || 500;
        Object.setPrototypeOf(this, CustomErrorHandler.prototype);
    }
}

export async function ErrorHandlingMiddleware(err: CustomErrorHandler, req: Request, res: Response, next: NextFunction) {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error"

    return res.status(err.statusCode).json({
        error: {
            message: err.message || "Internal Server Error",
            stack: err.stack,
        },
    });
}
