import { Response } from 'express';

export class ResponseHelper {
  static success<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
    });
  }

  static created<T>(res: Response, data: T): void {
    this.success(res, data, 201);
  }

  static error(res: Response, message: string, statusCode: number = 500, details?: any): void {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        ...(details && { details }),
      },
    });
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number
  ): void {
    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  }

  static noContent(res: Response): void {
    res.status(204).send();
  }

  static badRequest(res: Response, message: string = 'Bad request'): void {
    this.error(res, message, 400);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): void {
    this.error(res, message, 403);
  }

  static notFound(res: Response, message: string = 'Not found'): void {
    this.error(res, message, 404);
  }

  static conflict(res: Response, message: string = 'Conflict'): void {
    this.error(res, message, 409);
  }

  static tooManyRequests(res: Response, message: string = 'Too many requests'): void {
    this.error(res, message, 429);
  }
}
