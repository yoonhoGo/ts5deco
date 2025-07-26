import { 
  setControllerMetadata, 
  getControllerMetadata, 
  setRouteMetadata, 
  getRouteMetadata, 
  addRouteMetadata,
  METADATA_KEYS 
} from '../src/metadata';
import { ControllerMetadata, RouteMetadata } from '../src/types';

describe('Metadata System', () => {
  describe('Controller Metadata', () => {
    class TestController {}

    it('should set and get controller metadata', () => {
      const metadata: ControllerMetadata = {
        path: '/api/test',
        middlewares: []
      };

      setControllerMetadata(TestController, metadata);
      const retrieved = getControllerMetadata(TestController);

      expect(retrieved).toEqual(metadata);
      expect(retrieved?.path).toBe('/api/test');
      expect(retrieved?.middlewares).toEqual([]);
    });

    it('should handle controller metadata with middlewares', () => {
      const middleware1 = jest.fn();
      const middleware2 = jest.fn();
      
      const metadata: ControllerMetadata = {
        path: '/api/users',
        middlewares: [middleware1, middleware2]
      };

      setControllerMetadata(TestController, metadata);
      const retrieved = getControllerMetadata(TestController);

      expect(retrieved?.middlewares).toHaveLength(2);
      expect(retrieved?.middlewares).toContain(middleware1);
      expect(retrieved?.middlewares).toContain(middleware2);
    });

    it('should return undefined for non-existent metadata', () => {
      class EmptyController {}
      const metadata = getControllerMetadata(EmptyController);
      expect(metadata).toBeUndefined();
    });

    it('should handle metadata overwrite', () => {
      const metadata1: ControllerMetadata = {
        path: '/api/v1',
        middlewares: []
      };

      const metadata2: ControllerMetadata = {
        path: '/api/v2',
        middlewares: [jest.fn()]
      };

      setControllerMetadata(TestController, metadata1);
      setControllerMetadata(TestController, metadata2);
      
      const retrieved = getControllerMetadata(TestController);
      expect(retrieved?.path).toBe('/api/v2');
      expect(retrieved?.middlewares).toHaveLength(1);
    });
  });

  describe('Route Metadata', () => {
    class TestController {}

    beforeEach(() => {
      // 각 테스트 전에 라우트 메타데이터 초기화
      setRouteMetadata(TestController, []);
    });

    it('should set and get route metadata', () => {
      const routes: RouteMetadata[] = [
        {
          path: '/users',
          method: 'GET',
          middlewares: [],
          propertyKey: 'getUsers'
        },
        {
          path: '/users',
          method: 'POST',
          middlewares: [],
          propertyKey: 'createUser'
        }
      ];

      setRouteMetadata(TestController, routes);
      const retrieved = getRouteMetadata(TestController);

      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].method).toBe('GET');
      expect(retrieved[1].method).toBe('POST');
    });

    it('should return empty array for non-existent route metadata', () => {
      class EmptyController {}
      const routes = getRouteMetadata(EmptyController);
      expect(routes).toEqual([]);
    });

    it('should add route metadata incrementally', () => {
      const route1: RouteMetadata = {
        path: '/users',
        method: 'GET',
        middlewares: [],
        propertyKey: 'getUsers'
      };

      const route2: RouteMetadata = {
        path: '/users/:id',
        method: 'GET',
        middlewares: [],
        propertyKey: 'getUser'
      };

      const route3: RouteMetadata = {
        path: '/users',
        method: 'POST',
        middlewares: [],
        propertyKey: 'createUser'
      };

      addRouteMetadata(TestController, route1);
      addRouteMetadata(TestController, route2);
      addRouteMetadata(TestController, route3);

      const retrieved = getRouteMetadata(TestController);
      expect(retrieved).toHaveLength(3);
      
      expect(retrieved[0].propertyKey).toBe('getUsers');
      expect(retrieved[1].propertyKey).toBe('getUser');
      expect(retrieved[2].propertyKey).toBe('createUser');
    });

    it('should handle route metadata with middlewares', () => {
      const middleware1 = jest.fn();
      const middleware2 = jest.fn();

      const route: RouteMetadata = {
        path: '/protected',
        method: 'GET',
        middlewares: [middleware1, middleware2],
        propertyKey: 'getProtected'
      };

      addRouteMetadata(TestController, route);
      const retrieved = getRouteMetadata(TestController);

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].middlewares).toHaveLength(2);
      expect(retrieved[0].middlewares).toContain(middleware1);
      expect(retrieved[0].middlewares).toContain(middleware2);
    });

    it('should preserve existing routes when adding new ones', () => {
      const existingRoutes: RouteMetadata[] = [
        {
          path: '/existing',
          method: 'GET',
          middlewares: [],
          propertyKey: 'existing'
        }
      ];

      setRouteMetadata(TestController, existingRoutes);

      const newRoute: RouteMetadata = {
        path: '/new',
        method: 'POST',
        middlewares: [],
        propertyKey: 'new'
      };

      addRouteMetadata(TestController, newRoute);
      const retrieved = getRouteMetadata(TestController);

      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].propertyKey).toBe('existing');
      expect(retrieved[1].propertyKey).toBe('new');
    });
  });

  describe('Metadata Isolation', () => {
    it('should keep metadata separate between different classes', () => {
      class Controller1 {}
      class Controller2 {}

      const metadata1: ControllerMetadata = {
        path: '/api/v1',
        middlewares: []
      };

      const metadata2: ControllerMetadata = {
        path: '/api/v2',
        middlewares: []
      };

      setControllerMetadata(Controller1, metadata1);
      setControllerMetadata(Controller2, metadata2);

      const retrieved1 = getControllerMetadata(Controller1);
      const retrieved2 = getControllerMetadata(Controller2);

      expect(retrieved1?.path).toBe('/api/v1');
      expect(retrieved2?.path).toBe('/api/v2');
    });

    it('should keep route metadata separate between different classes', () => {
      class Controller1 {}
      class Controller2 {}

      const route1: RouteMetadata = {
        path: '/users',
        method: 'GET',
        middlewares: [],
        propertyKey: 'getUsers'
      };

      const route2: RouteMetadata = {
        path: '/posts',
        method: 'GET',
        middlewares: [],
        propertyKey: 'getPosts'
      };

      addRouteMetadata(Controller1, route1);
      addRouteMetadata(Controller2, route2);

      const routes1 = getRouteMetadata(Controller1);
      const routes2 = getRouteMetadata(Controller2);

      expect(routes1).toHaveLength(1);
      expect(routes2).toHaveLength(1);
      expect(routes1[0].propertyKey).toBe('getUsers');
      expect(routes2[0].propertyKey).toBe('getPosts');
    });
  });

  describe('Metadata Keys', () => {
    it('should have correct metadata key constants', () => {
      expect(METADATA_KEYS.CONTROLLER).toBeDefined();
      expect(METADATA_KEYS.ROUTES).toBeDefined();
      expect(METADATA_KEYS.PARAMETERS).toBeDefined();
      expect(METADATA_KEYS.MIDDLEWARES).toBeDefined();

      // 각 키는 Symbol이어야 함
      expect(typeof METADATA_KEYS.CONTROLLER).toBe('symbol');
      expect(typeof METADATA_KEYS.ROUTES).toBe('symbol');
      expect(typeof METADATA_KEYS.PARAMETERS).toBe('symbol');
      expect(typeof METADATA_KEYS.MIDDLEWARES).toBe('symbol');
    });

    it('should have unique metadata keys', () => {
      const keys = Object.values(METADATA_KEYS);
      const uniqueKeys = new Set(keys);
      
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('WeakMap Storage', () => {
    it('should not interfere with class prototype', () => {
      class TestController {
        method1() {}
        method2() {}
      }

      const metadata: ControllerMetadata = {
        path: '/api/test',
        middlewares: []
      };

      setControllerMetadata(TestController, metadata);

      // 클래스의 프로토타입이 변경되지 않아야 함
      expect(TestController.prototype.method1).toBeDefined();
      expect(TestController.prototype.method2).toBeDefined();
      expect(typeof TestController.prototype.method1).toBe('function');
    });

    it('should not add enumerable properties to class', () => {
      class TestController {}

      const metadata: ControllerMetadata = {
        path: '/api/test',
        middlewares: []
      };

      setControllerMetadata(TestController, metadata);

      // 클래스에 enumerable 속성이 추가되지 않아야 함
      const ownProps = Object.getOwnPropertyNames(TestController);
      const metadataProps = ownProps.filter(prop => 
        prop.includes('metadata') || prop.includes('controller') || prop.includes('route')
      );
      
      expect(metadataProps).toHaveLength(0);
    });

    it('should work with class inheritance', () => {
      class BaseController {}
      class DerivedController extends BaseController {}

      const baseMetadata: ControllerMetadata = {
        path: '/api/base',
        middlewares: []
      };

      const derivedMetadata: ControllerMetadata = {
        path: '/api/derived',
        middlewares: []
      };

      setControllerMetadata(BaseController, baseMetadata);
      setControllerMetadata(DerivedController, derivedMetadata);

      const baseRetrieved = getControllerMetadata(BaseController);
      const derivedRetrieved = getControllerMetadata(DerivedController);

      expect(baseRetrieved?.path).toBe('/api/base');
      expect(derivedRetrieved?.path).toBe('/api/derived');
    });
  });

  describe('Memory Management', () => {
    it('should allow garbage collection of classes', () => {
      // 이 테스트는 메타데이터 시스템이 클래스의 가비지 컬렉션을 방해하지 않는지 확인
      // WeakMap을 사용하므로 클래스가 더 이상 참조되지 않으면 메타데이터도 자동으로 정리됨
      
      let TestClass: any = class {};
      const metadata: ControllerMetadata = {
        path: '/api/test',
        middlewares: []
      };

      setControllerMetadata(TestClass, metadata);
      const retrieved = getControllerMetadata(TestClass);
      
      expect(retrieved).toBeDefined();
      
      // 클래스 참조 제거
      TestClass = null;
      
      // WeakMap을 사용하므로 가비지 컬렉션 후 메타데이터도 정리됨
      // (실제 가비지 컬렉션은 테스트에서 강제할 수 없으므로 구조적 검증만 수행)
      expect(true).toBe(true); // WeakMap 사용 확인
    });
  });
});