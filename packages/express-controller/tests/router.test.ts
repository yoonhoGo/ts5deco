import express, { Request, Response, NextFunction, Router } from 'express';
import request from 'supertest';
import { Controller } from '../src/decorators/controller';
import { Get, Post, Put, Delete, All } from '../src/decorators/route';
import { createRouter, registerController, registerControllers } from '../src/router';
import { JsonResponse } from '../src/responses/JsonResponse';

// 테스트용 컨트롤러들
@Controller('/api/users')
class UserController {
  @Get('/')
  getUsers(req: Request, res: Response) {
    return { users: ['user1', 'user2'] };
  }

  @Get('/:id')
  getUser(req: Request, res: Response) {
    return { id: req.params.id, name: 'John Doe' };
  }

  @Post('/')
  createUser(req: Request, res: Response) {
    return JsonResponse.created({ id: 1, name: 'New User' });
  }

  @Put('/:id')
  updateUser(req: Request, res: Response) {
    return { id: req.params.id, name: 'Updated User' };
  }

  @Delete('/:id')
  deleteUser(req: Request, res: Response) {
    return JsonResponse.ok({ message: 'User deleted' });
  }
}

@Controller('/api/posts')
class PostController {
  @Get('/')
  getPosts(req: Request, res: Response) {
    return { posts: ['post1', 'post2'] };
  }

  @Post('/')
  createPost(req: Request, res: Response) {
    return { id: 1, title: 'New Post' };
  }
}

// 미들웨어 테스트용 컨트롤러
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  (req as any).isAuthenticated = true;
  next();
};

const validateMiddleware = (req: Request, res: Response, next: NextFunction) => {
  (req as any).isValidated = true;
  next();
};

@Controller({ path: '/api/protected', middlewares: [authMiddleware] })
class ProtectedController {
  @Get('/')
  getProtectedData(req: Request, res: Response) {
    return { 
      data: 'secret',
      isAuthenticated: (req as any).isAuthenticated 
    };
  }

  @Get({ path: '/validated', middlewares: [validateMiddleware] })
  getValidatedData(req: Request, res: Response) {
    return { 
      data: 'validated-secret',
      isAuthenticated: (req as any).isAuthenticated,
      isValidated: (req as any).isValidated
    };
  }
}

// 에러 핸들링 테스트용 컨트롤러
@Controller('/api/error')
class ErrorController {
  @Get('/sync-error')
  syncError(req: Request, res: Response) {
    throw new Error('Sync error occurred');
  }

  @Get('/async-error')
  async asyncError(req: Request, res: Response) {
    throw new Error('Async error occurred');
  }

  @Get('/no-response')
  noResponse(req: Request, res: Response) {
    // 아무것도 반환하지 않음
  }

  @Get('/direct-response')
  directResponse(req: Request, res: Response) {
    res.status(200).json({ message: 'Direct response' });
    // 이미 응답이 전송됨
  }
}

