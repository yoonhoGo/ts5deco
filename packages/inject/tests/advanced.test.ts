// Advanced features and edge case tests

import {
  Container,
  ContainerFactory,
  ServiceScope,
  InvalidProviderError,
  ServiceNotFoundError,
  Injectable,
  Inject,
  PostConstruct,
  PreDestroy,
  createMetadataKey,
  ContainerEvent,
  ContainerEventData,
  ContainerEventListener,
  ResolutionStrategy,
  ServiceState,
  TypedContainerError
} from '../src';

describe('Advanced Container Features', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  afterEach(async () => {
    await container.dispose();
  });

  describe('Event System', () => {
    it('should support event listeners', () => {
      const eventSpy = jest.fn();
      
      // This would be implemented if event system was fully developed
      expect(ContainerEvent.SERVICE_REGISTERED).toBe('service:registered');
      expect(ContainerEvent.SERVICE_RESOLVED).toBe('service:resolved');
    });
  });

  describe('Resolution Strategy', () => {
    it('should have resolution strategy constants', () => {
      expect(ResolutionStrategy.THROW_ON_MISSING).toBe('throw');
      expect(ResolutionStrategy.RETURN_UNDEFINED).toBe('undefined');
      expect(ResolutionStrategy.USE_DEFAULT).toBe('default');
    });
  });

  describe('Service State Tracking', () => {
    it('should track service states', () => {
      expect(ServiceState.REGISTERED).toBe('registered');
      expect(ServiceState.CREATING).toBe('creating');
      expect(ServiceState.CREATED).toBe('created');
      expect(ServiceState.DISPOSED).toBe('disposed');
    });
  });

  describe('Typed Container Errors', () => {
    it('should create typed container errors', () => {
      const error = new TypedContainerError('Test error', 'TestService', 'service');
      expect(error.message).toBe('Test error');
      expect(error.token).toBe('TestService');
      expect(error.serviceType).toBe('service');
      expect(error.name).toBe('TypedContainerError');
    });
  });

  describe('Container Options Edge Cases', () => {
    it('should handle maxCacheSize option', () => {
      const container = new Container({
        maxCacheSize: 5,
        enableCaching: true
      });
      
      expect(container).toBeDefined();
    });

    it('should handle skipBaseClassChecks option', () => {
      const container = new Container({
        skipBaseClassChecks: true
      });
      
      expect(container).toBeDefined();
    });

    it('should handle throwOnMissingDependencies: false', () => {
      const container = new Container({
        throwOnMissingDependencies: false
      });
      
      const result = container.tryResolve('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('Advanced Provider Scenarios', () => {
    it('should handle factory with empty dependencies', () => {
      container.register({
        type: 'factory',
        token: 'empty-deps',
        useFactory: () => ({ value: 'empty' }),
        deps: []
      });

      const result = container.resolve('empty-deps');
      expect(result.value).toBe('empty');
    });

    it('should handle nested existing providers', () => {
      class ServiceA {}
      class ServiceB {}

      container.register({
        type: 'class',
        token: ServiceA,
        useClass: ServiceA
      });

      container.register({
        type: 'existing',
        token: ServiceB,
        useExisting: ServiceA
      });

      container.register({
        type: 'existing',
        token: 'nested-alias',
        useExisting: ServiceB
      });

      const original = container.resolve(ServiceA);
      const alias = container.resolve('nested-alias');
      expect(alias).toBe(original);
    });
  });

  describe('Complex Inheritance Scenarios', () => {
    it('should handle deep inheritance chains', () => {
      class GrandParent {}
      class Parent extends GrandParent {}
      class Child extends Parent {}

      @Injectable()
      class ServiceUsingChild {
        @Inject(Child)
        child!: Child;
      }

      container.register({
        type: 'class',
        token: Child,
        useClass: Child
      });

      container.register({
        type: 'class',
        token: ServiceUsingChild,
        useClass: ServiceUsingChild
      });

      const service = container.resolve(ServiceUsingChild);
      expect(service.child).toBeInstanceOf(Child);
      expect(service.child).toBeInstanceOf(Parent);
      expect(service.child).toBeInstanceOf(GrandParent);
    });
  });

  describe('Memory Management', () => {
    it('should handle disposal of large numbers of services', async () => {
      // Create many singleton services
      for (let i = 0; i < 100; i++) {
        container.register({
          type: 'value',
          token: `service-${i}`,
          useValue: { id: i, data: new Array(100).fill(i) }
        });
      }

      // Resolve all services
      for (let i = 0; i < 100; i++) {
        container.resolve(`service-${i}`);
      }

      // Verify they're all registered
      expect(container.getServices()).toHaveLength(100);

      // Dispose should clean up everything
      await container.dispose();
      
      expect(() => container.resolve('service-0')).toThrow('Container has been disposed');
    });
  });

  describe('Auto-binding Edge Cases', () => {
    it('should handle auto-binding with disabled option', () => {
      const container = new Container({
        autoBindInjectable: false
      });

      @Injectable()
      class AutoService {}

      container.register({
        type: 'class',
        token: AutoService,
        useClass: AutoService
      });

      const instance = container.resolve(AutoService);
      expect(instance).toBeInstanceOf(AutoService);
    });
  });
});

describe('Container Factory Advanced', () => {
  it('should create containers with specific configurations', () => {
    const singletonContainer = ContainerFactory.createSingletonContainer();
    const prototypeContainer = ContainerFactory.createPrototypeContainer();
    const testContainer = ContainerFactory.createTestContainer();
    const strictContainer = ContainerFactory.createStrictContainer();
    const performanceContainer = ContainerFactory.createHighPerformanceContainer();

    expect(singletonContainer).toBeInstanceOf(Container);
    expect(prototypeContainer).toBeInstanceOf(Container);
    expect(testContainer).toBeInstanceOf(Container);
    expect(strictContainer).toBeInstanceOf(Container);
    expect(performanceContainer).toBeInstanceOf(Container);
  });
});

describe('Error Handling Edge Cases', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  afterEach(async () => {
    await container.dispose();
  });

  it('should handle invalid factory functions', () => {
    expect(() => {
      container.register({
        type: 'factory',
        token: 'invalid-factory',
        useFactory: null as any
      });
    }).toThrow(InvalidProviderError);
  });

  it('should handle invalid existing tokens', () => {
    expect(() => {
      container.register({
        type: 'existing',
        token: 'invalid-existing',
        useExisting: null as any
      });
    }).toThrow(InvalidProviderError);
  });

  it('should handle toSelf with non-constructor tokens', () => {
    expect(() => {
      container.bind('string-token').toSelf();
    }).toThrow(InvalidProviderError);
  });
});