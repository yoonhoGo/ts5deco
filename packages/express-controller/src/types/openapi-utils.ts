/**
 * OpenAPI 타입 유틸리티
 * openapi-typescript로 생성된 타입들을 쉽게 사용하기 위한 헬퍼들
 */

// 생성된 타입이 있을 때만 import (초기에는 주석 처리)
import type { paths, components } from './generated/api';

/**
 * OpenAPI 스키마에서 타입을 추출하는 헬퍼 타입
 * @example
 * ```typescript
 * type User = ExtractSchema<'User'>;
 * type ErrorResponse = ExtractSchema<'Error'>;
 * ```
 */
export type ExtractSchema<T extends keyof components['schemas']> = 
  components['schemas'][T];

/**
 * OpenAPI 경로에서 응답 타입을 추출하는 헬퍼 타입
 * @example
 * ```typescript
 * type GetUserResponse = ExtractResponse<'/users/{id}', 'get'>;
 * type CreateUserResponse = ExtractResponse<'/users', 'post', 201>;
 * ```
 */
export type ExtractResponse<
  TPath extends keyof paths,
  TMethod extends keyof paths[TPath],
  TStatus extends number = 200
> = TPath extends keyof paths
  ? TMethod extends keyof paths[TPath]
    ? paths[TPath][TMethod] extends { responses: any }
      ? TStatus extends keyof paths[TPath][TMethod]['responses']
        ? paths[TPath][TMethod]['responses'][TStatus] extends { 
            content: { 'application/json': infer T } 
          }
          ? T
          : never
        : never
      : never
    : never
  : never;

/**
 * OpenAPI 경로에서 요청 본문 타입을 추출하는 헬퍼 타입
 */
export type ExtractRequestBody<
  TPath extends keyof paths,
  TMethod extends keyof paths[TPath]
> = TPath extends keyof paths
  ? TMethod extends keyof paths[TPath]
    ? paths[TPath][TMethod] extends { 
        requestBody: { content: { 'application/json': infer T } } 
      }
      ? T
      : never
    : never
  : never;

/**
 * OpenAPI 경로에서 파라미터 타입을 추출하는 헬퍼 타입
 */
export type ExtractParameters<
  TPath extends keyof paths,
  TMethod extends keyof paths[TPath]
> = TPath extends keyof paths
  ? TMethod extends keyof paths[TPath]
    ? paths[TPath][TMethod] extends { parameters: infer P }
      ? P
      : never
    : never
  : never;
