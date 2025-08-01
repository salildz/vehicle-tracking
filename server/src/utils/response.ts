import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp: string;
  };
}

export class ResponseHelper {
  static success<T>(res: Response, data?: T, message?: string, statusCode: number = 200, meta?: any): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data?: T, message?: string): Response {
    return this.success(res, data, message, 201);
  }

  static paginated(res: any, data: any[], total: number, page: number, limit: number, message?: string) {
    return res.json({
      success: true,
      data,
      message,
      meta: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        total,
        timestamp: new Date().toISOString(),
      },
    });
  }

  static error(res: Response, message: string, statusCode: number = 500, code?: string): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
    });
  }
}
