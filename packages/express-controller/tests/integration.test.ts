import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { Controller } from '../src/decorators/controller';
import { Get, Post, Put, Delete, All } from '../src/decorators/route';
import { registerControllers } from '../src/router';
import { 
  JsonResponse, 
  TextResponse, 
  FileResponse, 
  NoContentResponse, 
  RedirectResponse 
} from '../src/responses';

// 통합 테스트를 위한 실제 컨트롤러들
@Controller('/api/users')
class UserController {
  @Get('/')
  async getUsers(req: Request, res: Response): Promise<any> {
    return JsonResponse.ok([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]);
  }

  @Get('/:id')
  async getUser(req: Request, res: Response): Promise<any> {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return JsonResponse.badRequest({ error: 'Invalid user ID' });
    }

    if (id === 999) {
      return JsonResponse.notFound({ error: 'User not found' });
    }

    return JsonResponse.ok({
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`
    });
  }

  @Post('/')
  async createUser(req: Request, res: Response): Promise<any> {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return JsonResponse.badRequest({ 
        error: 'Name and email are required' 
      });
    }

    return JsonResponse.created({
      id: Date.now(),
      name,
      email,
      createdAt: new Date().toISOString()
    });
  }

  @Put('/:id')
  async updateUser(req: Request, res: Response): Promise<any> {
    const id = parseInt(req.params.id);
    const { name, email } = req.body;

    return JsonResponse.ok({
      id,
      name: name || `User ${id}`,
      email: email || `user${id}@example.com`,
      updatedAt: new Date().toISOString()
    });
  }

  @Delete('/:id')
  async deleteUser(req: Request, res: Response): Promise<any> {
    const id = parseInt(req.params.id);
    
    if (id === 1) {
      return JsonResponse.forbidden({ error: 'Cannot delete admin user' });
    }

    return new NoContentResponse();
  }
}

// 미들웨어 테스트를 위한 컨트롤러
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  (req as any).user = { id: 1, name: 'Authenticated User' };
  next();
};

const validateAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.id !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

@Controller({ path: '/api/admin', middlewares: [authMiddleware] })
class AdminController {
  @Get('/users')
  async getAllUsers(req: Request, res: Response): Promise<any> {
    return JsonResponse.ok({
      users: [
        { id: 1, name: 'Admin', role: 'admin' },
        { id: 2, name: 'User', role: 'user' }
      ],
      requestedBy: (req as any).user
    });
  }

  @Post({ path: '/users/:id/ban', middlewares: [validateAdminMiddleware] })
  async banUser(req: Request, res: Response): Promise<any> {
    const id = parseInt(req.params.id);
    return JsonResponse.ok({
      message: `User ${id} has been banned`,
      bannedBy: (req as any).user
    });
  }

  @Get('/dashboard')
  async getDashboard(req: Request, res: Response): Promise<any> {
    return JsonResponse.ok({
      stats: {
        totalUsers: 150,
        activeUsers: 120,
        newUsersToday: 5
      },
      user: (req as any).user
    });
  }
}

// 다양한 응답 타입 테스트를 위한 컨트롤러
@Controller('/api/responses')
class ResponseController {
  @Get('/json')
  getJson(): any {
    return JsonResponse.ok({ message: 'JSON response', timestamp: Date.now() });
  }

  @Get('/text')
  getText(): any {
    return TextResponse.ok('Plain text response');
  }

  @Get('/redirect')
  getRedirect(): any {
    return new RedirectResponse('/api/responses/json');
  }

  @Get('/no-content')
  getNoContent(): any {
    return new NoContentResponse();
  }

  @Post('/file-upload')
  uploadFile(req: Request, res: Response): any {
    // 파일 업로드 시뮬레이션
    return JsonResponse.created({
      message: 'File uploaded successfully',
      filename: 'uploaded-file.pdf',
      size: 1024
    });
  }

  @Get('/status/:code')
  getCustomStatus(req: Request, res: Response): any {
    const code = parseInt(req.params.code);
    
    switch (code) {
      case 200:
        return JsonResponse.ok({ status: 'success' });
      case 400:
        return JsonResponse.badRequest({ error: 'Bad request' });
      case 401:
        return JsonResponse.unauthorized({ error: 'Unauthorized' });
      case 403:
        return JsonResponse.forbidden({ error: 'Forbidden' });
      case 404:
        return JsonResponse.notFound({ error: 'Not found' });
      case 500:
        return JsonResponse.internalError({ error: 'Internal server error' });
      default:
        return new JsonResponse(code, { message: `Custom status ${code}` });
    }
  }
}

// 에러 처리 테스트를 위한 컨트롤러
@Controller('/api/errors')
class ErrorController {
  @Get('/sync-error')
  syncError(): any {
    throw new Error('Synchronous error');
  }

  @Get('/async-error')
  async asyncError(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 10));
    throw new Error('Asynchronous error');
  }

  @Get('/handled-error')
  handledError(): any {
    try {
      throw new Error('This error is handled');
    } catch (error) {
      return JsonResponse.internalError({ 
        error: 'Error was caught and handled',
        originalMessage: (error as Error).message
      });
    }
  }
}

// 다양한 HTTP 메서드 테스트를 위한 컨트롤러
@Controller('/api/methods')
class HttpMethodController {
  @Get('/get')
  handleGet(): any {
    return TextResponse.ok('GET method');
  }

  @Post('/post')
  handlePost(req: Request): any {
    return JsonResponse.ok({ method: 'POST', body: req.body });
  }

  @Put('/put')
  handlePut(req: Request): any {
    return JsonResponse.ok({ method: 'PUT', body: req.body });
  }

  @Delete('/delete')
  handleDelete(): any {
    return JsonResponse.ok({ method: 'DELETE' });
  }

  @All('/all')
  handleAll(req: Request): any {
    return JsonResponse.ok({ 
      method: req.method,
      message: `Handled ${req.method} request`
    });
  }
}

describe('Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // 데코레이터 초기화를 위해 인스턴스 생성
    new UserController();
    new AdminController();
    new ResponseController();
    new ErrorController();
    new HttpMethodController();
  });

  describe('User Controller CRUD Operations', () => {
    beforeEach(() => {
      registerControllers(app, [UserController]);
    });

    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id', 1);
      expect(response.body[0]).toHaveProperty('name', 'John Doe');
    });

    it('should get user by ID', async () => {
      const response = await request(app)
        .get('/api/users/5')
        .expect(200);

      expect(response.body).toEqual({
        id: 5,
        name: 'User 5',
        email: 'user5@example.com'
      });
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid user ID'
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body).toEqual({
        error: 'User not found'
      });
    });

    it('should create new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'New User',
        email: 'newuser@example.com'
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 400 for invalid user data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Only Name' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Name and email are required'
      });
    });

    it('should update user', async () => {
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/users/10')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 10,
        name: 'Updated User',
        email: 'updated@example.com'
      });
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should delete user', async () => {
      await request(app)
        .delete('/api/users/5')
        .expect(204);
    });

    it('should return 403 when trying to delete admin user', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .expect(403);

      expect(response.body).toEqual({
        error: 'Cannot delete admin user'
      });
    });
  });

  describe('Admin Controller with Middleware', () => {
    beforeEach(() => {
      registerControllers(app, [AdminController]);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body).toEqual({
        error: 'No token provided'
      });
    });

    it('should access admin endpoint with auth token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body.requestedBy).toEqual({
        id: 1,
        name: 'Authenticated User'
      });
    });

    it('should access dashboard with auth', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalUsers', 150);
    });

    it('should ban user with admin middleware', async () => {
      const response = await request(app)
        .post('/api/admin/users/5/ban')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('User 5 has been banned');
      expect(response.body.bannedBy).toEqual({
        id: 1,
        name: 'Authenticated User'
      });
    });
  });

  describe('Response Types', () => {
    beforeEach(() => {
      registerControllers(app, [ResponseController]);
    });

    it('should return JSON response', async () => {
      const response = await request(app)
        .get('/api/responses/json')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'JSON response');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return text response', async () => {
      const response = await request(app)
        .get('/api/responses/text')
        .expect(200)
        .expect('Content-Type', /text/);

      expect(response.text).toBe('Plain text response');
    });

    it('should handle redirect response', async () => {
      const response = await request(app)
        .get('/api/responses/redirect')
        .expect(302);

      expect(response.headers.location).toBe('/api/responses/json');
    });

    it('should return no content response', async () => {
      await request(app)
        .get('/api/responses/no-content')
        .expect(204);
    });

    it('should handle file upload', async () => {
      const response = await request(app)
        .post('/api/responses/file-upload')
        .expect(201);

      expect(response.body).toEqual({
        message: 'File uploaded successfully',
        filename: 'uploaded-file.pdf',
        size: 1024
      });
    });

    it('should return custom status codes', async () => {
      const testCases = [
        { code: 200, expected: { status: 'success' } },
        { code: 400, expected: { error: 'Bad request' } },
        { code: 401, expected: { error: 'Unauthorized' } },
        { code: 403, expected: { error: 'Forbidden' } },
        { code: 404, expected: { error: 'Not found' } },
        { code: 500, expected: { error: 'Internal server error' } },
        { code: 418, expected: { message: 'Custom status 418' } }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .get(`/api/responses/status/${testCase.code}`)
          .expect(testCase.code);

        expect(response.body).toEqual(testCase.expected);
      }
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      registerControllers(app, [ErrorController]);
      
      // 에러 핸들링 미들웨어 (컨트롤러 등록 후)
      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ 
          error: err.message,
          type: 'unhandled_error'
        });
      });
    });

    it('should handle synchronous errors', async () => {
      const response = await request(app)
        .get('/api/errors/sync-error')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Synchronous error',
        type: 'unhandled_error'
      });
    });

    it('should handle asynchronous errors', async () => {
      const response = await request(app)
        .get('/api/errors/async-error')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Asynchronous error',
        type: 'unhandled_error'
      });
    });

    it('should handle caught errors gracefully', async () => {
      const response = await request(app)
        .get('/api/errors/handled-error')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Error was caught and handled',
        originalMessage: 'This error is handled'
      });
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      registerControllers(app, [HttpMethodController]);
    });

    it('should handle GET method', async () => {
      const response = await request(app)
        .get('/api/methods/get')
        .expect(200);

      expect(response.text).toBe('GET method');
    });

    it('should handle POST method', async () => {
      const body = { data: 'test' };
      const response = await request(app)
        .post('/api/methods/post')
        .send(body)
        .expect(200);

      expect(response.body).toEqual({
        method: 'POST',
        body: { data: 'test' }
      });
    });

    it('should handle PUT method', async () => {
      const body = { data: 'updated' };
      const response = await request(app)
        .put('/api/methods/put')
        .send(body)
        .expect(200);

      expect(response.body).toEqual({
        method: 'PUT',
        body: { data: 'updated' }
      });
    });

    it('should handle DELETE method', async () => {
      const response = await request(app)
        .delete('/api/methods/delete')
        .expect(200);

      expect(response.body).toEqual({
        method: 'DELETE'
      });
    });

    it('should handle all HTTP methods with @All decorator', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const response = await request(app)
          [method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch']('/api/methods/all')
          .expect(200);

        expect(response.body).toEqual({
          method,
          message: `Handled ${method} request`
        });
      }
    });
  });

  describe('Multiple Controllers Integration', () => {
    beforeEach(() => {
      registerControllers(app, [
        UserController,
        AdminController,
        ResponseController,
        HttpMethodController
      ]);
    });

    it('should handle requests to different controllers', async () => {
      // Test user controller
      const userResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(userResponse.body).toHaveLength(2);

      // Test admin controller (without auth - should fail)
      await request(app)
        .get('/api/admin/users')
        .expect(401);

      // Test response controller
      const responseTest = await request(app)
        .get('/api/responses/json')
        .expect(200);

      expect(responseTest.body).toHaveProperty('message');

      // Test method controller
      const methodTest = await request(app)
        .get('/api/methods/get')
        .expect(200);

      expect(methodTest.text).toBe('GET method');
    });

    it('should maintain separate middleware contexts', async () => {
      // Admin endpoint requires auth
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      // User endpoint doesn't require auth
      await request(app)
        .get('/api/users')
        .expect(200);

      // Admin endpoint with auth works
      const adminResponse = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(adminResponse.body).toHaveProperty('stats');
    });
  });
});