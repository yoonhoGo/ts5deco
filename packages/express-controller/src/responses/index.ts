// Base response class
export { BaseResponse } from './BaseResponse';

// Concrete response classes
export { JsonResponse } from './JsonResponse';
export { TextResponse } from './TextResponse';
export { NoContentResponse } from './NoContentResponse';
export { RedirectResponse, RedirectResponses } from './RedirectResponse';
export { FileResponse, FileResponses } from './FileResponse';

// Import BaseResponse for the type guard function
import { BaseResponse } from './BaseResponse';

// Type guard to check if a value is a BaseResponse
export function isBaseResponse(value: any): value is BaseResponse {
  return value instanceof BaseResponse;
}
