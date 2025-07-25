// Comprehensive tests for IoC Container

import {
  Container,
  ContainerFactory,
  ServiceScope,
  ServiceNotFoundError,
  CircularDependencyError,
  InvalidProviderError,
  Injectable,
  Inject,
  PostConstruct,
  PreDestroy,
  Singleton,
  createMetadataKey
} from '../src';

describe('IoC Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  afterEach(async () => {
    await container.dispose();
  });

  describe('Basic Registration and Resolution', () => {
    it('should register and resolve a class provider', () => {
      class TestService {
        getValue() { return 'test'; }
      }

      container.register({
        type: 'class',
        token: TestService,
        useClass: TestService
      });

      const instance = container.resolve(TestService);
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('test');
    });

    it('should register and resolve a value provider', () => {
      const testValue = { message: 'hello world' };
      
      container.register({
        type: 'value',
        token: 'test-value',
        useValue: testValue
      });

      const resolved = container.resolve('test-value');
      expect(resolved).toBe(testValue);
    });

    it('should register and resolve a factory provider', () => {
      const factory = () => ({ created: new Date(), value: 42 });
      
      container.register({
        type: 'factory',
        token: 'factory-service',
        useFactory: factory
      });

      const instance = container.resolve('factory-service');
      expect(instance.value).toBe(42);
      expect(instance.created).toBeInstanceOf(Date);
    });

    it('should register and resolve an existing provider', () => {
      class OriginalService {
        getValue() { return 'original'; }
      }

      container.register({
        type: 'class',
        token: OriginalService,
        useClass: OriginalService
      });

      container.register({
        type: 'existing',
        token: 'alias-service',
        useExisting: OriginalService
      });

      const original = container.resolve(OriginalService);
      const alias = container.resolve('alias-service');
      expect(alias).toBe(original);
    });
  });

  describe('Service Scopes', () => {
    it('should return the same instance for singleton scope', () => {
      class SingletonService {}

      container.register({
        type: 'class',
        token: SingletonService,
        useClass: SingletonService,
        scope: ServiceScope.SINGLETON
      });

      const instance1 = container.resolve(SingletonService);
      const instance2 = container.resolve(SingletonService);
      expect(instance1).toBe(instance2);
    });

    it('should return different instances for prototype scope', () => {
      class PrototypeService {}

      container.register({
        type: 'class',
        token: PrototypeService,
        useClass: PrototypeService,
        scope: ServiceScope.PROTOTYPE
      });

      const instance1 = container.resolve(PrototypeService);
      const instance2 = container.resolve(PrototypeService);
      expect(instance1).not.toBe(instance2);
    });

    it('should return different instances for transient scope', () => {
      class TransientService {}

      container.register({
        type: 'class',
        token: TransientService,
        useClass: TransientService,
        scope: ServiceScope.TRANSIENT
      });

      const instance1 = container.resolve(TransientService);
      const instance2 = container.resolve(TransientService);
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Dependency Injection with Decorators', () => {
    it('should inject dependencies using @Injectable and @Inject', () => {
      const configToken = createMetadataKey<string>('config');

      container.register({
        type: 'value',
        token: configToken,
        useValue: 'test-config'
      });

      @Injectable()
      class DatabaseService {
        @Inject(configToken)
        config!: string;

        getConfig() {
          return this.config;
        }
      }

      container.register({
        type: 'class',
        token: DatabaseService,
        useClass: DatabaseService
      });

      const instance = container.resolve(DatabaseService);
      expect(instance.getConfig()).toBe('test-config');
    });

    it('should call @PostConstruct methods after instantiation', () => {
      const initSpy = jest.fn();

      @Injectable()
      class ServiceWithInit {
        initialized = false;

        @PostConstruct
        init() {
          this.initialized = true;
          initSpy();
        }
      }

      container.register({
        type: 'class',
        token: ServiceWithInit,
        useClass: ServiceWithInit
      });

      const instance = container.resolve(ServiceWithInit);
      expect(instance.initialized).toBe(true);
      expect(initSpy).toHaveBeenCalledTimes(1);
    });

    it('should call @PreDestroy methods on disposal', async () => {
      const destroySpy = jest.fn();

      @Injectable()
      class ServiceWithDestroy {
        @PreDestroy
        cleanup() {
          destroySpy();
        }
      }

      container.register({
        type: 'class',
        token: ServiceWithDestroy,
        useClass: ServiceWithDestroy
      });

      // Resolve to create instance
      container.resolve(ServiceWithDestroy);

      await container.dispose();
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fluent Binding API', () => {
    it('should support fluent binding with bind().to()', () => {
      class TestService {
        getValue() { return 'fluent'; }
      }

      container.bind('test-service').to(TestService).inSingletonScope();

      const instance = container.resolve('test-service');
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('fluent');
    });

    it('should support binding to value', () => {
      const testValue = { message: 'fluent value' };
      
      container.bind('test-value').toValue(testValue);

      const resolved = container.resolve('test-value');
      expect(resolved).toBe(testValue);
    });

    it('should support binding to factory', () => {
      const factory = () => ({ type: 'factory-created' });
      
      container.bind('factory-service')
        .toFactory(factory)
        .inPrototypeScope();

      const instance1 = container.resolve('factory-service');
      const instance2 = container.resolve('factory-service');
      
      expect(instance1.type).toBe('factory-created');
      expect(instance1).not.toBe(instance2);
    });

    it('should support binding to existing service', () => {
      class OriginalService {
        getName() { return 'original'; }
      }

      container.bind(OriginalService).toSelf().inSingletonScope();
      container.bind('alias').toExisting(OriginalService);

      const original = container.resolve(OriginalService);
      const alias = container.resolve('alias');
      expect(alias).toBe(original);
    });

    it('should support factory with dependencies', () => {
      class ConfigService {
        getPort() { return 3000; }
      }

      container.bind(ConfigService).toSelf().inSingletonScope();
      
      container.bind('server-config')
        .toFactory((config: ConfigService) => ({
          host: 'localhost',
          port: config.getPort()
        }))
        .withDependencies(ConfigService);

      const serverConfig = container.resolve('server-config');
      expect(serverConfig.host).toBe('localhost');
      expect(serverConfig.port).toBe(3000);
    });
  });

  describe('Error Handling', () => {
    it('should throw ServiceNotFoundError for unregistered services', () => {
      expect(() => {
        container.resolve('non-existent-service');
      }).toThrow(ServiceNotFoundError);
    });

    it('should detect circular dependencies', () => {
      // Use factory providers to explicitly define circular dependencies
      const serviceAFactory = (serviceB: any) => ({ serviceB });
      const serviceBFactory = (serviceA: any) => ({ serviceA });

      container.register({
        type: 'factory',
        token: 'ServiceA',
        useFactory: serviceAFactory,
        deps: ['ServiceB']
      });

      container.register({
        type: 'factory',
        token: 'ServiceB',
        useFactory: serviceBFactory,
        deps: ['ServiceA']
      });

      expect(() => {
        container.resolve('ServiceA');
      }).toThrow(CircularDependencyError);
    });

    it('should validate provider configurations', () => {
      expect(() => {
        container.register({
          type: 'class',
          token: 'invalid-provider',
          useClass: null as any
        });
      }).toThrow(InvalidProviderError);
    });

    it('should throw error when using disposed container', async () => {
      await container.dispose();

      expect(() => {
        container.resolve('any-service');
      }).toThrow('Container has been disposed');
    });
  });

  describe('Child Containers', () => {
    it('should create child containers', () => {
      const child = container.createChild();
      expect(child).toBeDefined();
      expect(child.getParent()).toBe(container);
    });

    it('should resolve services from parent container', () => {
      class ParentService {
        getValue() { return 'from-parent'; }
      }

      container.register({
        type: 'class',
        token: ParentService,
        useClass: ParentService
      });

      const child = container.createChild();
      const instance = child.resolve(ParentService);
      expect(instance.getValue()).toBe('from-parent');
    });

    it('should override parent services in child container', () => {
      class BaseService {
        getValue() { return 'base'; }
      }

      class ChildService extends BaseService {
        getValue() { return 'child'; }
      }

      container.register({
        type: 'class',
        token: 'service',
        useClass: BaseService
      });

      const child = container.createChild();
      child.register({
        type: 'class',
        token: 'service',
        useClass: ChildService
      });

      const parentInstance = container.resolve('service');
      const childInstance = child.resolve('service');

      expect(parentInstance.getValue()).toBe('base');
      expect(childInstance.getValue()).toBe('child');
    });

    it('should dispose child containers when parent is disposed', async () => {
      const child1 = container.createChild();
      const child2 = container.createChild();

      await container.dispose();

      expect(() => child1.resolve('any')).toThrow('Container has been disposed');
      expect(() => child2.resolve('any')).toThrow('Container has been disposed');
    });
  });

  describe('Container Utilities', () => {
    it('should check if service is registered', () => {
      class TestService {}

      expect(container.has(TestService)).toBe(false);

      container.register({
        type: 'class',
        token: TestService,
        useClass: TestService
      });

      expect(container.has(TestService)).toBe(true);
    });

    it('should unbind services', () => {
      class TestService {}

      container.register({
        type: 'class',
        token: TestService,
        useClass: TestService
      });

      expect(container.has(TestService)).toBe(true);
      
      const unbound = container.unbind(TestService);
      expect(unbound).toBe(true);
      expect(container.has(TestService)).toBe(false);
    });

    it('should get all registered services', () => {
      class Service1 {}
      class Service2 {}

      container.register({
        type: 'class',
        token: Service1,
        useClass: Service1
      });

      container.register({
        type: 'class',
        token: Service2,
        useClass: Service2
      });

      const services = container.getServices();
      expect(services).toContain(Service1);
      expect(services).toContain(Service2);
    });

    it('should clear all registrations', () => {
      class Service1 {}
      class Service2 {}

      container.register({
        type: 'class',
        token: Service1,
        useClass: Service1
      });

      container.register({
        type: 'class',
        token: Service2,
        useClass: Service2
      });

      expect(container.getServices()).toHaveLength(2);
      
      container.clear();
      expect(container.getServices()).toHaveLength(0);
    });

    it('should try resolve and return undefined for missing services', () => {
      const result = container.tryResolve('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('Service Options', () => {
    it('should call onActivation hook when service is created', () => {
      const activationSpy = jest.fn();

      class TestService {}

      container.register({
        type: 'class',
        token: TestService,
        useClass: TestService
      }, {
        onActivation: activationSpy
      });

      const instance = container.resolve(TestService);
      expect(activationSpy).toHaveBeenCalledWith(instance);
    });

    it('should call onDeactivation hook when service is disposed', async () => {
      const deactivationSpy = jest.fn();

      class TestService {}

      container.register({
        type: 'class',
        token: TestService,
        useClass: TestService
      }, {
        onDeactivation: deactivationSpy
      });

      const instance = container.resolve(TestService);
      await container.dispose();
      
      expect(deactivationSpy).toHaveBeenCalledWith(instance);
    });

    it('should support service tags', () => {
      class WebService {}

      container.register({
        type: 'class',
        token: WebService,
        useClass: WebService
      }, {
        tags: ['web', 'api', 'public']
      });

      // Tags functionality would be tested more thoroughly 
      // when tag-based resolution is implemented
      expect(container.has(WebService)).toBe(true);
    });
  });
});

describe('Container Factory', () => {
  it('should create default container', () => {
    const container = ContainerFactory.create();
    expect(container).toBeDefined();
  });

  it('should create singleton-optimized container', () => {
    const container = ContainerFactory.createSingletonContainer();
    expect(container).toBeDefined();
  });

  it('should create prototype-optimized container', () => {
    const container = ContainerFactory.createPrototypeContainer();
    expect(container).toBeDefined();
  });

  it('should create test container', () => {
    const container = ContainerFactory.createTestContainer();
    expect(container).toBeDefined();
  });

  it('should create strict container', () => {
    const container = ContainerFactory.createStrictContainer();
    expect(container).toBeDefined();
  });

  it('should create high-performance container', () => {
    const container = ContainerFactory.createHighPerformanceContainer();
    expect(container).toBeDefined();
  });
});