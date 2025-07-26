/**
 * 엄격한 타입 안전한 OpenAPI 컨트롤러 예시
 * 
 * 이 예시는 더 엄격한 타입 검증을 제공하는 데코레이터를 사용합니다.
 * 잘못된 상태 코드를 사용하면 명확한 컴파일 에러 메시지가 표시됩니다.
 */

import { Request, Response, NextFunction } from 'express';
import {
  createStrictTypedRoutes,
  StrictJsonResponse,
  AllowedApiResponses
} from '../src/decorators/strict-typed-route';

// OpenAPI에서 생성된 타입들
import type { paths } from './types/generated/api';

/**
 * 엄격한 타입 안전한 라우트 데코레이터 생성
 */
const StrictRoutes = createStrictTypedRoutes<paths>();

/**
 * 엄격한 타입 검증을 사용하는 User 컨트롤러
 * 
 * 잘못된 상태 코드 사용 시 구체적인 에러 메시지가 표시됩니다.
 */
export class StrictUserController {

  /**
   * 모든 사용자 조회
   * GET /users
   * 
   * ✅ 허용된 응답: 200 (PaginatedUserResponse), 500 (Error)
   * ❌ 허용되지 않음: 201, 400, 404 등
   */
  @StrictRoutes.Get('/users')
  async getUsers(): Promise<AllowedApiResponses<paths, '/users', 'get'>> {
    try {
      const users = { data: [], total: 0, page: 1, limit: 10, hasNext: false, hasPrev: false };
      
      // ✅ 올바른 사용법
      return StrictJsonResponse.ok<paths, '/users', 'get'>(users);
      
      // ❌ 다음 코드들은 컴파일 에러를 발생시킵니다:
      // return StrictJsonResponse.created<paths, '/users', 'get'>(users);
      // 에러 메시지: "❌ Status code 201 is not allowed for get /users. Allowed status codes: 200 | 500"
      
      // return StrictJsonResponse.badRequest<paths, '/users', 'get'>({ error: 'Bad Request' });
      // 에러 메시지: "❌ Status code 400 is not allowed for get /users. Allowed status codes: 200 | 500"
      
    } catch (error) {
      // ✅ 올바른 사용법
      return StrictJsonResponse.internalError<paths, '/users', 'get'>({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch users'
      });
    }
  }

  /**
   * ID로 사용자 조회
   * GET /users/{id}
   * 
   * ✅ 허용된 응답: 200 (User), 404 (Error)
   * ❌ 허용되지 않음: 201, 400, 500 등
   */
  @StrictRoutes.Get('/users/{id}')
  async getUserById(): Promise<AllowedApiResponses<paths, '/users/{id}', 'get'>> {
    const user = { id: '1', name: 'John', email: 'john@example.com' };
    
    // ✅ 올바른 사용법
    return StrictJsonResponse.ok<paths, '/users/{id}', 'get'>(user);
    
    // 또는 사용자를 찾을 수 없는 경우:
    // return StrictJsonResponse.notFound<paths, '/users/{id}', 'get'>({
    //   error: 'NOT_FOUND',
    //   message: 'User not found'
    // });
    
    // ❌ 다음 코드들은 컴파일 에러를 발생시킵니다:
    // return StrictJsonResponse.created<paths, '/users/{id}', 'get'>(user);
    // 에러 메시지: "❌ Status code 201 is not allowed for get /users/{id}. Allowed status codes: 200 | 404"
    
    // return StrictJsonResponse.internalError<paths, '/users/{id}', 'get'>({ error: 'Server Error' });
    // 에러 메시지: "❌ Status code 500 is not allowed for get /users/{id}. Allowed status codes: 200 | 404"
  }

  /**
   * 새 사용자 생성
   * POST /users
   * 
   * ✅ 허용된 응답: 201 (User), 400 (Error)
   * ❌ 허용되지 않음: 200, 404, 500 등
   */
  @StrictRoutes.Post('/users')
  async createUser(): Promise<AllowedApiResponses<paths, '/users', 'post'>> {
    const newUser = { 
      id: '1', 
      name: 'John', 
      email: 'john@example.com', 
      createdAt: new Date().toISOString() 
    };
    
    // ✅ 올바른 사용법
    return StrictJsonResponse.created<paths, '/users', 'post'>(newUser);
    
    // 또는 유효성 검사 실패 시:
    // return StrictJsonResponse.badRequest<paths, '/users', 'post'>({
    //   error: 'VALIDATION_ERROR',
    //   message: 'Invalid data'
    // });
    
    // ❌ 다음 코드들은 컴파일 에러를 발생시킵니다:
    // return StrictJsonResponse.ok<paths, '/users', 'post'>(newUser);
    // 에러 메시지: "❌ Status code 200 is not allowed for post /users. Allowed status codes: 201 | 400"
    
    // return StrictJsonResponse.notFound<paths, '/users', 'post'>({ error: 'Not Found' });
    // 에러 메시지: "❌ Status code 404 is not allowed for post /users. Allowed status codes: 201 | 400"
  }

