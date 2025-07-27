import { Request } from 'express';
import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  JsonResponse,
  TextResponse,
  NoContentResponse
} from '../src';

// Type definitions for demonstration
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

interface CreateUserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 제네릭 Response 시스템을 보여주는 예제 컨트롤러
 */
@Controller('/api/v1')
export class GenericResponseDemoController {
  
  /**
   * 제네릭을 사용한 타입 안전한 JSON 응답들
   */
  @Get('/users')
  async getUsers(): Promise<JsonResponse<PaginatedResponse<User>, 200>> {
    const users: User[] = [
      { 
        id: 1, 
        name: 'John Doe', 
        email: 'john@example.com',
        createdAt: '2025-01-01T00:00:00Z'
      },
      { 
        id: 2, 
        name: 'Jane Smith', 
        email: 'jane@example.com',
        createdAt: '2025-01-02T00:00:00Z'
      }
    ];
    
    // 제네릭으로 타입 안전한 응답
    return new JsonResponse<PaginatedResponse<User>, 200>(200, {
      data: users,
      total: users.length,
      page: 1,
      limit: 10
    });
  }

  @Get('/users/:id')
  async getUserById(req: Request): Promise<JsonResponse<User, 200> | JsonResponse<ErrorResponse, 404>> {
    const id = parseInt(req.params.id);
    
    if (id === 1) {
      const user: User = { 
        id: 1, 
        name: 'John Doe', 
        email: 'john@example.com',
        createdAt: '2025-01-01T00:00:00Z'
      };
      
      // 편의 메서드를 제네릭과 함께 사용
      return JsonResponse.ok<User>(user);
    }
    
    // 404 에러 응답도 타입 안전하게
    return JsonResponse.notFound<ErrorResponse>({
      error: 'User not found',
      message: `User with id ${id} does not exist`,
      code: 'USER_NOT_FOUND'
    });
  }

  @Post('/users')
  async createUser(req: Request): Promise<JsonResponse<CreateUserResponse, 201> | JsonResponse<ErrorResponse, 400>> {
    const body = req.body as CreateUserRequest;
    
    if (!body.name || !body.email) {
      return JsonResponse.badRequest<ErrorResponse>({
        error: 'Validation failed',
        message: 'Name and email are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const newUser: CreateUserResponse = {
      id: Date.now(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString()
    };

    // 201 Created with typed response
    return JsonResponse.created<CreateUserResponse>(newUser);
  }

  /**
   * 제네릭을 사용한 타입 안전한 Text 응답들
   */
  @Get('/health')
  async healthCheck(): Promise<TextResponse<'healthy', 200>> {
    // 리터럴 타입으로 정확한 문자열 지정
    return new TextResponse<'healthy', 200>(200, 'healthy');
  }

  @Get('/version')
  async getVersion(): Promise<TextResponse<`v${string}`, 200>> {
    // 템플릿 리터럴 타입 사용
    return new TextResponse<`v${string}`, 200>(200, 'v1.2.3');
  }

  @Get('/status/:service')
  async getServiceStatus(req: Request): Promise<TextResponse<'running' | 'stopped' | 'error', 200>> {
    const service = req.params.service;
    
    // Union 타입으로 가능한 값들을 제한
    const statuses: ('running' | 'stopped' | 'error')[] = ['running', 'stopped', 'error'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return new TextResponse<'running' | 'stopped' | 'error', 200>(200, randomStatus);
  }

  @Get('/message')
  async getMessage(): Promise<TextResponse<string, 200>> {
    // 편의 메서드와 제네릭 조합
    return TextResponse.ok<'Hello from generic TextResponse!'>('Hello from generic TextResponse!');
  }

  /**
   * 다른 Response 타입들도 여전히 사용 가능
   */
  @Delete('/users/:id')
  async deleteUser(req: Request): Promise<NoContentResponse | JsonResponse<ErrorResponse, 400>> {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return JsonResponse.badRequest<ErrorResponse>({
        error: 'Invalid ID',
        message: 'User ID must be a number',
        code: 'INVALID_ID'
      });
    }

    // 삭제 로직...
    console.log(`Deleting user with id: ${id}`);
    
    return new NoContentResponse();
  }

  /**
   * 복잡한 제네릭 사용 예제
   */
  @Get('/analytics/:metric')
  async getAnalytics(req: Request): Promise<JsonResponse<{
    metric: string;
    value: number;
    timestamp: string;
    metadata: Record<string, any>;
  }, 200>> {
    const metric = req.params.metric;
    
    return new JsonResponse<{
      metric: string;
      value: number;
      timestamp: string;
      metadata: Record<string, any>;
    }, 200>(200, {
      metric,
      value: Math.random() * 100,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'analytics-service',
        version: '1.0.0'
      }
    });
  }

  /**
   * 제네릭 없이도 여전히 작동 (하위 호환성)
   */
  @Get('/legacy')
  async legacyResponse() {
    // 제네릭 없이 사용 - 여전히 작동함
    return new JsonResponse(200, {
      message: 'This still works without generics!',
      timestamp: new Date().toISOString()
    });
  }
}
