import { Response } from 'express';
import { BaseResponse } from './BaseResponse';

/**
 * JSON response class for sending JSON data with appropriate status codes
 * 
 * @example
 * ```typescript
 * // Success response
 * return new JsonResponse(200, { users: [...] });
 * 
 * // Created response
 * return new JsonResponse(201, { id: 1, name: 'John' });
 * 
 * // Error response
 * return new JsonResponse(400, { error: 'Invalid input' });
 * ```
 */
export class JsonResponse extends BaseResponse {
  constructor(statusCode: number, public readonly data?: any) {
    super(statusCode);
  }

  send(res: Response): void {
    res.status(this.statusCode).json(this.data);
  }
}

/**
 * Convenience methods for common JSON responses
 */
export class JsonResponses {
  /**
   * 200 OK with JSON data
   */
  static ok(data?: any): JsonResponse {
    return new JsonResponse(200, data);
  }

  /**
   * 201 Created with JSON data
   */
  static created(data?: any): JsonResponse {
    return new JsonResponse(201, data);
  }

  /**
   * 400 Bad Request with error data
   */
  static badRequest(error?: any): JsonResponse {
    return new JsonResponse(400, error);
  }

  /**
   * 401 Unauthorized with error data
   */
  static unauthorized(error?: any): JsonResponse {
    return new JsonResponse(401, error);
  }

  /**
   * 403 Forbidden with error data
   */
  static forbidden(error?: any): JsonResponse {
    return new JsonResponse(403, error);
  }

  /**
   * 404 Not Found with error data
   */
  static notFound(error?: any): JsonResponse {
    return new JsonResponse(404, error);
  }

  /**
   * 500 Internal Server Error with error data
   */
  static internalError(error?: any): JsonResponse {
    return new JsonResponse(500, error);
  }
}
