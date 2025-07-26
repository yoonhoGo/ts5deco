/**
 * OpenAPI 경로 형식을 Express 경로 형식으로 변환하는 유틸리티
 */

/**
 * OpenAPI 경로를 Express 경로로 변환합니다
 * @param openApiPath - OpenAPI 형식의 경로 (예: /users/{id})
 * @returns Express 형식의 경로 (예: /users/:id)
 * 
 * @example
 * ```typescript
 * convertOpenAPIPath('/users/{id}') // '/users/:id'
 * convertOpenAPIPath('/users/{userId}/posts/{postId}') // '/users/:userId/posts/:postId'
 * ```
 */
export function convertOpenAPIPath(openApiPath: string): string {
  return openApiPath.replace(/{([^}]+)}/g, ':$1');
}

/**
 * Express 경로를 OpenAPI 경로로 변환합니다
 * @param expressPath - Express 형식의 경로 (예: /users/:id)
 * @returns OpenAPI 형식의 경로 (예: /users/{id})
 * 
 * @example
 * ```typescript
 * convertExpressPath('/users/:id') // '/users/{id}'
 * convertExpressPath('/users/:userId/posts/:postId') // '/users/{userId}/posts/{postId}'
 * ```
 */
export function convertExpressPath(expressPath: string): string {
  return expressPath.replace(/:([^/]+)/g, '{$1}');
}
