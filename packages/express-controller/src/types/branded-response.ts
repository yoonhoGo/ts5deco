/**
 * 브랜드 타입을 사용한 엄격한 응답 시스템
 * TypeScript의 구조적 타이핑을 우회하여 더 엄격한 타입 검증을 제공
 */

import { JsonResponse } from '../responses/JsonResponse';

/**
 * 타입 안전한 JSON 응답
 */
export interface TypedJsonResponse<TData, TStatus extends number, TBrand extends string>
  extends JsonResponse<TData, TStatus> {
  readonly __brand: TBrand;
  readonly __statusCode: TStatus;
  readonly __data: TData;
}

/**
 * 특정 API 엔드포인트에 대한 브랜드 생성
 */
export type CreateApiBrand<
  TPath extends string,
  TMethod extends string,
  TStatus extends number
> = `api:${TPath}:${TMethod}:${TStatus}`;

/**
 * OpenAPI 경로와 메서드에 대한 허용된 상태 코드 체크
 */
export type ValidStatusCodes<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string
> = TPath extends keyof TPaths
  ? TMethod extends keyof TPaths[TPath]
    ? TPaths[TPath][TMethod] extends { responses: infer TResponses }
      ? keyof TResponses & number
      : never
    : never
  : never;

/**
 * 상태 코드 유효성 검증 타입
 */
export type AssertValidStatus<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string,
  TStatus extends number
> = TStatus extends ValidStatusCodes<TPaths, TPath, TMethod>
  ? TStatus
  : {
      error: `Status code ${TStatus} is not valid for ${TMethod} ${string & TPath}`;
      allowedCodes: ValidStatusCodes<TPaths, TPath, TMethod>;
    };

/**
 * 브랜드된 응답 타입 생성
 */
export type CreateTypedResponse<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string,
  TStatus extends number,
  TData = any
> = AssertValidStatus<TPaths, TPath, TMethod, TStatus> extends TStatus
  ? TypedJsonResponse<TData, TStatus, CreateApiBrand<string & TPath, TMethod, TStatus>>
  : never;

/**
 * 모든 허용된 응답의 Union 타입 (브랜드 포함)
 */
export type ApiResponse<
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
              ? CreateTypedResponse<TPaths, TPath, TMethod, TStatus, TData>
              : TResponses[TStatus] extends { content?: never }
              ? CreateTypedResponse<TPaths, TPath, TMethod, TStatus, never>
              : never
          }[keyof TResponses & number]
        : never
      : never
    : never
  : never;

/**
 * 브랜드된 응답 생성 팩토리
 */
export class ResponseFactory {
  /**
   * 타입과 브랜드가 일치하는 응답만 생성
   */
  static create<
    TPaths,
    TPath extends keyof TPaths,
    TMethod extends string,
    TStatus extends number,
    TData
  >(
    statusCode: TStatus,
    data?: TData
  ): CreateTypedResponse<TPaths, TPath, TMethod, TStatus, TData> {
    const response = new JsonResponse(statusCode, data) as any;
    response.__brand = `api:${String(statusCode)}:${String(statusCode)}:${statusCode}`;
    response.__statusCode = statusCode;
    response.__data = data;
    return response;
  }

  /**
   * 200 OK 전용 팩토리
   */
  static ok<
    TPaths,
    TPath extends keyof TPaths,
    TMethod extends string,
    TData
  >(
    data?: TData
  ): CreateTypedResponse<TPaths, TPath, TMethod, 200, TData> {
    return this.create<TPaths, TPath, TMethod, 200, TData>(200, data);
  }

  /**
   * 201 Created 전용 팩토리
   */
  static created<
    TPaths,
    TPath extends keyof TPaths,
    TMethod extends string,
    TData
  >(
    data?: TData
  ): CreateTypedResponse<TPaths, TPath, TMethod, 201, TData> {
    return this.create<TPaths, TPath, TMethod, 201, TData>(201, data);
  }

