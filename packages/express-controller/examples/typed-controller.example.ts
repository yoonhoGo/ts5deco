/**
 * OpenAPI 타입을 활용한 컨트롤러 예시
 * 
 * 이 예시는 openapi-typescript로 생성된 타입을 활용하여
 * 타입 안전한 컨트롤러를 만드는 방법을 보여줍니다.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  JsonResponse,
  JsonResponses,
  NoContentResponse
} from '../src';

// OpenAPI에서 생성된 타입들
import type { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  ErrorResponse,
  PaginatedResponse
} from '../src/types/api';

// 타입 안전한 응답 타입 정의
type GetUsersResponse = JsonResponse<PaginatedResponse<User>, 200> | JsonResponse<ErrorResponse, 500>;
type GetUserResponse = JsonResponse<User, 200> | JsonResponse<ErrorResponse, 404>;
type CreateUserResponse = JsonResponse<User, 201> | JsonResponse<ErrorResponse, 400>;
type UpdateUserResponse = JsonResponse<User, 200> | JsonResponse<ErrorResponse, 404>;
type DeleteUserResponse = NoContentResponse | JsonResponse<ErrorResponse, 404>;

/**
 * 타입 안전한 User 컨트롤러
 * 
 * OpenAPI 스펙과 완벽하게 일치하는 타입을 사용합니다.
 */
@Controller('/api/users')
export class UserController {
  // 실제로는 서비스를 주입받아 사용
  constructor(private userService: UserService) {}

  /**
   * 모든 사용자 조회
   * GET /api/users?page=1&limit=10
   */
  @Get('/')
  async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<GetUsersResponse> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { users, total } = await this.userService.getUsers(page, limit);
      
      const response: PaginatedResponse<User> = {
        data: users,
        total,
        page,
        limit,
        hasNext: page * limit < total,
        hasPrev: page > 1
      };
      
      return JsonResponses.ok<PaginatedResponse<User>>(response);
    } catch (error) {
      return JsonResponses.internalError<ErrorResponse>({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch users',
        code: 'GET_USERS_ERROR'
      });
    }
  }

  /**
   * ID로 사용자 조회
   * GET /api/users/:id
   */
  @Get('/:id')
  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<GetUserResponse> {
    const { id } = req.params;
    
    const user = await this.userService.findById(id);
    
    if (!user) {
      return JsonResponses.notFound<ErrorResponse>({
        error: 'NOT_FOUND',
        message: `User with id ${id} not found`,
        code: 'USER_NOT_FOUND',
        statusCode: 404
      });
    }
    
    return JsonResponses.ok<User>(user);
  }

  /**
   * 새 사용자 생성
   * POST /api/users
   */
  @Post('/')
  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<CreateUserResponse> {
    try {
      // req.body의 타입을 명시적으로 지정
      const userData = req.body as CreateUserRequest;
      
      // 유효성 검사 (실제로는 별도의 validation 미들웨어 사용 권장)
      if (!userData.name || !userData.email || !userData.password) {
        return JsonResponses.badRequest<ErrorResponse>({
          error: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          code: 'INVALID_REQUEST_BODY'
        });
      }
      
      const user = await this.userService.create(userData);
      
      return JsonResponses.created<User>(user);
    } catch (error) {
      if (error.code === 'DUPLICATE_EMAIL') {
        return JsonResponses.badRequest<ErrorResponse>({
          error: 'DUPLICATE_EMAIL',
          message: 'Email already exists',
          code: 'DUPLICATE_EMAIL'
        });
      }
      
      return JsonResponses.badRequest<ErrorResponse>({
        error: 'BAD_REQUEST',
        message: error.message || 'Failed to create user',
        code: 'CREATE_USER_ERROR'
      });
    }
  }

  /**
   * 사용자 정보 수정
   * PUT /api/users/:id
   */
  @Put('/:id')
  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<UpdateUserResponse> {
    const { id } = req.params;
    const updateData = req.body as UpdateUserRequest;
    
    const user = await this.userService.update(id, updateData);
    
    if (!user) {
      return JsonResponses.notFound<ErrorResponse>({
        error: 'NOT_FOUND',
        message: `User with id ${id} not found`,
        code: 'USER_NOT_FOUND',
        statusCode: 404
      });
    }
    
    return JsonResponses.ok<User>(user);
  }

  /**
   * 사용자 삭제
   * DELETE /api/users/:id
   */
  @Delete('/:id')
  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<DeleteUserResponse> {
    const { id } = req.params;
    
    const deleted = await this.userService.delete(id);
    
    if (!deleted) {
      return JsonResponses.notFound<ErrorResponse>({
        error: 'NOT_FOUND',
        message: `User with id ${id} not found`,
        code: 'USER_NOT_FOUND',
        statusCode: 404
      });
    }
    
    return new NoContentResponse();
  }
}

/**
 * 예시 UserService (실제 구현에서는 별도 파일로 분리)
 */
class UserService {
  private users: User[] = [];
  private nextId = 1;

  async getUsers(page: number, limit: number): Promise<{ users: User[], total: number }> {
    const start = (page - 1) * limit;
    const end = start + limit;
    const users = this.users.slice(start, end);
    
    return {
      users,
      total: this.users.length
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async create(data: CreateUserRequest): Promise<User> {
    const user: User = {
      id: String(this.nextId++),
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.users.push(user);
    return user;
  }

  async update(id: string, data: UpdateUserRequest): Promise<User | null> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    this.users[index] = {
      ...this.users[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return this.users[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }
}
