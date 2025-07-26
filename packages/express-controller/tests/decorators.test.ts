import { Controller } from '../src/decorators/controller';
import { Get as RouteGet, Post as RoutePost, All } from '../src/decorators/route';
import { getControllerMetadata, getRouteMetadata } from '../src/metadata';

describe('Decorators', () => {
  describe('@Controller', () => {
    it('should set controller metadata with string path', () => {
      @Controller('/api/users')
      class TestController {}

      const metadata = getControllerMetadata(TestController);
      expect(metadata).toBeDefined();
      expect(metadata?.path).toBe('/api/users');
      expect(metadata?.middlewares).toEqual([]);
    });

    it('should set controller metadata with options object', () => {
      const mockMiddleware = jest.fn();
      
      @Controller({ path: '/api/posts', middlewares: [mockMiddleware] })
      class TestController {}

      const metadata = getControllerMetadata(TestController);
      expect(metadata).toBeDefined();
      expect(metadata?.path).toBe('/api/posts');
      expect(metadata?.middlewares).toEqual([mockMiddleware]);
    });

    it('should normalize paths correctly', () => {
      @Controller('//api//users//')
      class TestController1 {}

      @Controller('')
      class TestController2 {}

      @Controller()
      class TestController3 {}

      const metadata1 = getControllerMetadata(TestController1);
      const metadata2 = getControllerMetadata(TestController2);
      const metadata3 = getControllerMetadata(TestController3);

      expect(metadata1?.path).toBe('/api/users');
      expect(metadata2?.path).toBe('/');
      expect(metadata3?.path).toBe('/');
    });

    it('should handle middleware arrays', () => {
      const middleware1 = jest.fn();
      const middleware2 = jest.fn();

      @Controller({ path: '/api', middlewares: [middleware1, middleware2] })
      class TestController {}

      const metadata = getControllerMetadata(TestController);
      expect(metadata?.middlewares).toHaveLength(2);
      expect(metadata?.middlewares).toContain(middleware1);
      expect(metadata?.middlewares).toContain(middleware2);
    });
  });

  describe('Route Decorators', () => {
    beforeEach(() => {
      // 각 테스트 전에 메타데이터 초기화를 위해 새로운 클래스를 사용
    });

    it('should register GET route metadata', () => {
      class TestController {
        @RouteGet('/users')
        getUsers() {}
      }

      const instance = new TestController();
      const routeMetadata = getRouteMetadata(TestController);
      
      expect(routeMetadata).toHaveLength(1);
      expect(routeMetadata[0].method).toBe('GET');
      expect(routeMetadata[0].path).toBe('/users');
      expect(routeMetadata[0].propertyKey).toBe('getUsers');
    });

    it('should register POST route metadata', () => {
      class TestController {
        @RoutePost('/users')
        createUser() {}
      }

      const instance = new TestController();
      const routeMetadata = getRouteMetadata(TestController);
      
      expect(routeMetadata).toHaveLength(1);
      expect(routeMetadata[0].method).toBe('POST');
      expect(routeMetadata[0].path).toBe('/users');
      expect(routeMetadata[0].propertyKey).toBe('createUser');
    });

    it('should handle route options with middlewares', () => {
      const routeMiddleware = jest.fn();
      
      class TestController {
        @RouteGet({ path: '/users/:id', middlewares: [routeMiddleware] })
        getUser() {}
      }

      const instance = new TestController();
      const routeMetadata = getRouteMetadata(TestController);
      
      expect(routeMetadata).toHaveLength(1);
      expect(routeMetadata[0].path).toBe('/users/:id');
      expect(routeMetadata[0].middlewares).toContain(routeMiddleware);
    });

    it('should normalize route paths', () => {
      class TestController {
        @RouteGet('//users//')
        getUsers() {}

        @RouteGet('')
        getRoot() {}
      }

      const instance = new TestController();
      const routeMetadata = getRouteMetadata(TestController);
      
      expect(routeMetadata).toHaveLength(2);
      expect(routeMetadata[0].path).toBe('/users');
      expect(routeMetadata[1].path).toBe('/');
    });

    it('should handle multiple routes on same class', () => {
      class TestController {
        @RouteGet('/users')
        getUsers() {}

        @RoutePost('/users')
        createUser() {}

        @RouteGet('/users/:id')
        getUser() {}
      }

      const instance = new TestController();
      const routeMetadata = getRouteMetadata(TestController);
      
      expect(routeMetadata).toHaveLength(3);
      
      const getMethods = routeMetadata.filter(r => r.method === 'GET');
      const postMethods = routeMetadata.filter(r => r.method === 'POST');
      
      expect(getMethods).toHaveLength(2);
      expect(postMethods).toHaveLength(1);
    });
  });

  describe('@All decorator', () => {
    it('should register routes for all HTTP methods', () => {
      class TestController {
        @All('/test')
        handleAll() {}
      }

      const instance = new TestController();
      const routeMetadata = getRouteMetadata(TestController);
      
      // All decorator는 7개 메서드에 대해 라우트를 등록
      expect(routeMetadata).toHaveLength(7);
      
      const methods = routeMetadata.map(r => r.method);
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('PUT');
      expect(methods).toContain('DELETE');
      expect(methods).toContain('PATCH');
      expect(methods).toContain('HEAD');
      expect(methods).toContain('OPTIONS');
    });

    it('should handle @All with middlewares', () => {
      const middleware = jest.fn();
      
      class TestController {
        @All({ path: '/test', middlewares: [middleware] })
        handleAll() {}
      }

      const instance = new TestController();
      const routeMetadata = getRouteMetadata(TestController);
      
      expect(routeMetadata).toHaveLength(7);
      routeMetadata.forEach(route => {
        expect(route.middlewares).toContain(middleware);
        expect(route.path).toBe('/test');
        expect(route.propertyKey).toBe('handleAll');
      });
    });
  });

  describe('Decorator Context', () => {
    it('should work with TypeScript 5 Modern Decorator context', () => {
      // 이 테스트는 TypeScript 5 Modern Decorator가 올바르게 동작하는지 확인
      class TestController {
        @RouteGet('/test')
        testMethod() {
          return 'test';
        }
      }

      // 인스턴스 생성이 정상적으로 이루어져야 함
      const instance = new TestController();
      expect(instance).toBeInstanceOf(TestController);
      expect(typeof instance.testMethod).toBe('function');
      expect(instance.testMethod()).toBe('test');

      // 메타데이터가 올바르게 저장되어야 함
      const routeMetadata = getRouteMetadata(TestController);
      expect(routeMetadata).toHaveLength(1);
    });

    it('should preserve method functionality after decoration', () => {
      class TestController {
        @RouteGet('/users')
        async getUsers() {
          return { users: ['user1', 'user2'] };
        }

        @RoutePost('/users')
        async createUser() {
          return { id: 1, name: 'test' };
        }
      }

      const instance = new TestController();
      
      // 메서드가 정상적으로 동작해야 함
      expect(instance.getUsers()).resolves.toEqual({ users: ['user1', 'user2'] });
      expect(instance.createUser()).resolves.toEqual({ id: 1, name: 'test' });
    });
  });
});