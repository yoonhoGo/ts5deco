/**
 * 타입 에러 데모 - 실제 컴파일 에러 발생 예시
 * 
 * 이 파일의 주석을 제거하면 실제 TypeScript 컴파일 에러가 발생합니다.
 * 각 에러는 명확한 메시지와 함께 어떤 상태 코드가 허용되는지 알려줍니다.
 */

import { Request, Response, NextFunction } from 'express';
import {
  createStrictTypedRoutes,
  StrictJsonResponse,
  AllowedApiResponses
} from '../src/decorators/strict-typed-route';

// OpenAPI에서 생성된 타입들
import type { paths } from './types/generated/api';

const StrictRoutes = createStrictTypedRoutes<paths>();

export class TypeErrorDemoController {

  /**
   * GET /users 엔드포인트
   * 허용된 응답: 200, 500
   * 
   * 아래 주석을 제거하면 컴파일 에러가 발생합니다.
   */
  @StrictRoutes.Get('/users')
  async getUsersWithErrors(): Promise<AllowedApiResponses<paths, '/users', 'get'>> {
    
    // ✅ 올바른 사용법
    return StrictJsonResponse.ok<paths, '/users', 'get'>({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      hasNext: false,
      hasPrev: false
    });

    // ❌ 다음 코드들의 주석을 제거하면 컴파일 에러 발생:
    
    // return StrictJsonResponse.created<paths, '/users', 'get'>([]);
    // 에러: Argument of type 'string' is not assignable to parameter of type 'true'
    // 실제 에러 메시지: "❌ Status code 201 is not allowed for get /users. Allowed status codes: 200 | 500"
    
    // return StrictJsonResponse.badRequest<paths, '/users', 'get'>({ error: 'Bad Request' });
    // 에러: "❌ Status code 400 is not allowed for get /users. Allowed status codes: 200 | 500"
    
    // return StrictJsonResponse.notFound<paths, '/users', 'get'>({ error: 'Not Found' });
    // 에러: "❌ Status code 404 is not allowed for get /users. Allowed status codes: 200 | 500"
  }

  /**
   * POST /users 엔드포인트
   * 허용된 응답: 201, 400
   * 
   * 아래 주석을 제거하면 컴파일 에러가 발생합니다.
   */
  @StrictRoutes.Post('/users')
  async createUserWithErrors(): Promise<AllowedApiResponses<paths, '/users', 'post'>> {
    
    // ✅ 올바른 사용법
    return StrictJsonResponse.created<paths, '/users', 'post'>({
      id: '1',
      name: 'John',
      email: 'john@example.com',
      createdAt: new Date().toISOString()
    });

    // ❌ 다음 코드들의 주석을 제거하면 컴파일 에러 발생:
    
    // return StrictJsonResponse.ok<paths, '/users', 'post'>({ id: '1', name: 'John' });
    // 에러: "❌ Status code 200 is not allowed for post /users. Allowed status codes: 201 | 400"
    
    // return StrictJsonResponse.notFound<paths, '/users', 'post'>({ error: 'Not Found' });
    // 에러: "❌ Status code 404 is not allowed for post /users. Allowed status codes: 201 | 400"
    
    // return StrictJsonResponse.internalError<paths, '/users', 'post'>({ error: 'Server Error' });
    // 에러: "❌ Status code 500 is not allowed for post /users. Allowed status codes: 201 | 400"
  }

  /**
   * GET /users/{id} 엔드포인트
   * 허용된 응답: 200, 404
   * 
   * 아래 주석을 제거하면 컴파일 에러가 발생합니다.
   */
  @StrictRoutes.Get('/users/{id}')
  async getUserByIdWithErrors(): Promise<AllowedApiResponses<paths, '/users/{id}', 'get'>> {
    
    // ✅ 올바른 사용법
    return StrictJsonResponse.ok<paths, '/users/{id}', 'get'>({
      id: '1',
      name: 'John',
      email: 'john@example.com'
    });

    // ❌ 다음 코드들의 주석을 제거하면 컴파일 에러 발생:
    
    // return StrictJsonResponse.created<paths, '/users/{id}', 'get'>({ id: '1', name: 'John' });
    // 에러: "❌ Status code 201 is not allowed for get /users/{id}. Allowed status codes: 200 | 404"
    
    // return StrictJsonResponse.badRequest<paths, '/users/{id}', 'get'>({ error: 'Bad Request' });
    // 에러: "❌ Status code 400 is not allowed for get /users/{id}. Allowed status codes: 200 | 404"
    
    // return StrictJsonResponse.internalError<paths, '/users/{id}', 'get'>({ error: 'Server Error' });
    // 에러: "❌ Status code 500 is not allowed for get /users/{id}. Allowed status codes: 200 | 404"
  }
}

/**
 * 잘못된 경로 사용 예시
 * 
 * 아래 주석을 제거하면 컴파일 에러가 발생합니다.
 */
export class InvalidPathController {
  
  // ❌ 존재하지 않는 경로
  // @StrictRoutes.Get('/nonexistent-path')
  // async invalidPath(): Promise<AllowedApiResponses<paths, '/nonexistent-path', 'get'>> {
  //   // 에러: Type '"/nonexistent-path"' does not satisfy the constraint 'keyof paths'
  //   return StrictJsonResponse.ok<paths, '/nonexistent-path', 'get'>({});
  // }

  // ❌ 존재하지 않는 메서드
  // @StrictRoutes.Patch('/users')
  // async invalidMethod(): Promise<AllowedApiResponses<paths, '/users', 'patch'>> {
  //   // 에러: "❌ Method patch is not defined for path /users"
  //   return StrictJsonResponse.ok<paths, '/users', 'patch'>({});
  // }
}

/**
 * 실제 테스트용 - 주석을 제거해서 에러 확인
 * 
 * 다음 클래스의 주석을 제거하고 `npm run typecheck`를 실행하면
 * 실제 컴파일 에러를 확인할 수 있습니다.
 */

/*
export class ActualErrorTestController {
  
  @StrictRoutes.Get('/users')
  async testWrongStatusCode(): Promise<AllowedApiResponses<paths, '/users', 'get'>> {
    // 이 줄의 주석을 제거하면 실제 컴파일 에러 발생:
    return StrictJsonResponse.created<paths, '/users', 'get'>([]);
  }

  @StrictRoutes.Post('/users')
  async testWrongStatusCode2(): Promise<AllowedApiResponses<paths, '/users', 'post'>> {
    // 이 줄의 주석을 제거하면 실제 컴파일 에러 발생:
    return StrictJsonResponse.ok<paths, '/users', 'post'>({ id: '1' });
  }
}
*/

/**
 * 에러 메시지 확인 방법:
 * 
 * 1. 위의 ActualErrorTestController 클래스 주석을 제거
 * 2. 터미널에서 `npm run typecheck` 실행
 * 3. 다음과 같은 에러 메시지 확인:
 * 
 * "❌ Status code 201 is not allowed for get /users. Allowed status codes: 200 | 500"
 * "❌ Status code 200 is not allowed for post /users. Allowed status codes: 201 | 400"
 * 
 * 이러한 에러 메시지는 개발자가 어떤 상태 코드를 사용해야 하는지
 * 명확하게 알려줍니다.
 */