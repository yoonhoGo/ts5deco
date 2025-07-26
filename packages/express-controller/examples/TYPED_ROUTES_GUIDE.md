# 타입 안전한 OpenAPI 라우트 가이드

이 가이드는 OpenAPI 스펙과 연동된 타입 안전한 라우트 데코레이터를 사용하는 방법을 설명합니다.

## 개요

TypeScript 5 Modern Decorators와 OpenAPI 타입을 결합하여 컴파일 타임에 응답 타입을 검증할 수 있습니다. 잘못된 상태 코드나 응답 형식을 사용하면 컴파일 에러가 발생합니다.

## 1. OpenAPI 타입 생성

먼저 OpenAPI YAML/JSON 파일에서 TypeScript 타입을 생성해야 합니다.

### 1.1 openapi-typescript 설치

```bash
npm install -D openapi-typescript
```

### 1.2 타입 생성

```bash
# OpenAPI YAML에서 타입 생성
npx openapi-typescript ./openapi.yaml -o ./src/types/generated/api.d.ts

# 또는 OpenAPI JSON에서 타입 생성  
npx openapi-typescript ./openapi.json -o ./src/types/generated/api.d.ts
```

### 1.3 생성된 타입 예시

```typescript
// src/types/generated/api.d.ts
export interface paths {
  "/users": {
    get: operations["getUsers"];
    post: operations["createUser"];
  };
  "/users/{id}": {
    get: operations["getUserById"];
    put: operations["updateUser"];
    delete: operations["deleteUser"];
  };
}

export interface operations {
  getUsers: {
    responses: {
      200: {
        content: {
          "application/json": PaginatedUserResponse;
        };
      };
      500: {
        content: {
          "application/json": ErrorResponse;
        };
      };
    };
  };
  // ... 기타 operations
}
```

## 2. 타입 안전한 컨트롤러 구현

### 2.1 기본 사용법

```typescript
import { createTypedRoutes, JsonResponse } from '@your-lib/express-controller';
import type { paths } from './types/generated/api';
import type { ApiResponse } from '@your-lib/express-controller';

// 타입 안전한 라우트 데코레이터 생성
const TypedRoutes = createTypedRoutes<paths>();

export class UserController {
  
  @TypedRoutes.Get('/users/{id}')
  async getUserById(): Promise<ApiResponse<paths, '/users/{id}', 'get'>> {
    // ✅ 올바른 응답 - OpenAPI 스펙에 정의된 200 응답
    return JsonResponse.ok(user);
    
    // ❌ 컴파일 에러 - 201은 이 엔드포인트에 정의되지 않음
    // return JsonResponse.created(user);
  }
}
```

### 2.2 완전한 예시

```typescript
import { Request, Response, NextFunction } from 'express';
import { 
  createTypedRoutes, 
  TypedController,
  JsonResponse 
} from '@your-lib/express-controller';
import type { paths } from './types/generated/api';
import type { ApiResponse } from '@your-lib/express-controller';

const TypedRoutes = createTypedRoutes<paths>();

@TypedController<paths>('/api')
export class UserController {
  
  // GET /api/users - 200(성공), 500(에러) 응답만 허용
  @TypedRoutes.Get('/users')
  async getUsers(): Promise<ApiResponse<paths, '/users', 'get'>> {
    try {
      const users = await this.userService.getUsers();
      return JsonResponse.ok(users); // ✅ 200 응답
    } catch (error) {
      return JsonResponse.internalError(error); // ✅ 500 응답
    }
    // return JsonResponse.created(users); // ❌ 201은 정의되지 않음
  }

  // POST /api/users - 201(생성), 400(에러) 응답만 허용
  @TypedRoutes.Post('/users')
  async createUser(): Promise<ApiResponse<paths, '/users', 'post'>> {
    try {
      const user = await this.userService.create(userData);
      return JsonResponse.created(user); // ✅ 201 응답
    } catch (error) {
      return JsonResponse.badRequest(error); // ✅ 400 응답
    }
    // return JsonResponse.ok(user); // ❌ 200은 정의되지 않음
  }

  // GET /api/users/{id} - 200(성공), 404(찾을 수 없음) 응답만 허용
  @TypedRoutes.Get('/users/{id}')
  async getUserById(): Promise<ApiResponse<paths, '/users/{id}', 'get'>> {
    const user = await this.userService.findById(id);
    
    if (!user) {
      return JsonResponse.notFound(error); // ✅ 404 응답
    }
    
    return JsonResponse.ok(user); // ✅ 200 응답
    // return JsonResponse.created(user); // ❌ 201은 정의되지 않음
  }
}
```

