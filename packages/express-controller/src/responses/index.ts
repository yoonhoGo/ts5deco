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
import { JsonResponse } from './JsonResponse';
import { TextResponse } from './TextResponse';

// Type guard to check if a value is a BaseResponse
export function isBaseResponse(value: any): value is BaseResponse {
  return value instanceof BaseResponse;
}

// Backward compatibility aliases (deprecated - use JsonResponse.ok() instead)
/** @deprecated Use JsonResponse.ok() instead */
export const JsonResponses = JsonResponse;
/** @deprecated Use TextResponse.ok() instead */
export const TextResponses = TextResponse;
