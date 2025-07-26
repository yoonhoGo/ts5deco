/**
 * 타입 안전한 라우트 데코레이터 타입 테스트
 * 
 * 이 파일은 컴파일 타임 타입 검증을 테스트합니다.
 * 실제 테스트 실행보다는 타입 시스템의 올바른 동작을 확인하는 목적입니다.
 */

import type { 
  ApiResponse, 
  ExtractResponse,
  ExtractRequestBody,
  ExtractPathParams,
  OpenApiPathToExpressPath
} from '../src/types/openapi';
import { JsonResponse } from '../src/responses/JsonResponse';
import { createTypedRoutes } from '../src/decorators/typed-route';

// 테스트용 OpenAPI 타입 정의
interface TestPaths {
  "/users": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": {
              data: Array<{
                id: string;
                name: string;
                email: string;
              }>;
              total: number;
            };
          };
        };
        500: {
          content: {
            "application/json": {
              error: string;
              message: string;
            };
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          "application/json": {
            name: string;
            email: string;
            password: string;
          };
        };
      };
      responses: {
        201: {
          content: {
            "application/json": {
              id: string;
              name: string;
              email: string;
              createdAt: string;
            };
          };
        };
        400: {
          content: {
            "application/json": {
              error: string;
              message: string;
            };
          };
        };
      };
    };
  };
  "/users/{id}": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": {
              id: string;
              name: string;
              email: string;
            };
          };
        };
        404: {
          content: {
            "application/json": {
              error: string;
              message: string;
            };
          };
        };
      };
    };
    delete: {
      responses: {
        204: {
          content?: never;
        };
        404: {
          content: {
            "application/json": {
              error: string;
              message: string;
            };
          };
        };
      };
    };
  };
}

// 타입 안전한 라우트 데코레이터 생성
const TypedRoutes = createTypedRoutes<TestPaths>();

/**
 * 타입 레벨 테스트 - 컴파일 타임 검증
 */

// ✅ 올바른 타입 추출 테스트
type GetUsersResponse = ApiResponse<TestPaths, "/users", "get">;
type CreateUserResponse = ApiResponse<TestPaths, "/users", "post">;
type GetUserResponse = ApiResponse<TestPaths, "/users/{id}", "get">;

// ✅ 경로 변환 테스트
type ConvertedPath1 = OpenApiPathToExpressPath<"/users/{id}">; // "/users/:id"
type ConvertedPath2 = OpenApiPathToExpressPath<"/users/{userId}/posts/{postId}">; // "/users/:userId/posts/:postId"

// ✅ 요청 본문 타입 추출 테스트
type CreateUserRequestBody = ExtractRequestBody<TestPaths, "/users", "post">;

// ✅ 경로 파라미터 타입 추출 테스트
type UserIdParams = ExtractPathParams<"/users/{id}">; // { id: string }
type MultipleParams = ExtractPathParams<"/users/{userId}/posts/{postId}">; // { userId: string; postId: string }

/**
 * 테스트 컨트롤러 - 컴파일 타임 타입 검증
 */
class TestController {
  
  // ✅ 올바른 GET 응답 타입
  @TypedRoutes.Get('/users')
  async getUsers(): Promise<GetUsersResponse> {
    // ✅ 올바른 응답들
    const okResponse: JsonResponse<any, 200> = JsonResponse.ok({ data: [], total: 0 });
    const errorResponse: JsonResponse<any, 500> = JsonResponse.internalError({ error: "ERROR", message: "Error" });
    
    return okResponse; // 또는 errorResponse
    
    // 💡 다음 코드들은 컴파일 에러를 발생시켜야 함:
    // return JsonResponse.created(data);     // 201은 GET /users에 정의되지 않음
    // return JsonResponse.badRequest(error); // 400은 GET /users에 정의되지 않음
  }