## 3. 고급 사용법

### 3.1 미들웨어와 함께 사용

```typescript
import { authenticateUser, validateInput } from './middlewares';

export class UserController {
  
  @TypedRoutes.Post('/users', {
    middlewares: [validateInput, authenticateUser]
  })
  async createUser(): Promise<ApiResponse<paths, '/users', 'post'>> {
    // 미들웨어를 거친 후 실행됨
    return JsonResponse.created(user);
  }
}
```

### 3.2 Request/Response 타입 추출

```typescript
import type { 
  ExtractRequestBody,
  ExtractPathParams 
} from '@your-lib/express-controller';

export class UserController {
  
  @TypedRoutes.Post('/users')
  async createUser(
    req: Request,
    res: Response
  ): Promise<ApiResponse<paths, '/users', 'post'>> {
    // 요청 본문 타입을 OpenAPI에서 자동 추출
    const userData = req.body as ExtractRequestBody<paths, '/users', 'post'>;
    
    // 타입 안전한 사용자 생성
    const user = await this.userService.create(userData);
    return JsonResponse.created(user);
  }

  @TypedRoutes.Get('/users/{id}')
  async getUserById(
    req: Request
  ): Promise<ApiResponse<paths, '/users/{id}', 'get'>> {
    // 경로 파라미터 타입 추출
    const { id } = req.params as ExtractPathParams<'/users/{id}'>;
    
    const user = await this.userService.findById(id);
    return user ? JsonResponse.ok(user) : JsonResponse.notFound(error);
  }
}
```

## 4. 기존 코드와의 호환성

### 4.1 점진적 마이그레이션

기존의 `@Get`, `@Post` 데코레이터와 새로운 타입 안전한 데코레이터를 함께 사용할 수 있습니다:

```typescript
import { Get, Post } from '@your-lib/express-controller'; // 기존 데코레이터
import { createTypedRoutes } from '@your-lib/express-controller'; // 새로운 데코레이터

const TypedRoutes = createTypedRoutes<paths>();

export class UserController {
  
  // 기존 방식 - 타입 검증 없음
  @Get('/users/legacy')
  async getLegacyUsers() {
    return JsonResponse.ok(users); // 모든 상태 코드 허용
  }

  // 새로운 방식 - 타입 안전
  @TypedRoutes.Get('/users')
  async getUsers(): Promise<ApiResponse<paths, '/users', 'get'>> {
    return JsonResponse.ok(users); // OpenAPI 스펙에 맞는 응답만 허용
  }
}
```

### 4.2 선택적 적용

프로젝트의 일부분에만 타입 안전성을 적용할 수 있습니다:

```typescript
// 타입 안전성이 중요한 API
@TypedRoutes.Post('/users')
async createUser(): Promise<ApiResponse<paths, '/users', 'post'>> {
  // 엄격한 타입 검증
}

// 내부 API나 덜 중요한 엔드포인트
@Post('/internal/debug')
async debugEndpoint() {
  // 기존 방식으로 유연하게 처리
}
```

## 5. 문제 해결

### 5.1 컴파일 에러: "Type does not satisfy constraint"

**원인**: OpenAPI 스펙에 정의되지 않은 상태 코드를 사용

```typescript
// ❌ 에러 발생
@TypedRoutes.Get('/users/{id}')
async getUserById(): Promise<ApiResponse<paths, '/users/{id}', 'get'>> {
  return JsonResponse.created(user); // 201은 GET에 정의되지 않음
}
```

