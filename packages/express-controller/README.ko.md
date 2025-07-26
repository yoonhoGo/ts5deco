# ts5deco Express Controller Framework

TypeScript 5 현대적 데코레이터 기반 Express 컨트롤러 프레임워크

## 특징

- 🎯 **현대적 데코레이터**: TypeScript 5 현대적 데코레이터 사용 (레거시 실험적 데코레이터 아님)
- 🚀 **Express 통합**: Express.js와의 완벽한 통합
- 🔧 **타입 안정성**: 강력한 타입스크립트 지원
- 🎨 **깔끔한 아키텍처**: 데코레이터 기반 컨트롤러 정의
- 🛡️ **미들웨어 지원**: 내장 미들웨어 지원
- 🔄 **자동 등록**: 자동 라우트 등록
- 🚫 **reflect-metadata 불필요**: 네이티브 WeakMap 기반 메타데이터 저장소
- ✨ **타입 안전한 응답**: 컴파일 타임 타입 검사가 포함된 제네릭 응답 클래스
- 🎭 **응답 시스템**: JsonResponse, TextResponse, NoContentResponse, RedirectResponse, FileResponse
- 📋 **OpenAPI 통합**: OpenAPI/Swagger 명세에서 TypeScript 타입 생성
- 🛠️ **CLI 도구**: 프로젝트 초기화 및 타입 생성을 위한 내장 CLI
- 🔗 **프로그래매틱 API**: 타입 생성에 대한 완전한 프로그래매틱 제어

## 설치

```bash
npm install ts5deco-express-controller
# 또는
yarn add ts5deco-express-controller
# 또는
pnpm add ts5deco-express-controller
```

## 빠른 시작

### 1. TypeScript 설정

`tsconfig.json`에 다음 설정이 포함되어 있는지 확인하세요:

```json
{
  "compilerOptions": {
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs"
  }
}
```

### 2. 컨트롤러 생성

```typescript
import express from 'express';
import { Controller, Get, Post } from 'ts5deco-express-controller';

interface CreateUserDto {
  name: string;
  email: string;
}

@Controller('/users')
export class UserController {
  @Get()
  async getAllUsers(req: express.Request, res: express.Response, next: express.NextFunction) {
    const page = req.query.page as string || '1';
    // 선택적 페이지네이션으로 모든 사용자 가져오기
    return { users: [], page };
  }

  @Get('/:id')
  async getUserById(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    // ID로 사용자 가져오기
    return { id, name: 'John Doe', email: 'john@example.com' };
  }

  @Post()
  async createUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const userData = req.body as CreateUserDto;
    // 새 사용자 생성
    return { id: '123', ...userData };
  }
}
```

### 3. 컨트롤러 등록

```typescript
import express from 'express';
import { registerControllers } from 'ts5deco-express-controller';
import { UserController } from './controllers/user.controller';

const app = express();

// 미들웨어
app.use(express.json());

// 컨트롤러 등록
registerControllers(app, [UserController], '/api');

app.listen(3000, () => {
  console.log('서버가 http://localhost:3000 에서 실행 중입니다');
});
```

## API 참조

### 데코레이터

#### `@Controller(path?, options?)`

컨트롤러 클래스를 정의합니다.

```typescript
@Controller('/api/users')
export class UserController {
  // ...
}

// 미들웨어와 함께
@Controller({ 
  path: '/api/users', 
  middlewares: [authMiddleware] 
})
export class UserController {
  // ...
}
```

#### 라우트 데코레이터

- `@Get(path?, options?)` - GET 요청
- `@Post(path?, options?)` - POST 요청
- `@Put(path?, options?)` - PUT 요청
- `@Delete(path?, options?)` - DELETE 요청
- `@Patch(path?, options?)` - PATCH 요청
- `@Head(path?, options?)` - HEAD 요청
- `@Options(path?, options?)` - OPTIONS 요청
- `@All(path?, options?)` - 모든 HTTP 메서드

