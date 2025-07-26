import { Response } from 'express';

/**
 * Abstract base class for all HTTP responses
 * Provides a consistent interface for handling different response types
 */
export abstract class BaseResponse {
  constructor(public readonly statusCode: number) {}

  /**
   * Sends the response using the Express Response object
   * @param res Express Response object
   */
  abstract send(res: Response): void;
}