  /**
   * 사용자 정보 수정
   * PUT /users/{id}
   * 
   * ✅ 허용된 응답: 200 (User), 404 (Error)
   * ❌ 허용되지 않음: 201, 400, 500 등
   */
  @StrictRoutes.Put('/users/{id}')
  async updateUser(): Promise<AllowedApiResponses<paths, '/users/{id}', 'put'>> {
    const updatedUser = { 
      id: '1', 
      name: 'John Updated', 
      email: 'john.updated@example.com' 
    };
    
    // ✅ 올바른 사용법
    return StrictJsonResponse.ok<paths, '/users/{id}', 'put'>(updatedUser);
    
    // 또는 사용자를 찾을 수 없는 경우:
    // return StrictJsonResponse.notFound<paths, '/users/{id}', 'put'>({
    //   error: 'NOT_FOUND',
    //   message: 'User not found'
    // });
    
    // ❌ 다음 코드들은 컴파일 에러를 발생시킵니다:
    // return StrictJsonResponse.created<paths, '/users/{id}', 'put'>(updatedUser);
    // 에러 메시지: "❌ Status code 201 is not allowed for put /users/{id}. Allowed status codes: 200 | 404"
  }

  /**
   * 사용자 삭제
   * DELETE /users/{id}
   * 
   * ✅ 허용된 응답: 204 (no content), 404 (Error)
   * ❌ 허용되지 않음: 200, 201, 400, 500 등
   */
  @StrictRoutes.Delete('/users/{id}')
  async deleteUser(): Promise<AllowedApiResponses<paths, '/users/{id}', 'delete'>> {
    // DELETE의 경우 204 No Content가 일반적이므로 별도 처리 필요
    // 이는 JsonResponse가 아닌 NoContentResponse를 사용해야 함
    
    // ✅ 올바른 사용법 (204는 특별 처리)
    // return new NoContentResponse() as any;
    
    // 또는 사용자를 찾을 수 없는 경우:
    return StrictJsonResponse.notFound<paths, '/users/{id}', 'delete'>({
      error: 'NOT_FOUND',
      message: 'User not found'
    });
    
    // ❌ 다음 코드들은 컴파일 에러를 발생시킵니다:
    // return StrictJsonResponse.ok<paths, '/users/{id}', 'delete'>({ message: 'Deleted' });
    // 에러 메시지: "❌ Status code 200 is not allowed for delete /users/{id}. Allowed status codes: 204 | 404"
  }
}

/**
 * 타입 에러 데모
 * 
 * 다음 코드들의 주석을 제거하면 컴파일 에러가 발생합니다.
 */
export class TypeErrorDemoController {
  
  // ❌ 잘못된 경로 사용
  // @StrictRoutes.Get('/invalid-path')  // 컴파일 에러: Path is not defined in OpenAPI spec
  // async invalidPath() {
  //   return StrictJsonResponse.ok<paths, '/invalid-path', 'get'>({});
  // }

  // ❌ 잘못된 메서드 사용
  // @StrictRoutes.Patch('/users')  // 컴파일 에러: Method PATCH is not defined for path /users
  // async patchUser() {
  //   return StrictJsonResponse.ok<paths, '/users', 'patch'>({});
  // }

  @StrictRoutes.Get('/users')
  async demonstrateTypeErrors(): Promise<AllowedApiResponses<paths, '/users', 'get'>> {
    // ❌ 잘못된 상태 코드들 - 주석을 제거하면 컴파일 에러 발생
    
    // return StrictJsonResponse.created<paths, '/users', 'get'>([]);
    // 에러: "❌ Status code 201 is not allowed for get /users. Allowed status codes: 200 | 500"
    
    // return StrictJsonResponse.badRequest<paths, '/users', 'get'>({ error: 'Bad Request' });
    // 에러: "❌ Status code 400 is not allowed for get /users. Allowed status codes: 200 | 500"
    
    // return StrictJsonResponse.notFound<paths, '/users', 'get'>({ error: 'Not Found' });
    // 에러: "❌ Status code 404 is not allowed for get /users. Allowed status codes: 200 | 500"
    
    // ✅ 올바른 사용법
    return StrictJsonResponse.ok<paths, '/users', 'get'>({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      hasNext: false,
      hasPrev: false
    });
  }
}

/**
 * 사용 방법 비교
 */
export class ComparisonController {
  
  // 기존 방식 - 타입 검증 없음
  // @Get('/users')
  // async oldWay() {
  //   return JsonResponse.created([]); // 어떤 상태 코드든 허용됨
  // }

  // 새로운 방식 - 엄격한 타입 검증
  @StrictRoutes.Get('/users')
  async newWay(): Promise<AllowedApiResponses<paths, '/users', 'get'>> {
    return StrictJsonResponse.ok<paths, '/users', 'get'>({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      hasNext: false,
      hasPrev: false
    }); // OpenAPI 스펙에 정의된 응답만 허용됨
  }
}