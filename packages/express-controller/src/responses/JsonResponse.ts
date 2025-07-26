import { Response } from 'express';
import { BaseResponse } from './BaseResponse';

/**
 * JSON response class for sending JSON data with appropriate status codes
 * 
 * @template TData - The type of the JSON data
 * @template TStatus - The HTTP status code (defaults to number)
 * 
 * @example
 * ```typescript
 * // Success response with typed data
 * return new JsonResponse<User[], 200>(200, users);
 * 
 * // Created response with specific type
 * return new JsonResponse<CreateUserResponse, 201>(201, { id: 1, name: 'John' });
 * 
 * // Error response with error object
 * return new JsonResponse<ErrorResponse, 400>(400, { error: 'Invalid input' });
 * 
 * // Using without generics (still works)
 * return new JsonResponse(200, { users: [...] });
 * ```
 */
export class JsonResponse<TData = any, TStatus extends number = number> extends BaseResponse {
  constructor(statusCode: TStatus, public readonly data?: TData) {
    super(statusCode);
  }

  send(res: Response): void {
    res.status(this.statusCode).json(this.data);
  }

  /**
   * Static convenience methods for common JSON responses
   */

  /**
   * 200 OK with JSON data
   */
  static ok<TData = any>(data?: TData): JsonResponse<TData, 200> {
    return new JsonResponse<TData, 200>(200, data);
  }

  /**
   * 201 Created with JSON data
   */
  static created<TData = any>(data?: TData): JsonResponse<TData, 201> {
    return new JsonResponse<TData, 201>(201, data);
  }

  /**
   * 400 Bad Request with error data
   */
  static badRequest<TError = any>(error?: TError): JsonResponse<TError, 400> {
    return new JsonResponse<TError, 400>(400, error);
  }

  /**
   * 401 Unauthorized with error data
   */
  static unauthorized<TError = any>(error?: TError): JsonResponse<TError, 401> {
    return new JsonResponse<TError, 401>(401, error);
  }

  /**
   * 403 Forbidden with error data
   */
  static forbidden<TError = any>(error?: TError): JsonResponse<TError, 403> {
    return new JsonResponse<TError, 403>(403, error);
  }

  /**
   * 404 Not Found with error data
   */
  static notFound<TError = any>(error?: TError): JsonResponse<TError, 404> {
    return new JsonResponse<TError, 404>(404, error);
  }

  /**
   * 500 Internal Server Error with error data
   */
  static internalError<TError = any>(error?: TError): JsonResponse<TError, 500> {
    return new JsonResponse<TError, 500>(500, error);
  }
}
