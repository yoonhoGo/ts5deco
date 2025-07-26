/**
 * 타입 안전한 OpenAPI 컨트롤러 예시
 *
 * 이 예시는 OpenAPI 타입과 연동된 타입 안전한 라우트 데코레이터를 사용하여
 * 컴파일 타임에 응답 타입을 검증하는 방법을 보여줍니다.
 */

import { Request, Response, NextFunction } from 'express';
import {
  createTypedRoutes,
  TypedController,
  JsonResponse,
  NoContentResponse
} from '../src';

// OpenAPI에서 생성된 타입들
import type { paths } from './types/generated/api';
import type { ApiResponse } from '../src/types/openapi';

/**
 * 타입 안전한 라우트 데코레이터 생성
 * 프로젝트의 OpenAPI 타입을 주입합니다.
 */
const TypedRoutes = createTypedRoutes<paths>();

/**
 * 타입 안전한 User 컨트롤러
 *
 * 모든 메서드의 반환 타입이 OpenAPI 스펙과 일치해야 합니다.
 * 잘못된 상태 코드를 사용하면 컴파일 에러가 발생합니다.
 */
@TypedController<paths>('/api')
export class TypedUserController {

  /**
   * 모든 사용자 조회
   * GET /api/users?page=1&limit=10
   *
   * OpenAPI 스펙에 따라 200(성공)과 500(에러) 응답만 허용됩니다.
   */
  @TypedRoutes.Get('/users')
  async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<ApiResponse<paths, '/users', 'get'>> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const users = await this.userService.getUsers(page, limit);

      // ✅ 200 응답 - OpenAPI 스펙에 정의된 응답
      // return JsonResponse.ok(users);

      // ✅ 200 응답 - OpenAPI 스펙에 정의된 응답
      // return JsonResponse.ok(users);

      // ❌ 다음 코드들은 컴파일 에러 발생:
      return JsonResponse.created(users);     // 201은 이 엔드포인트에 정의되지 않음
      // return JsonResponse.badRequest(error);  // 400은 이 엔드포인트에 정의되지 않음

    } catch (error) {
      // ✅ 500 응답 - OpenAPI 스펙에 정의된 에러 응답
      return JsonResponse.internalError({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch users',
        code: 'GET_USERS_ERROR'
      });
    }
  }

  /**
   * ID로 사용자 조회
   * GET /api/users/{id}
   *
   * OpenAPI 스펙에 따라 200(성공)과 404(찾을 수 없음) 응답만 허용됩니다.
   */
  @TypedRoutes.Get('/users/{id}')
  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<ApiResponse<paths, '/users/{id}', 'get'>> {
    const { id } = req.params;

    const user = await this.userService.findById(id);

    if (!user) {
      // ✅ 404 응답 - OpenAPI 스펙에 정의된 응답
      return JsonResponse.notFound({
        error: 'NOT_FOUND',
        message: `User with id ${id} not found`,
        code: 'USER_NOT_FOUND',
        statusCode: 404
      });
    }

    // ✅ 200 응답 - OpenAPI 스펙에 정의된 응답
    return JsonResponse.ok(user);

    // ❌ 다음 코드는 컴파일 에러 발생:
    // return JsonResponse.created(user);  // 201은 GET 엔드포인트에 정의되지 않음
  }

  /**
   * 새 사용자 생성
   * POST /api/users
   *
   * OpenAPI 스펙에 따라 201(생성됨)과 400(잘못된 요청) 응답만 허용됩니다.
   */
  @TypedRoutes.Post('/users')
  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<ApiResponse<paths, '/users', 'post'>> {
    try {
      const userData = req.body;

      // 유효성 검사
      if (!userData.name || !userData.email || !userData.password) {
        // ✅ 400 응답 - OpenAPI 스펙에 정의된 응답
        return JsonResponse.badRequest({
          error: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          code: 'INVALID_REQUEST_BODY'
        });
      }

      const user = await this.userService.create(userData);

      // ✅ 201 응답 - OpenAPI 스펙에 정의된 응답
      return JsonResponse.created(user);

      // ❌ 다음 코드는 컴파일 에러 발생:
      // return JsonResponse.ok(user);        // 200은 POST 엔드포인트에 정의되지 않음
      // return JsonResponse.notFound(error); // 404는 POST 엔드포인트에 정의되지 않음

    } catch (error: any) {
      if (error.code === 'DUPLICATE_EMAIL') {
        // ✅ 400 응답 - OpenAPI 스펙에 정의된 응답
        return JsonResponse.badRequest({
          error: 'DUPLICATE_EMAIL',
          message: 'Email already exists',
          code: 'DUPLICATE_EMAIL'
        });
      }

      // ✅ 400 응답 - 일반적인 에러도 400으로 처리
      return JsonResponse.badRequest({
        error: 'BAD_REQUEST',
        message: error.message || 'Failed to create user',
        code: 'CREATE_USER_ERROR'
      });
    }
  }

  /**
   * 사용자 정보 수정
   * PUT /api/users/{id}
   *
   * OpenAPI 스펙에 따라 200(성공)과 404(찾을 수 없음) 응답만 허용됩니다.
   */
  @TypedRoutes.Put('/users/{id}')
  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<ApiResponse<paths, '/users/{id}', 'put'>> {
    const { id } = req.params;
    const updateData = req.body;

    const user = await this.userService.update(id, updateData);

    if (!user) {
      // ✅ 404 응답 - OpenAPI 스펙에 정의된 응답
      return JsonResponse.notFound({
        error: 'NOT_FOUND',
        message: `User with id ${id} not found`,
        code: 'USER_NOT_FOUND',
        statusCode: 404
      });
    }

    // ✅ 200 응답 - OpenAPI 스펙에 정의된 응답
    return JsonResponse.ok(user);
  }

  /**
   * 사용자 삭제
   * DELETE /api/users/{id}
   *
   * OpenAPI 스펙에 따라 204(내용 없음)과 404(찾을 수 없음) 응답만 허용됩니다.
   */
  @TypedRoutes.Delete('/users/{id}')
  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<ApiResponse<paths, '/users/{id}', 'delete'>> {
    const { id } = req.params;

    const deleted = await this.userService.delete(id);

    if (!deleted) {
      // ✅ 404 응답 - OpenAPI 스펙에 정의된 응답
      return JsonResponse.notFound({
        error: 'NOT_FOUND',
        message: `User with id ${id} not found`,
        code: 'USER_NOT_FOUND',
        statusCode: 404
      });
    }

    // ✅ 204 응답 - OpenAPI 스펙에 정의된 응답 (NoContentResponse)
    return new NoContentResponse();

    // ❌ 다음 코드는 컴파일 에러 발생:
    // return JsonResponse.ok({ message: 'Deleted' }); // 200은 DELETE에 정의되지 않음
  }

  // 서비스 의존성 (예시용)
  private userService = new UserService();
}

/**
 * 예시 UserService (실제 구현에서는 별도 파일로 분리)
 */
class UserService {
  private users: any[] = [];
  private nextId = 1;

  async getUsers(page: number, limit: number) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = this.users.slice(start, end);

    return {
      data,
      total: this.users.length,
      page,
      limit,
      hasNext: page * limit < this.users.length,
      hasPrev: page > 1
    };
  }

  async findById(id: string) {
    return this.users.find(u => u.id === id) || null;
  }

  async create(data: any) {
    const user = {
      id: String(this.nextId++),
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.push(user);
    return user;
  }

  async update(id: string, data: any) {
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
