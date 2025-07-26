import { Response } from 'express';
import { BaseResponse } from './BaseResponse';

/**
 * Text response class for sending plain text with appropriate status codes
 * 
 * @example
 * ```typescript
 * // Success text response
 * return new TextResponse(200, 'Operation completed successfully');
 * 
 * // Health check
 * return new TextResponse(200, 'OK');
 * 
 * // Error text
 * return new TextResponse(400, 'Bad Request');
 * ```
 */
export class TextResponse extends BaseResponse {
  constructor(statusCode: number, public readonly text?: string) {
    super(statusCode);
  }

  send(res: Response): void {
    res.status(this.statusCode).send(this.text || '');
  }
}

/**
 * Convenience methods for common text responses
 */
export class TextResponses {
  /**
   * 200 OK with text
   */
  static ok(text?: string): TextResponse {
    return new TextResponse(200, text || 'OK');
  }

  /**
   * 201 Created with text
   */
  static created(text?: string): TextResponse {
    return new TextResponse(201, text || 'Created');
  }

  /**
   * 400 Bad Request with text
   */
  static badRequest(text?: string): TextResponse {
    return new TextResponse(400, text || 'Bad Request');
  }

  /**
   * 401 Unauthorized with text
   */
  static unauthorized(text?: string): TextResponse {
    return new TextResponse(401, text || 'Unauthorized');
  }

  /**
   * 403 Forbidden with text
   */
  static forbidden(text?: string): TextResponse {
    return new TextResponse(403, text || 'Forbidden');
  }

  /**
   * 404 Not Found with text
   */
  static notFound(text?: string): TextResponse {
    return new TextResponse(404, text || 'Not Found');
  }

  /**
   * 500 Internal Server Error with text
   */
  static internalError(text?: string): TextResponse {
    return new TextResponse(500, text || 'Internal Server Error');
  }
}
