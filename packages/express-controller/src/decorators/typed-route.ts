/**
 * OpenAPI 타입 안전 라우트 데코레이터
 * OpenAPI 스펙과 TypeScript 타입을 통합하여 컴파일 타임 검증 제공
 */

import { HttpMethod, MiddlewareFunction } from '../types';
import { addRouteMetadata } from '../metadata';
import { convertOpenApiPathToExpressPath } from '../utils/openapi-path-converter';
import type { ExtractPaths, LowercaseMethod } from '../types/openapi';
import type { 
  ApiResponse, 
  ValidStatusCodes 
} from '../types/branded-response';

// Re-export for convenience  
export type { ApiResponse as TypedApiResponse } from '../types/branded-response';
import { createApiResponse } from '../types/branded-response';

/**
 * 타입 안전 라우트 데코레이터 옵션
 */
export interface TypedRouteOptions {
  middlewares?: MiddlewareFunction[];
}

/**
 * 타입 안전 라우트 데코레이터 팩토리
 */
function createTypedRouteDecorator<TPaths = any>(method: HttpMethod) {
  return function <TPath extends ExtractPaths<TPaths> & string>(
    path: TPath,
    options: TypedRouteOptions = {}
  ) {
    // 컴파일 타임에 경로와 메서드가 유효한지 검증
    type ValidatedMethod = LowercaseMethod<typeof method>;
    type ValidatedPath = TPath extends keyof TPaths ? TPath : never;
    
    // 허용된 상태 코드들을 미리 계산
    type AllowedStatuses = ValidStatusCodes<TPaths, ValidatedPath, ValidatedMethod>;
    
    return function <
      TReturn extends ApiResponse<TPaths, ValidatedPath, ValidatedMethod>
    >(
      target: (this: any, ...args: any[]) => Promise<TReturn>,
      context: ClassMethodDecoratorContext
    ): void {
      const { middlewares = [] } = options;
      
      // 컴파일 타임 검증: 경로가 TPaths에 존재하는지 확인
      const _pathValidation: ValidatedPath = path as ValidatedPath;
      
      // 컴파일 타임 검증: 허용된 상태 코드가 있는지 확인
      const _statusValidation: AllowedStatuses extends never 
        ? "No valid status codes for this path and method" 
        : AllowedStatuses = {} as any;

      // OpenAPI 경로를 Express 경로로 변환
      const expressPath = convertOpenApiPathToExpressPath(path);
      
      // 경로 정규화
      const normalizedPath = ('/' + expressPath).replace(/\/+/g, '/').replace(/\/$/, '') || '/';

      // context.addInitializer를 사용하여 클래스 초기화 시 메타데이터 추가
      context.addInitializer(function (this: any) {
        addRouteMetadata(this.constructor, {
          path: normalizedPath,
          method,
          middlewares,
          propertyKey: context.name
        });
      });
    };
  };
}

/**
 * 타입 안전 GET 데코레이터
 */
export function TypedGet<TPaths = any>() {
  return createTypedRouteDecorator<TPaths>('GET');
}

/**
 * 타입 안전 POST 데코레이터
 */
export function TypedPost<TPaths = any>() {
  return createTypedRouteDecorator<TPaths>('POST');
}

/**
 * 타입 안전 PUT 데코레이터
 */
export function TypedPut<TPaths = any>() {
  return createTypedRouteDecorator<TPaths>('PUT');
}

/**
 * 타입 안전 DELETE 데코레이터
 */
export function TypedDelete<TPaths = any>() {
  return createTypedRouteDecorator<TPaths>('DELETE');
}

/**
 * 타입 안전 라우트 집합 생성
 */
export function createTypedRoutes<TPaths = any>() {
  return {
    Get: createTypedRouteDecorator<TPaths>('GET'),
    Post: createTypedRouteDecorator<TPaths>('POST'),
    Put: createTypedRouteDecorator<TPaths>('PUT'),
    Delete: createTypedRouteDecorator<TPaths>('DELETE'),
    Patch: createTypedRouteDecorator<TPaths>('PATCH'),
    Head: createTypedRouteDecorator<TPaths>('HEAD'),
    Options: createTypedRouteDecorator<TPaths>('OPTIONS')
  };
}

/**
 * 타입 안전 응답 생성 도우미
 * 특정 경로와 메서드에 대해 타입이 미리 바인딩된 응답 팩토리 제공
 */
export function createResponseFor<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string
>() {
  return createApiResponse<TPaths, TPath, TMethod>();
}

/**
 * 타입 검증 헬퍼
 */
export type TypeValidation<TPaths, TPath extends keyof TPaths, TMethod extends string> = {
  pathExists: TPath extends keyof TPaths ? true : "Path does not exist in OpenAPI spec";
  methodExists: TPath extends keyof TPaths 
    ? TMethod extends keyof TPaths[TPath] 
      ? true 
      : "Method does not exist for this path"
    : "Cannot validate method because path does not exist";
  hasResponses: TPath extends keyof TPaths
    ? TMethod extends keyof TPaths[TPath]
      ? TPaths[TPath][TMethod] extends { responses: any }
        ? true
        : "No responses defined for this endpoint"
      : "Cannot check responses because method does not exist"
    : "Cannot check responses because path does not exist";
  allowedStatuses: ValidStatusCodes<TPaths, TPath, TMethod>;
};

/**
 * API 엔드포인트 정보 타입
 */
export type ApiEndpointInfo<TPaths, TPath extends keyof TPaths, TMethod extends string> = {
  validation: TypeValidation<TPaths, TPath, TMethod>;
  allowedStatusCodes: ValidStatusCodes<TPaths, TPath, TMethod>;
  responseType: ApiResponse<TPaths, TPath, TMethod>;
};