**해결**: OpenAPI 스펙에 정의된 상태 코드만 사용

```typescript
// ✅ 올바른 사용
@TypedRoutes.Get('/users/{id}')
async getUserById(): Promise<ApiResponse<paths, '/users/{id}', 'get'>> {
  return JsonResponse.ok(user);     // 200 - 정의됨
  return JsonResponse.notFound(err); // 404 - 정의됨
}
```

### 5.2 경로 변환 문제

OpenAPI 경로 문법(`{id}`)과 Express 경로 문법(`:id`) 간의 자동 변환이 수행됩니다:

```typescript
// OpenAPI 경로: /users/{userId}/posts/{postId}
// Express 경로로 자동 변환: /users/:userId/posts/:postId

@TypedRoutes.Get('/users/{userId}/posts/{postId}')
async getUserPost() {
  // req.params에서 userId, postId 사용 가능
}
```

## 6. 모범 사례

### 6.1 타입 별칭 활용

```typescript
// 자주 사용하는 응답 타입을 별칭으로 정의
type GetUserResponse = ApiResponse<paths, '/users/{id}', 'get'>;
type CreateUserResponse = ApiResponse<paths, '/users', 'post'>;

export class UserController {
  
  @TypedRoutes.Get('/users/{id}')
  async getUserById(): Promise<GetUserResponse> {
    // 구현...
  }

  @TypedRoutes.Post('/users')
  async createUser(): Promise<CreateUserResponse> {
    // 구현...
  }
}
```

### 6.2 서비스 레이어 타입 안전성

```typescript
// 서비스도 OpenAPI 타입 사용
import type { ExtractSchema } from '@your-lib/express-controller';

type User = ExtractSchema<'User'>;
type CreateUserRequest = ExtractSchema<'CreateUserRequest'>;

class UserService {
  async create(data: CreateUserRequest): Promise<User> {
    // OpenAPI 스펙과 일치하는 타입 사용
  }
}
```

## 7. 주의사항

1. **OpenAPI 스펙 변경 시**: 스펙이 변경되면 타입을 재생성하고 컴파일 에러를 수정해야 합니다.

2. **타입 생성 자동화**: CI/CD에서 OpenAPI 타입 생성을 자동화하는 것을 권장합니다.

3. **성능**: 타입 검증은 컴파일 타임에만 수행되므로 런타임 성능에 영향을 주지 않습니다.

4. **호환성**: TypeScript 5.0 이상과 Modern Decorators를 지원하는 환경에서만 사용 가능합니다.

5. **타입 검증의 한계**: TypeScript의 구조적 타이핑으로 인해 일부 상황에서는 완전한 컴파일 타임 검증이 어려울 수 있습니다. 하지만 IDE 지원, 자동완성, 명확한 타입 정의 등의 장점을 여전히 제공합니다.

## 8. 현실적인 기대치

이 타입 시스템이 제공하는 것:
- ✅ **IDE 지원**: 자동완성과 타입 힌트
- ✅ **문서화**: OpenAPI 스펙과의 명확한 연결
- ✅ **개발 가이드라인**: 어떤 상태 코드를 사용해야 하는지 명시
- ✅ **부분적 타입 안전성**: 대부분의 잘못된 사용을 방지
- ✅ **팀 협업**: 일관된 API 구현 스타일 유지

제한사항:
- ⚠️ **완전한 컴파일 에러**: 모든 잘못된 상태 코드 사용이 컴파일 에러로 이어지지는 않음
- ⚠️ **구조적 타이핑**: TypeScript의 특성으로 인한 타입 시스템의 한계

따라서 이 시스템은 **완전한 타입 안전성**보다는 **개발자 경험 향상**과 **코드 품질 개선**에 중점을 둡니다.

## 8. 다음 단계

이 기능을 효과적으로 사용하기 위해:

1. OpenAPI 스펙을 정확하게 작성하세요
2. 스펙 변경 시 타입 재생성을 자동화하세요  
3. 점진적으로 기존 코드를 마이그레이션하세요
4. 팀원들과 타입 안전성의 이점을 공유하세요