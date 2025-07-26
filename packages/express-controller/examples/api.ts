/**
 * API 타입 별칭
 * OpenAPI 스펙에서 생성된 타입들을 쉽게 사용하기 위한 별칭 정의
 */

import type { ExtractSchema, ExtractResponse } from './openapi-utils';

// 생성된 타입이 있을 때만 import (초기에는 주석 처리)
import type { paths, components } from './types/generated/api';

/**
 * API 스키마 타입들
 * OpenAPI 스펙의 components.schemas에서 추출한 타입들
 */
export namespace API {
  // OpenAPI 스펙에서 생성된 타입 사용
  export type User = ExtractSchema<'User'>;
  export type CreateUserRequest = ExtractSchema<'CreateUserRequest'>;
  export type UpdateUserRequest = ExtractSchema<'UpdateUserRequest'>;
  export type ErrorResponse = ExtractSchema<'Error'>;
  export type PaginatedResponse<T> = ExtractSchema<'PaginatedUserResponse'> & { data: T[] };
}

/**
 * API 응답 타입들
 * 특정 엔드포인트의 응답 타입들
 */
export namespace APIResponse {
  // export type GetUser = ExtractResponse<'/users/{id}', 'get'>;
  // export type CreateUser = ExtractResponse<'/users', 'post'>;
  // export type UpdateUser = ExtractResponse<'/users/{id}', 'put'>;
  // export type DeleteUser = ExtractResponse<'/users/{id}', 'delete'>;
  // export type GetUsers = ExtractResponse<'/users', 'get'>;
}

/**
 * 간편 타입 별칭 (자주 사용하는 타입들)
 */
export type User = API.User;
export type CreateUserRequest = API.CreateUserRequest;
export type UpdateUserRequest = API.UpdateUserRequest;
export type ErrorResponse = API.ErrorResponse;
export type PaginatedResponse<T> = API.PaginatedResponse<T>;