모든 라우트 핸들러는 Express의 표준 `req`, `res`, `next` 매개변수를 받습니다:

```typescript
@Get('/profile')
async getProfile(req: express.Request, res: express.Response, next: express.NextFunction) {
  // 쿼리 매개변수 접근: req.query
  // URL 매개변수 접근: req.params
  // 요청 본문 접근: req.body
  // 헤더 접근: req.headers
  return { profile: 'data' };
}

@Post({ path: '/users', middlewares: [validateUser] })
async createUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userData = req.body;
  return { user: userData };
}
```

#### 미들웨어 데코레이터

- `@Use(...middlewares)` - 라우트에 미들웨어 적용
- `@Authenticated(middleware)` - 인증 미들웨어
- `@Authorized(middleware)` - 권한 부여 미들웨어
- `@Validated(middleware)` - 검증 미들웨어

```typescript
@Use(loggingMiddleware, rateLimitMiddleware)
@Get('/protected')
async getProtectedData() {
  // ...
}

@Authenticated(jwtAuthMiddleware)
@Get('/profile')
async getProfile() {
  // ...
}
```

### 함수

#### `createRouter(controllers)`

컨트롤러에서 Express 라우터를 생성합니다.

```typescript
import { createRouter } from 'ts5deco-express-controller';

const router = createRouter([UserController, PostController]);
app.use('/api', router);
```

#### `registerControllers(app, controllers, basePath?)`

Express 앱에 컨트롤러를 직접 등록합니다.

```typescript
import { registerControllers } from 'ts5deco-express-controller';

registerControllers(app, [UserController, PostController], '/api');
```

#### `registerController(router, controller)`

라우터에 단일 컨트롤러를 등록합니다.

```typescript
import { registerController } from 'ts5deco-express-controller';

const router = express.Router();
registerController(router, UserController);
```

## 응답 시스템

프레임워크는 반복적인 `res.status().json()` 보일러플레이트 코드를 제거하는 강력한 타입 안전 응답 시스템을 제공합니다.

### 기본 사용법

```typescript
import { 
  JsonResponse, 
  JsonResponses,
  TextResponse,
  TextResponses,
  NoContentResponse,
  RedirectResponse,
  FileResponse
} from 'ts5deco-express-controller';

@Controller('/api/users')
export class UserController {
  
  // 타입 안전한 JSON 응답
  @Get('/')
  async getUsers(): Promise<JsonResponse<User[], 200>> {
    const users = await this.userService.getUsers();
    return new JsonResponse<User[], 200>(200, users);
  }

  @Get('/:id')
  async getUserById(req: Request): Promise<JsonResponse<User, 200> | JsonResponse<ErrorResponse, 404>> {
    const user = await this.userService.findById(req.params.id);
    
    if (!user) {
      return JsonResponses.notFound<ErrorResponse>({
        error: '사용자를 찾을 수 없습니다',
        message: '요청한 사용자가 존재하지 않습니다'
      });
    }
    
    return JsonResponses.ok<User>(user);
  }

  @Post('/')
  async createUser(req: Request): Promise<JsonResponse<User, 201>> {
    const user = await this.userService.create(req.body);
    return JsonResponses.created<User>(user);
  }

  @Delete('/:id')
  async deleteUser(): Promise<NoContentResponse> {
    await this.userService.delete(req.params.id);
    return new NoContentResponse(); // 204 No Content
  }

  // 리터럴 타입이 있는 텍스트 응답
  @Get('/health')
  async healthCheck(): Promise<TextResponse<'healthy', 200>> {
    return new TextResponse<'healthy', 200>(200, 'healthy');
  }

  // 리다이렉트
  @Get('/old-endpoint')
  async oldEndpoint(): Promise<RedirectResponse> {
    return new RedirectResponse('/api/users', 301); // 영구 리다이렉트
  }

  // 파일 다운로드
  @Get('/export')
  async exportUsers(): Promise<FileResponse> {
    return new FileResponse('/tmp/users.csv', 'users-export.csv', true);
  }
}
```

