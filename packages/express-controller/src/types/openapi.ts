/**
 * OpenAPI 타입 유틸리티
 * OpenAPI 스펙에서 생성된 타입들과 라우트 데코레이터를 연결하는 타입 시스템
 */

import type { JsonResponse } from '../responses/JsonResponse';

/**
 * OpenAPI paths 타입에서 경로 키를 추출하는 헬퍼
 */
export type ExtractPaths<TPaths> = TPaths extends { [K in keyof TPaths]: any } 
  ? keyof TPaths 
  : never;

/**
 * 경로와 메서드에서 응답 타입을 추출하는 유틸리티 타입
 */
export type ExtractResponse<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends keyof TPaths[TPath],
  TStatus extends number = 200
> = TPaths[TPath][TMethod] extends { responses: any }
  ? TStatus extends keyof TPaths[TPath][TMethod]['responses']
    ? TPaths[TPath][TMethod]['responses'][TStatus] extends {
        content: { 'application/json': infer TData }
      }
      ? TData
      : never
    : never
  : never;

/**
 * 특정 경로와 메서드의 모든 가능한 응답 상태 코드를 추출
 */
export type ExtractResponseStatuses<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends keyof TPaths[TPath]
> = TPaths[TPath][TMethod] extends { responses: infer TResponses }
  ? keyof TResponses & number
  : never;

/**
 * 경로와 메서드에서 요청 본문 타입을 추출
 */
export type ExtractRequestBody<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends keyof TPaths[TPath]
> = TPaths[TPath][TMethod] extends {
  requestBody: { content: { 'application/json': infer TData } }
}
  ? TData
  : never;

/**
 * 경로와 메서드에서 모든 가능한 응답을 JsonResponse Union으로 변환
 */
export type OpenApiResponse<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string
> = TPath extends keyof TPaths
  ? TMethod extends keyof TPaths[TPath]
    ? TPaths[TPath][TMethod] extends { responses: infer TResponses }
      ? TResponses extends Record<number, any>
        ? {
            [TStatus in keyof TResponses & number]: TResponses[TStatus] extends {
              content: { 'application/json': infer TData }
            }
              ? JsonResponse<TData, TStatus>
              : TResponses[TStatus] extends { content?: never }
              ? JsonResponse<never, TStatus>
              : never
          }[keyof TResponses & number]
        : never
      : never
    : never
  : never;

/**
 * 특정 상태 코드가 허용되는지 검사하는 타입
 */
export type IsStatusAllowed<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string,
  TStatus extends number
> = TPath extends keyof TPaths
  ? TMethod extends keyof TPaths[TPath]
    ? TPaths[TPath][TMethod] extends { responses: infer TResponses }
      ? TStatus extends keyof TResponses
        ? true
        : false
      : false
    : false
  : false;

/**
 * OpenAPI 경로를 Express 경로로 변환하는 타입
 * 예: '/users/{id}' -> '/users/:id'
 */
export type OpenApiPathToExpressPath<TPath extends string> =
  TPath extends `${infer Start}{${infer Param}}${infer Rest}`
    ? `${Start}:${Param}${OpenApiPathToExpressPath<Rest>}`
    : TPath;

/**
 * HTTP 메서드를 소문자로 변환하는 헬퍼 타입
 */
export type LowercaseMethod<TMethod extends string> = Lowercase<TMethod>;

/**
 * 타입 안전한 라우트 핸들러 타입
 */
export type TypedRouteHandler<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string
> = TMethod extends keyof TPaths[TPath]
  ? () => Promise<OpenApiResponse<TPaths, TPath, TMethod>>
  : never;

/**
 * 경로 파라미터 타입을 추출하는 유틸리티
 */
export type ExtractPathParams<TPath extends string> = 
  TPath extends `${string}{${infer Param}}${infer Rest}`
    ? { [K in Param]: string } & ExtractPathParams<Rest>
    : {};

/**
 * 쿼리 파라미터 타입을 추출하는 유틸리티
 */
export type ExtractQueryParams<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends keyof TPaths[TPath]
> = TPaths[TPath][TMethod] extends {
  parameters: { query?: infer TQuery }
}
  ? TQuery
  : never;