  /**
   * 400 Bad Request 전용 팩토리
   */
  static badRequest<
    TPaths,
    TPath extends keyof TPaths,
    TMethod extends string,
    TData
  >(
    data?: TData
  ): CreateTypedResponse<TPaths, TPath, TMethod, 400, TData> {
    return this.create<TPaths, TPath, TMethod, 400, TData>(400, data);
  }

  /**
   * 404 Not Found 전용 팩토리
   */
  static notFound<
    TPaths,
    TPath extends keyof TPaths,
    TMethod extends string,
    TData
  >(
    data?: TData
  ): CreateTypedResponse<TPaths, TPath, TMethod, 404, TData> {
    return this.create<TPaths, TPath, TMethod, 404, TData>(404, data);
  }

  /**
   * 500 Internal Server Error 전용 팩토리
   */
  static internalError<
    TPaths,
    TPath extends keyof TPaths,
    TMethod extends string,
    TData
  >(
    data?: TData
  ): CreateTypedResponse<TPaths, TPath, TMethod, 500, TData> {
    return this.create<TPaths, TPath, TMethod, 500, TData>(500, data);
  }
}

/**
 * 타입 안전한 응답 생성 헬퍼
 * OpenAPI 스펙에 정의된 상태 코드만 허용
 */
export function createApiResponse<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string
>(): TypedApiResponseFactory<TPaths, TPath, TMethod> {
  return new TypedApiResponseFactory<TPaths, TPath, TMethod>();
}

/**
 * 엄격한 API 응답 팩토리 클래스
 * 허용되지 않는 상태 코드 사용 시 컴파일 에러 발생
 */
export class TypedApiResponseFactory<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string
> {
  private _allowedStatuses!: ValidStatusCodes<TPaths, TPath, TMethod>;

  /**
   * 200 OK 응답 (허용된 경우에만 사용 가능)
   */
  ok<TData>(data?: TData): AssertValidResponse<TPaths, TPath, TMethod, 200, TData> {
    return ResponseFactory.ok<TPaths, TPath, TMethod, TData>(data) as any;
  }

  /**
   * 201 Created 응답 (허용된 경우에만 사용 가능)
   */
  created<TData>(data?: TData): AssertValidResponse<TPaths, TPath, TMethod, 201, TData> {
    return ResponseFactory.created<TPaths, TPath, TMethod, TData>(data) as any;
  }

  /**
   * 400 Bad Request 응답 (허용된 경우에만 사용 가능)
   */
  badRequest<TData>(data?: TData): AssertValidResponse<TPaths, TPath, TMethod, 400, TData> {
    return ResponseFactory.badRequest<TPaths, TPath, TMethod, TData>(data) as any;
  }

  /**
   * 404 Not Found 응답 (허용된 경우에만 사용 가능)
   */
  notFound<TData>(data?: TData): AssertValidResponse<TPaths, TPath, TMethod, 404, TData> {
    return ResponseFactory.notFound<TPaths, TPath, TMethod, TData>(data) as any;
  }

  /**
   * 500 Internal Server Error 응답 (허용된 경우에만 사용 가능)
   */
  internalError<TData>(data?: TData): AssertValidResponse<TPaths, TPath, TMethod, 500, TData> {
    return ResponseFactory.internalError<TPaths, TPath, TMethod, TData>(data) as any;
  }
}

/**
 * 응답 유효성 검증 타입
 * 허용되지 않는 상태 코드 사용 시 명시적 에러 타입 반환
 */
export type AssertValidResponse<
  TPaths,
  TPath extends keyof TPaths,
  TMethod extends string,
  TStatus extends number,
  TData
> = AssertValidStatus<TPaths, TPath, TMethod, TStatus> extends TStatus
  ? CreateTypedResponse<TPaths, TPath, TMethod, TStatus, TData>
  : AssertValidStatus<TPaths, TPath, TMethod, TStatus>;