  // ✅ 올바른 POST 응답 타입
  @TypedRoutes.Post('/users')
  async createUser(): Promise<CreateUserResponse> {
    // ✅ 올바른 응답들
    const createdResponse: JsonResponse<any, 201> = JsonResponse.created({ 
      id: "1", 
      name: "Test", 
      email: "test@example.com", 
      createdAt: new Date().toISOString() 
    });
    const badRequestResponse: JsonResponse<any, 400> = JsonResponse.badRequest({ 
      error: "VALIDATION_ERROR", 
      message: "Invalid data" 
    });
    
    return createdResponse; // 또는 badRequestResponse
    
    // 💡 다음 코드들은 컴파일 에러를 발생시켜야 함:
    // return JsonResponse.ok(user);          // 200은 POST /users에 정의되지 않음
    // return JsonResponse.internalError(e);  // 500은 POST /users에 정의되지 않음
  }

  // ✅ 올바른 GET BY ID 응답 타입
  @TypedRoutes.Get('/users/{id}')
  async getUserById(): Promise<GetUserResponse> {
    // ✅ 올바른 응답들
    const okResponse: JsonResponse<any, 200> = JsonResponse.ok({ 
      id: "1", 
      name: "Test", 
      email: "test@example.com" 
    });
    const notFoundResponse: JsonResponse<any, 404> = JsonResponse.notFound({ 
      error: "NOT_FOUND", 
      message: "User not found" 
    });
    
    return okResponse; // 또는 notFoundResponse
    
    // 💡 다음 코드들은 컴파일 에러를 발생시켜야 함:
    // return JsonResponse.created(user);     // 201은 GET /users/{id}에 정의되지 않음
    // return JsonResponse.badRequest(error); // 400은 GET /users/{id}에 정의되지 않음
  }
}

/**
 * 런타임 테스트용 유틸리티 함수들
 */

// 타입 검증을 위한 헬퍼 함수
function expectType<T>(value: T): T {
  return value;
}

// 경로 변환 테스트
export function testPathConversion() {
  const path1: OpenApiPathToExpressPath<"/users/{id}"> = "/users/:id";
  const path2: OpenApiPathToExpressPath<"/users/{userId}/posts/{postId}"> = "/users/:userId/posts/:postId";
  
  expectType<"/users/:id">(path1);
  expectType<"/users/:userId/posts/:postId">(path2);
}

// 파라미터 타입 테스트
export function testParameterTypes() {
  const userParams: ExtractPathParams<"/users/{id}"> = { id: "123" };
  const multiParams: ExtractPathParams<"/users/{userId}/posts/{postId}"> = { 
    userId: "456", 
    postId: "789" 
  };
  
  expectType<{ id: string }>(userParams);
  expectType<{ userId: string; postId: string }>(multiParams);
}

// 요청 본문 타입 테스트
export function testRequestBodyTypes() {
  const createUserData: ExtractRequestBody<TestPaths, "/users", "post"> = {
    name: "Test User",
    email: "test@example.com", 
    password: "password123"
  };
  
  expectType<{
    name: string;
    email: string;
    password: string;
  }>(createUserData);
}

/**
 * 타입 시스템 검증
 * 
 * 이 섹션의 코드들은 컴파일 에러를 발생시켜야 합니다.
 * 실제 테스트에서는 주석 처리되어 있지만, 타입 시스템이 올바르게 작동하는지 확인할 때 사용할 수 있습니다.
 */

/*
// ❌ 잘못된 경로 사용
@TypedRoutes.Get('/invalid-path')
async invalidPath(): Promise<GetUsersResponse> {
  return JsonResponse.ok([]);
}

// ❌ 잘못된 응답 상태 코드
@TypedRoutes.Get('/users')
async wrongStatusCode(): Promise<GetUsersResponse> {
  return JsonResponse.created([]); // 201은 GET에 정의되지 않음
}

// ❌ 잘못된 응답 데이터 타입
@TypedRoutes.Get('/users')
async wrongDataType(): Promise<GetUsersResponse> {
  return JsonResponse.ok("string"); // 문자열이 아닌 객체여야 함
}
*/