describe('Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // 데코레이터 초기화를 위해 인스턴스 생성
    new UserController();
    new PostController();
    new ProtectedController();
    new ErrorController();
  });

  describe('createRouter', () => {
    it('should create router with single controller', async () => {
      const router = createRouter([UserController]);
      app.use(router);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual({ users: ['user1', 'user2'] });
    });

    it('should create router with multiple controllers', async () => {
      const router = createRouter([UserController, PostController]);
      app.use(router);

      const usersResponse = await request(app)
        .get('/api/users')
        .expect(200);

      const postsResponse = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(usersResponse.body).toEqual({ users: ['user1', 'user2'] });
      expect(postsResponse.body).toEqual({ posts: ['post1', 'post2'] });
    });

    it('should handle path parameters', async () => {
      const router = createRouter([UserController]);
      app.use(router);

      const response = await request(app)
        .get('/api/users/123')
        .expect(200);

      expect(response.body).toEqual({ id: '123', name: 'John Doe' });
    });

    it('should handle different HTTP methods', async () => {
      const router = createRouter([UserController]);
      app.use(router);

      // GET
      await request(app)
        .get('/api/users')
        .expect(200);

      // POST
      const postResponse = await request(app)
        .post('/api/users')
        .expect(201);
      
      expect(postResponse.body).toEqual({ id: 1, name: 'New User' });

      // PUT
      await request(app)
        .put('/api/users/123')
        .expect(200);

      // DELETE
      const deleteResponse = await request(app)
        .delete('/api/users/123')
        .expect(200);
      
      expect(deleteResponse.body).toEqual({ message: 'User deleted' });
    });
  });

  describe('registerController', () => {
    it('should register single controller to existing router', async () => {
      const router = Router();
      registerController(router, UserController);
      app.use(router);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual({ users: ['user1', 'user2'] });
    });

    it('should handle controller without @Controller decorator', () => {
      class PlainController {
        @Get('/plain')
        getPlain() {
          return { message: 'plain' };
        }
      }

      const router = Router();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      registerController(router, PlainController);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Controller PlainController does not have @Controller decorator'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('registerControllers', () => {
    it('should register controllers to express app with base path', async () => {
      registerControllers(app, [UserController, PostController], '/v1');

      const usersResponse = await request(app)
        .get('/v1/api/users')
        .expect(200);

      const postsResponse = await request(app)
        .get('/v1/api/posts')
        .expect(200);

      expect(usersResponse.body).toEqual({ users: ['user1', 'user2'] });
      expect(postsResponse.body).toEqual({ posts: ['post1', 'post2'] });
    });

    it('should register controllers without base path', async () => {
      registerControllers(app, [UserController]);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual({ users: ['user1', 'user2'] });
    });
  });

  describe('Middleware Support', () => {
    it('should apply controller-level middlewares', async () => {
      const router = createRouter([ProtectedController]);
      app.use(router);

      const response = await request(app)
        .get('/api/protected')
        .expect(200);

      expect(response.body).toEqual({
        data: 'secret',
        isAuthenticated: true
      });
    });

    it('should apply both controller and route-level middlewares', async () => {
      const router = createRouter([ProtectedController]);
      app.use(router);

      const response = await request(app)
        .get('/api/protected/validated')
        .expect(200);

      expect(response.body).toEqual({
        data: 'validated-secret',
        isAuthenticated: true,
        isValidated: true
      });
    });

    it('should apply middlewares in correct order', async () => {
      const executionOrder: string[] = [];
      
      const middleware1 = (req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('controller-middleware');
        next();
      };

      const middleware2 = (req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('route-middleware');
        next();
      };

      @Controller({ path: '/api/order', middlewares: [middleware1] })
      class OrderController {
        @Get({ path: '/test', middlewares: [middleware2] })
        test(req: Request, res: Response) {
          executionOrder.push('handler');
          return { order: executionOrder };
        }
      }

      // 인스턴스 생성으로 데코레이터 초기화
      new OrderController();
      
      const router = createRouter([OrderController]);
      app.use(router);

      const response = await request(app)
        .get('/api/order/test')
        .expect(200);

      expect(response.body.order).toEqual([
        'controller-middleware',
        'route-middleware', 
        'handler'
      ]);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      const router = createRouter([ErrorController]);
      app.use(router);
      
      // 에러 핸들링 미들웨어 추가 (라우터 등록 후)
      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });
    });

    it('should handle synchronous errors', async () => {
      const response = await request(app)
        .get('/api/error/sync-error')
        .expect(500);

      expect(response.body).toEqual({ error: 'Sync error occurred' });
    });

    it('should handle asynchronous errors', async () => {
      const response = await request(app)
        .get('/api/error/async-error')
        .expect(500);

      expect(response.body).toEqual({ error: 'Async error occurred' });
    });

    it('should not send response if already sent', async () => {
      const response = await request(app)
        .get('/api/error/direct-response')
        .expect(200);

      expect(response.body).toEqual({ message: 'Direct response' });
    });

    it('should handle methods that return undefined', async () => {
      // 아무것도 반환하지 않는 경우, Express가 404를 반환하지 않고 hanging 상태가 됨
      // 실제로는 개발자가 직접 응답을 보내거나 다음 미들웨어로 전달해야 함
      try {
        await request(app)
          .get('/api/error/no-response')
          .timeout(1000)
          .expect(200);
      } catch (error: any) {
        // 타임아웃이 발생하는 것이 정상 (응답이 전송되지 않음)
        expect(error.message).toMatch(/timeout/i);
      }
    });
  });

  describe('Response Handling', () => {
    it('should handle BaseResponse instances', async () => {
      const router = createRouter([UserController]);
      app.use(router);

      const response = await request(app)
        .post('/api/users')
        .expect(201);

      expect(response.body).toEqual({ id: 1, name: 'New User' });
    });

    it('should handle plain objects', async () => {
      const router = createRouter([UserController]);
      app.use(router);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual({ users: ['user1', 'user2'] });
    });
  });

  describe('Path Combination', () => {
    it('should correctly combine controller and route paths', async () => {
      @Controller('/api/v2')
      class PathTestController {
        @Get('/users')
        getUsers() {
          return { message: 'v2 users' };
        }

        @Get('/')
        getRoot() {
          return { message: 'v2 root' };
        }
      }

      // 인스턴스 생성으로 데코레이터 초기화
      new PathTestController();

      const router = createRouter([PathTestController]);
      app.use(router);

      const usersResponse = await request(app)
        .get('/api/v2/users')
        .expect(200);

      const rootResponse = await request(app)
        .get('/api/v2')
        .expect(200);

      expect(usersResponse.body).toEqual({ message: 'v2 users' });
      expect(rootResponse.body).toEqual({ message: 'v2 root' });
    });

    it('should handle edge cases in path combination', async () => {
      @Controller('/api/')
      class EdgeCaseController {
        @Get('//users//')
        getUsers() {
          return { message: 'edge case users' };
        }
      }

      // 인스턴스 생성으로 데코레이터 초기화
      new EdgeCaseController();

      const router = createRouter([EdgeCaseController]);
      app.use(router);

      // 정규화된 경로로 접근 가능해야 함
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual({ message: 'edge case users' });
    });
  });
});