### 응답 타입

#### JsonResponse<TData, TStatus>

데이터와 상태 코드에 대한 제네릭이 있는 타입 안전한 JSON 응답:

```typescript
// 직접 사용
return new JsonResponse<User, 200>(200, user);

// 편의 메서드
return JsonResponses.ok<User>(user);           // 200 OK
return JsonResponses.created<User>(user);      // 201 Created
return JsonResponses.badRequest<Error>(error); // 400 Bad Request
return JsonResponses.notFound<Error>(error);   // 404 Not Found
```

#### TextResponse<TText, TStatus>

타입 안전한 텍스트 응답:

```typescript
// 리터럴 타입과 함께
return new TextResponse<'OK', 200>(200, 'OK');

// 템플릿 리터럴 타입과 함께
return new TextResponse<`v${string}`, 200>(200, 'v1.2.3');

// 유니온 타입과 함께
return new TextResponse<'running' | 'stopped', 200>(200, 'running');

// 편의 메서드
return TextResponses.ok('서비스가 정상입니다');
```

#### 기타 응답 타입

```typescript
// 204 No Content
return new NoContentResponse();

// 리다이렉트
return new RedirectResponse('/new-path', 302);
return RedirectResponses.permanent('/new-path'); // 301
return RedirectResponses.temporary('/new-path'); // 302

// 파일 응답
return new FileResponse('/path/to/file.pdf', 'document.pdf');
return FileResponses.attachment('/path/to/file.zip', 'archive.zip');
```

### 장점

- **타입 안정성**: 응답 데이터와 상태 코드의 컴파일 타임 검사
- **깔끔한 코드**: 반복적인 `res.status().json()` 호출 제거
- **일관성**: 애플리케이션 전반에 걸친 표준화된 응답 처리
- **IDE 지원**: 완전한 IntelliSense 및 자동 완성
- **하위 호환성**: 기존 Express 응답 메서드와 함께 작동

완전한 문서는 [응답 시스템 문서](./docs/RESPONSE-SYSTEM.md)를 참조하세요.

## OpenAPI 통합

프레임워크는 OpenAPI/Swagger 명세에서 TypeScript 타입 생성을 지원하여 API 문서와 구현 간의 타입 안정성을 보장합니다.

### OpenAPI로 빠른 시작

#### 1. 새 프로젝트 초기화

```bash
npx ts5deco-express-controller init --dir ./my-api-project
```

#### 2. OpenAPI 명세에서 타입 생성

```bash
npx ts5deco-express-controller generate --input ./api/openapi.yaml --output ./src/types/generated
```

#### 3. 컨트롤러에서 생성된 타입 사용

```typescript
import { Controller, Get, Post, JsonResponses } from 'ts5deco-express-controller';
import type { User, ErrorResponse, CreateUserRequest } from './types/api';

@Controller('/api/users')
export class UserController {
  @Get('/:id')
  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<JsonResponse<User, 200> | JsonResponse<ErrorResponse, 404>> {
    const user = await this.userService.findById(req.params.id);
    
    if (!user) {
      return JsonResponses.notFound<ErrorResponse>({
        error: 'NOT_FOUND',
        message: '사용자를 찾을 수 없습니다'
      });
    }
    
    return JsonResponses.ok<User>(user);
  }

  @Post('/')
  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<JsonResponse<User, 201>> {
    const userData = req.body as CreateUserRequest;
    const user = await this.userService.create(userData);
    return JsonResponses.created<User>(user);
  }
}
```

### CLI 명령어

#### 프로젝트 초기화

```bash
# OpenAPI 설정으로 새 프로젝트 초기화
npx ts5deco-express-controller init --dir ./my-project
```

#### 타입 생성

