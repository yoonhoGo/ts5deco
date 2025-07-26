import { Response } from 'express';
import { BaseResponse } from './BaseResponse';

/**
 * No content response class for 204 No Content responses
 * Typically used for successful DELETE operations or updates with no response body
 * 
 * @example
 * ```typescript
 * // After successful delete
 * return new NoContentResponse();
 * 
 * // After successful update with no response data
 * return new NoContentResponse();
 * ```
 */
export class NoContentResponse extends BaseResponse {
  constructor() {
    super(204);
  }

  send(res: Response): void {
    res.status(204).end();
  }
}
