/**
 * OpenAPI 타입 안전성 증명 예제
 *
 * 이 파일은 ultra-strict 타입 시스템이 실제로 작동함을 보여줍니다.
 * 주석을 제거하면 컴파일 에러가 발생하는 부분들을 포함합니다.
 */

import {
  createTypedRoutes,
  createResponseFor,
  ApiResponse
} from '../src/decorators/typed-route';

// OpenAPI에서 생성된 타입들
import type { paths } from './types/generated/api';

const TypedRoutes = createTypedRoutes<paths>();

/**
 * ✅ 올바른 사용법 - 모든 응답이 OpenAPI 스펙과 일치
 */
export class ValidUsageController {

  /**
   * GET /users - 허용된 응답: 200, 500
   */
  @TypedRoutes.Get('/users')
  async getUsers(): Promise<ApiResponse<paths, '/users', 'get'>> {
    const responses = createResponseFor<paths, '/users', 'get'>();

    // ✅ 200 OK - 허용됨
    return responses.ok({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      hasNext: false,
      hasPrev: false
    });

    // ✅ 500 Internal Server Error - 허용됨
    // return responses.internalError({ error: 'INTERNAL_ERROR', message: 'Server error' });
  }

  /**
   * POST /users - 허용된 응답: 201, 400
   */
  @TypedRoutes.Post('/users')
  async createUser(): Promise<ApiResponse<paths, '/users', 'post'>> {
    const responses = createResponseFor<paths, '/users', 'post'>();

    // ✅ 201 Created - 허용됨
    return responses.created({
      id: '1',
      name: 'John',
      email: 'john@example.com',
      createdAt: new Date().toISOString()
    });

    // ✅ 400 Bad Request - 허용됨
    // return responses.badRequest({ error: 'VALIDATION_ERROR', message: 'Invalid data' });
  }

  /**
   * GET /users/{id} - 허용된 응답: 200, 404
   */
  @TypedRoutes.Get('/users/{id}')
  async getUserById(): Promise<ApiResponse<paths, '/users/{id}', 'get'>> {
    const responses = createResponseFor<paths, '/users/{id}', 'get'>();

    // ✅ 200 OK - 허용됨
    return responses.ok({
      id: '1',
      name: 'John',
      email: 'john@example.com'
    });

    // ✅ 404 Not Found - 허용됨
    // return responses.notFound({ error: 'NOT_FOUND', message: 'User not found' });
  }
}

/**
 * ❌ 잘못된 사용법 - 주석을 제거하면 컴파일 에러 발생
 *
 * 다음 각 메서드의 주석을 하나씩 제거하고 `npm run typecheck`를 실행하면
 * 명확한 에러 메시지와 함께 컴파일이 실패합니다.
 */

/*
export class InvalidUsageController {

  // ❌ GET /users에서 201 Created 사용 (허용되지 않음)
  @TypedRoutes.Get('/users')
  async getUsersWithWrongStatus(): Promise<ApiResponse<paths, '/users', 'get'>> {
    const responses = createResponseFor<paths, '/users', 'get'>();
    // 다음 줄의 주석을 제거하면 컴파일 에러:
    // return responses.created([]); // Error: Status code 201 is not valid for get /users
  }

  // ❌ POST /users에서 200 OK 사용 (허용되지 않음)
  @TypedRoutes.Post('/users')
  async createUserWithWrongStatus(): Promise<ApiResponse<paths, '/users', 'post'>> {
    const responses = createResponseFor<paths, '/users', 'post'>();
    // 다음 줄의 주석을 제거하면 컴파일 에러:
    // return responses.ok({}); // Error: Status code 200 is not valid for post /users
  }

  // ❌ GET /users/{id}에서 400 Bad Request 사용 (허용되지 않음)
  @TypedRoutes.Get('/users/{id}')
  async getUserByIdWithWrongStatus(): Promise<ApiResponse<paths, '/users/{id}', 'get'>> {
    const responses = createResponseFor<paths, '/users/{id}', 'get'>();
    // 다음 줄의 주석을 제거하면 컴파일 에러:
    // return responses.badRequest({}); // Error: Status code 400 is not valid for get /users/{id}
  }

  // ❌ GET /users에서 404 Not Found 사용 (허용되지 않음)
  @TypedRoutes.Get('/users')
  async getUsersWithNotFound(): Promise<ApiResponse<paths, '/users', 'get'>> {
    const responses = createResponseFor<paths, '/users', 'get'>();
    // 다음 줄의 주석을 제거하면 컴파일 에러:
    // return responses.notFound({}); // Error: Status code 404 is not valid for get /users
  }
}
*/

/**
 * 🧪 테스트 방법:
 *
 * 1. 현재 상태에서 `npm run typecheck` 실행 → ✅ 성공
 *
 * 2. InvalidUsageController의 주석을 제거하고 하나의 에러 라인 주석 제거
 *    예: `return responses.created([]);` 주석 제거
 *
 * 3. `npm run typecheck` 실행 → ❌ 명확한 에러 메시지와 함께 실패
 *    예: "Status code 201 is not valid for get /users. Allowed codes: 200 | 500"
 *
 * 4. 다시 주석 처리하고 다른 에러 라인 테스트
 *
 * 이 과정을 통해 타입 시스템이 OpenAPI 스펙을 정확히 검증함을 확인할 수 있습니다.
 */

/**
 * 📊 각 엔드포인트별 허용 상태 코드:
 *
 * GET /users:        200, 500
 * POST /users:       201, 400
 * GET /users/{id}:   200, 404
 * PUT /users/{id}:   200, 400, 404
 * DELETE /users/{id}: 204, 404
 *
 * 이 정보는 OpenAPI 스펙 (openapi.yaml)에서 자동으로 추출되어
 * TypeScript 타입 시스템에 반영됩니다.
 */
