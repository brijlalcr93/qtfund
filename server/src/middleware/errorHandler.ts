import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err.name === 'MulterError') {
    res.status(400).json({
      message: err.message,
      code: 'UPLOAD_ERROR',
    });
    return;
  }

  logger.error('Unhandled error:', { error: err.message, stack: err.stack });

  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
}
