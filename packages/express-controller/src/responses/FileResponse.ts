import { Response } from 'express';
import { BaseResponse } from './BaseResponse';

/**
 * File response class for sending files
 * 
 * @example
 * ```typescript
 * // Send file with original name
 * return new FileResponse('/path/to/file.pdf');
 * 
 * // Send file with custom download name
 * return new FileResponse('/path/to/document.pdf', 'report.pdf');
 * 
 * // Send file as attachment (force download)
 * return new FileResponse('/path/to/file.zip', 'archive.zip', true);
 * ```
 */
export class FileResponse extends BaseResponse {
  constructor(
    public readonly filePath: string,
    public readonly filename?: string,
    public readonly asAttachment: boolean = false
  ) {
    super(200);
  }

  send(res: Response): void {
    if (this.asAttachment) {
      if (this.filename) {
        res.status(this.statusCode).download(this.filePath, this.filename);
      } else {
        res.status(this.statusCode).download(this.filePath);
      }
    } else if (this.filename) {
      res.status(this.statusCode).sendFile(this.filePath, { 
        headers: { 'Content-Disposition': `inline; filename="${this.filename}"` }
      });
    } else {
      res.status(this.statusCode).sendFile(this.filePath);
    }
  }
}

/**
 * Convenience methods for common file responses
 */
export class FileResponses {
  /**
   * Send file for inline viewing
   */
  static inline(filePath: string, filename?: string): FileResponse {
    return new FileResponse(filePath, filename, false);
  }

  /**
   * Send file as attachment (force download)
   */
  static attachment(filePath: string, filename?: string): FileResponse {
    return new FileResponse(filePath, filename, true);
  }
}
