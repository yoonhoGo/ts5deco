/**
 * 극도로 엄격한 타입 검증 테스트
 * 
 * 이 파일은 가장 엄격한 타입 검증을 시도합니다.
 * TypeScript 컴파일러 설정과 함께 최대한의 타입 안전성을 제공합니다.
 */

import {
  createTypedRoutes,
  createResponseFor,
  TypedApiResponse
} from '../src/decorators/typed-route';

// OpenAPI에서 생성된 타입들
import type { paths } from './types/generated/api';

const TypedRoutes = createTypedRoutes<paths>();

/**
 * 극도로 엄격한 타입 검증을 사용하는 컨트롤러
 */
export class UltraStrictController {

  /**
   * GET /users 엔드포인트
   * 허용된 응답: 200, 500만 가능
   */
  @TypedRoutes.Get('/users')
  async getUsers(): Promise<TypedApiResponse<paths, '/users', 'get'>> {
    // 이 엔드포인트에 특화된 응답 팩토리 생성
    const responses = createResponseFor<paths, '/users', 'get'>();
    
    try {
      const users = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      };
      
      // ✅ 허용된 응답
      return responses.ok(users);
      
      // ❌ 다음 코드들은 컴파일 에러를 발생시켜야 함:
      // return responses.created(users);    // 201은 허용되지 않음
      // return responses.badRequest({});    // 400은 허용되지 않음
      // return responses.notFound({});      // 404는 허용되지 않음
      
    } catch (error) {
      // ✅ 허용된 응답
      return responses.internalError({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch users'
      });
    }
  }

  /**
   * POST /users 엔드포인트
   * 허용된 응답: 201, 400만 가능
   */
  @TypedRoutes.Post('/users')
  async createUser(): Promise<TypedApiResponse<paths, '/users', 'post'>> {
    const responses = createResponseFor<paths, '/users', 'post'>();
    
    try {
      const newUser = {
        id: '1',
        name: 'John',
        email: 'john@example.com',
        createdAt: new Date().toISOString()
      };
      
      // ✅ 허용된 응답
      return responses.created(newUser);
      
      // ❌ 다음 코드들은 컴파일 에러를 발생시켜야 함:
      // return responses.ok(newUser);           // 200은 허용되지 않음
      // return responses.notFound({});          // 404는 허용되지 않음
      // return responses.internalError({});     // 500은 허용되지 않음
      
    } catch (error) {
      // ✅ 허용된 응답
      return responses.badRequest({
        error: 'VALIDATION_ERROR',
        message: 'Invalid data'
      });
    }
  }

  /**
   * GET /users/{id} 엔드포인트
   * 허용된 응답: 200, 404만 가능
   */
  @TypedRoutes.Get('/users/{id}')
  async getUserById(): Promise<TypedApiResponse<paths, '/users/{id}', 'get'>> {
    const responses = createResponseFor<paths, '/users/{id}', 'get'>();
    
    const user = {
      id: '1',
      name: 'John',
      email: 'john@example.com'
    };
    
    if (user) {
      // ✅ 허용된 응답
      return responses.ok(user);
    } else {
      // ✅ 허용된 응답
      return responses.notFound({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }
    
    // ❌ 다음 코드들은 컴파일 에러를 발생시켜야 함:
    // return responses.created(user);         // 201은 허용되지 않음
    // return responses.badRequest({});        // 400은 허용되지 않음
    // return responses.internalError({});     // 500은 허용되지 않음
  }
}

/**
 * 컴파일 에러 테스트
 * 
 * 다음 클래스의 주석을 제거하면 컴파일 에러가 발생해야 합니다.
 */

/*
export class CompileErrorTestController {
  
  @TypedRoutes.Get('/users')
  async wrongStatusCode(): Promise<TypedApiResponse<paths, '/users', 'get'>> {
    const responses = createResponseFor<paths, '/users', 'get'>();
    // ❌ 허용되지 않는 상태 코드 - 이것은 컴파일 에러를 발생시켜야 함
    return responses.created([]);
  }
}
*/

/**
 * 타입 시스템 디버깅
 * 
 * 타입 정보를 확인하고 싶을 때 사용할 수 있는 헬퍼들
 */

// 특정 엔드포인트의 타입 정보 확인
type GetUsersInfo = import('../src/decorators/typed-route').ApiEndpointInfo<paths, '/users', 'get'>;
type PostUsersInfo = import('../src/decorators/typed-route').ApiEndpointInfo<paths, '/users', 'post'>;
type GetUserByIdInfo = import('../src/decorators/typed-route').ApiEndpointInfo<paths, '/users/{id}', 'get'>;

// 허용된 상태 코드 확인
type GetUsersAllowedCodes = import('../src/types/branded-response').ValidStatusCodes<paths, '/users', 'get'>;
type PostUsersAllowedCodes = import('../src/types/branded-response').ValidStatusCodes<paths, '/users', 'post'>;

/**
 * 런타임 검증 헬퍼
 * 
 * 컴파일 타임 검증이 완벽하지 않을 경우를 대비한 런타임 검증
 */
export function validateResponse<TPaths, TPath extends keyof TPaths, TMethod extends string>(
  path: TPath,
  method: TMethod,
  statusCode: number,
  allowedCodes: readonly number[]
): void {
  if (!allowedCodes.includes(statusCode)) {
    throw new Error(
      `Invalid status code ${statusCode} for ${method} ${String(path)}. ` +
      `Allowed codes: ${allowedCodes.join(', ')}`
    );
  }
}

/**
 * 사용 예시와 테스트 방법
 * 
 * 1. 컴파일 에러 테스트:
 *    - CompileErrorTestController의 주석을 제거하고 `npm run typecheck` 실행
 *    - 명확한 에러 메시지가 표시되어야 함
 * 
 * 2. IDE 지원 확인:
 *    - responses.를 타이핑하면 허용된 메서드만 자동완성되어야 함
 *    - 잘못된 상태 코드 사용 시 타입 에러 표시되어야 함
 * 
 * 3. 타입 정보 확인:
 *    - GetUsersInfo, PostUsersInfo 등의 타입을 IDE에서 확인
 *    - 허용된 상태 코드와 응답 타입 정보가 표시되어야 함
 */