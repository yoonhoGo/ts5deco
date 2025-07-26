import { Response } from 'express';
import { BaseResponse } from './BaseResponse';

/**
 * Redirect response class for HTTP redirects
 * 
 * @example
 * ```typescript
 * // Temporary redirect (302)
 * return new RedirectResponse('/login');
 * 
 * // Permanent redirect (301)
 * return new RedirectResponse('/new-path', true);
 * 
 * // Custom status redirect
 * return new RedirectResponse('/path', 307);
 * ```
 */
export class RedirectResponse extends BaseResponse {
  public readonly url: string;

  constructor(url: string, permanent?: boolean);
  constructor(url: string, statusCode: number);
  constructor(
    url: string,
    permanentOrStatusCode: boolean | number = false
  ) {
    const statusCode = typeof permanentOrStatusCode === 'number' 
      ? permanentOrStatusCode 
      : permanentOrStatusCode ? 301 : 302;
    
    super(statusCode);
    this.url = url;
  }

  send(res: Response): void {
    res.status(this.statusCode).redirect(this.url);
  }
}

/**
 * Convenience methods for common redirect responses
 */
export class RedirectResponses {
  /**
   * 302 Found (temporary redirect)
   */
  static temporary(url: string): RedirectResponse {
    return new RedirectResponse(url, 302);
  }

  /**
   * 301 Moved Permanently (permanent redirect)
   */
  static permanent(url: string): RedirectResponse {
    return new RedirectResponse(url, 301);
  }

  /**
   * 307 Temporary Redirect (preserves method)
   */
  static temporaryPreserveMethod(url: string): RedirectResponse {
    return new RedirectResponse(url, 307);
  }

  /**
   * 308 Permanent Redirect (preserves method)
   */
  static permanentPreserveMethod(url: string): RedirectResponse {
    return new RedirectResponse(url, 308);
  }
}