```bash
# OpenAPI 명세에서 타입 생성
npx ts5deco-express-controller generate --input ./api/openapi.yaml --output ./src/types/generated

# 사용자 정의 헬퍼 파일과 함께
npx ts5deco-express-controller generate \
  --input ./api/openapi.yaml \
  --output ./src/types/generated \
  --api-types ./src/types/api.ts \
  --utils ./src/types/openapi-utils.ts
```

### 프로그래매틱 API

```typescript
import { generateTypes, initProject } from 'ts5deco-express-controller';

// 프로젝트 초기화
await initProject('./my-project');

// 타입 생성
await generateTypes({
  input: './api/openapi.yaml',
  outputDir: './src/types/generated',
  apiTypesPath: './src/types/api.ts',
  utilsPath: './src/types/openapi-utils.ts',
});
```

### 장점

- **단일 정보원**: OpenAPI 명세가 문서와 타입을 모두 구동
- **컴파일 타임 안정성**: 런타임 전에 타입 불일치 포착
- **자동 완성**: 생성된 타입으로 완전한 IDE 지원
- **일관성**: API 구현이 명세와 일치하도록 보장
- **런타임 오버헤드 없음**: 순수한 컴파일 타임 타입 검사

완전한 문서는 [OpenAPI 통합 가이드](./docs/OPENAPI-TYPES.md)를 참조하세요.

## 예제

### 완전한 예제

```typescript
import express from 'express';
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Use,
  Authenticated,
  registerControllers 
} from 'ts5deco-express-controller';

// 미들웨어 함수들
const loggingMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: '인증되지 않음' });
  }
  // 간단한 토큰 검증 (실제 애플리케이션에서는 JWT 사용)
  if (token !== 'Bearer valid-token') {
    return res.status(403).json({ error: '권한 없음' });
  }
  next();
};

// DTO들
interface CreateUserDto {
  name: string;
  email: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
}

// 컨트롤러
@Controller({ path: '/users', middlewares: [loggingMiddleware] })
export class UserController {
  @Get()
  async getUsers(req: express.Request, res: express.Response, next: express.NextFunction) {
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '10';
    
    return {
      users: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
      ],
      pagination: { page: parseInt(page), limit: parseInt(limit) }
    };
  }

  @Get('/:id')
  async getUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    
    if (id === '1') {
      return { id: '1', name: 'John Doe', email: 'john@example.com' };
    }
    
    res.status(404);
    return { error: '사용자를 찾을 수 없습니다' };
  }

  @Post()
  async createUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const userData = req.body as CreateUserDto;
    
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    
    return { user: newUser, message: '사용자가 성공적으로 생성되었습니다' };
  }

  @Put('/:id')
  @Authenticated(authMiddleware)
  async updateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    const userData = req.body as UpdateUserDto;
    
    const updatedUser = {
      id,
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    return { user: updatedUser, message: '사용자가 성공적으로 업데이트되었습니다' };
  }

  @Delete('/:id')
  @Authenticated(authMiddleware)
  async deleteUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    
    return { message: '사용자가 성공적으로 삭제되었습니다', id };
  }
}

// 앱 설정
const app = express();

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 컨트롤러 등록
registerControllers(app, [UserController], '/api');

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'ts5deco Express Controller Framework',
    endpoints: {
      users: '/api/users'
    }
  });
});

// 에러 핸들링
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('에러:', err);
  res.status(500).json({ error: '내부 서버 오류' });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log('사용 가능한 엔드포인트:');
  console.log('- GET /api/users');
  console.log('- GET /api/users/:id');
  console.log('- POST /api/users');
  console.log('- PUT /api/users/:id (인증 필요)');
  console.log('- DELETE /api/users/:id (인증 필요)');
  console.log('');
  console.log('보호된 라우트의 경우 헤더를 사용하세요: Authorization: Bearer valid-token');
});
```

## 요구사항

- Node.js 16+
- TypeScript 5.0+
- Express 4.18+

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
