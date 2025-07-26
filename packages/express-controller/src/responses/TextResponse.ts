import { Response } from 'express';
import { BaseResponse } from './BaseResponse';

/**
 * Text response class for sending plain text with appropriate status codes
 * 
 * @template TText - The type of the text data (defaults to string)
 * @template TStatus - The HTTP status code (defaults to number)
 * 
 * @example
 * ```typescript
 * // Success text response with type safety
 * return new TextResponse<string, 200>(200, 'Operation completed successfully');
 * 
 * // Health check with literal type
 * return new TextResponse<'OK', 200>(200, 'OK');
 * 
 * // Error text with specific status
 * return new TextResponse<string, 400>(400, 'Bad Request');
 * 
 * // Using without generics (still works)
 * return new TextResponse(200, 'Hello World');
 * ```
 */
export class TextResponse<TText extends string = string, TStatus extends number = number> extends BaseResponse {
  constructor(statusCode: TStatus, public readonly text?: TText) {
    super(statusCode);
  }

  send(res: Response): void {
    res.status(this.statusCode).send(this.text || '');
  }

  /**
   * Static convenience methods for common text responses
   */

  /**
   * 200 OK with text
   */
  static ok<TText extends string = string>(text?: TText): TextResponse<TText | 'OK', 200> {
    return new TextResponse<TText | 'OK', 200>(200, (text || 'OK') as TText | 'OK');
  }

  /**
   * 201 Created with text
   */
  static created<TText extends string = string>(text?: TText): TextResponse<TText | 'Created', 201> {
    return new TextResponse<TText | 'Created', 201>(201, (text || 'Created') as TText | 'Created');
  }

  /**
   * 400 Bad Request with text
   */
  static badRequest<TText extends string = string>(text?: TText): TextResponse<TText | 'Bad Request', 400> {
    return new TextResponse<TText | 'Bad Request', 400>(400, (text || 'Bad Request') as TText | 'Bad Request');
  }

  /**
   * 401 Unauthorized with text
   */
  static unauthorized<TText extends string = string>(text?: TText): TextResponse<TText | 'Unauthorized', 401> {
    return new TextResponse<TText | 'Unauthorized', 401>(401, (text || 'Unauthorized') as TText | 'Unauthorized');
  }

  /**
   * 403 Forbidden with text
   */
  static forbidden<TText extends string = string>(text?: TText): TextResponse<TText | 'Forbidden', 403> {
    return new TextResponse<TText | 'Forbidden', 403>(403, (text || 'Forbidden') as TText | 'Forbidden');
  }

  /**
   * 404 Not Found with text
   */
  static notFound<TText extends string = string>(text?: TText): TextResponse<TText | 'Not Found', 404> {
    return new TextResponse<TText | 'Not Found', 404>(404, (text || 'Not Found') as TText | 'Not Found');
  }

  /**
   * 500 Internal Server Error with text
   */
  static internalError<TText extends string = string>(text?: TText): TextResponse<TText | 'Internal Server Error', 500> {
    return new TextResponse<TText | 'Internal Server Error', 500>(500, (text || 'Internal Server Error') as TText | 'Internal Server Error');
  }
}

