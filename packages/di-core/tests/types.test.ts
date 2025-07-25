// Type safety and inference tests for core types

import {
  ServiceIdentifier,
  ServiceScope,
  Provider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
  IContainer,
  ServiceOptions,
  ContainerOptions,
  isClassProvider,
  isValueProvider,
  isFactoryProvider,
  isExistingProvider,
  ContainerError,
  CircularDependencyError,
  ServiceNotFoundError,
  InvalidProviderError
} from '../src/types';

import {
  TypedFactory,
  DependencyArray,
  ExtractConstructorParams,
  ITypedContainer,
  ValidateService,
  ServiceInterface
} from '../src/types/advanced';

import {
  PREDEFINED_TOKENS,
  STRING_TOKENS,
  SYMBOL_TOKENS,
  DEFAULT_CONTAINER_OPTIONS
} from '../src/types/constants';

import { createMetadataKey } from '../src/metadata';

describe('Core Types', () => {
  describe('ServiceIdentifier', () => {
    it('should accept class constructors', () => {
      class TestService {}
      const token: ServiceIdentifier<TestService> = TestService;
      expect(token).toBe(TestService);
    });

    it('should accept string tokens', () => {
      const token: ServiceIdentifier<string> = 'test-service';
      expect(token).toBe('test-service');
    });

    it('should accept symbol tokens', () => {
      const token: ServiceIdentifier<number> = Symbol('test');
      expect(typeof token).toBe('symbol');
    });

    it('should accept metadata keys', () => {
      const token: ServiceIdentifier<boolean> = createMetadataKey<boolean>('test');
      expect(token.description).toBe('test');
    });
  });

  describe('ServiceScope', () => {
    it('should have correct enum values', () => {
      expect(ServiceScope.SINGLETON).toBe('singleton');
      expect(ServiceScope.PROTOTYPE).toBe('prototype');
      expect(ServiceScope.TRANSIENT).toBe('transient');
    });
  });

  describe('Provider Types', () => {
    class TestService {
      constructor(public value: string) {}
    }

    it('should validate ClassProvider', () => {
      const provider: ClassProvider<TestService> = {
        type: 'class',
        token: TestService,
        useClass: TestService,
        scope: ServiceScope.SINGLETON
      };

      expect(isClassProvider(provider)).toBe(true);
      expect(isValueProvider(provider)).toBe(false);
    });

    it('should validate ValueProvider', () => {
      const instance = new TestService('test');
      const provider: ValueProvider<TestService> = {
        type: 'value',
        token: TestService,
        useValue: instance
      };

      expect(isValueProvider(provider)).toBe(true);
      expect(isClassProvider(provider)).toBe(false);
    });

    it('should validate FactoryProvider', () => {
      const provider: FactoryProvider<TestService> = {
        type: 'factory',
        token: TestService,
        useFactory: (value: string) => new TestService(value),
        deps: ['config'],
        scope: ServiceScope.PROTOTYPE
      };

      expect(isFactoryProvider(provider)).toBe(true);
      expect(isExistingProvider(provider)).toBe(false);
    });

    it('should validate ExistingProvider', () => {
      const provider: ExistingProvider<TestService> = {
        type: 'existing',
        token: 'test-service',
        useExisting: TestService
      };

      expect(isExistingProvider(provider)).toBe(true);
      expect(isFactoryProvider(provider)).toBe(false);
    });
  });

  describe('Error Types', () => {
    it('should create ContainerError', () => {
      const error = new ContainerError('test error', 'test-token');
      expect(error.message).toBe('test error');
      expect(error.token).toBe('test-token');
      expect(error.name).toBe('ContainerError');
    });

    it('should create CircularDependencyError', () => {
      const chain = ['A', 'B', 'C', 'A'];
      const error = new CircularDependencyError(chain, 'A');
      expect(error.dependencyChain).toEqual(chain);
      expect(error.name).toBe('CircularDependencyError');
      expect(error.message).toContain('Circular dependency detected');
    });

    it('should create ServiceNotFoundError', () => {
      const error = new ServiceNotFoundError('missing-service');
      expect(error.token).toBe('missing-service');
      expect(error.name).toBe('ServiceNotFoundError');
      expect(error.message).toContain('Service not found');
    });

    it('should create InvalidProviderError', () => {
      const error = new InvalidProviderError('invalid config', 'test-token');
      expect(error.token).toBe('test-token');
      expect(error.name).toBe('InvalidProviderError');
    });
  });
});

describe('Advanced Types', () => {
  describe('Type Inference', () => {
    class TestService {
      constructor(
        public readonly config: string,
        public readonly port: number
      ) {}
    }

    it('should extract constructor parameters', () => {
      type Params = ExtractConstructorParams<typeof TestService>;
      const params: Params = ['test', 123];
      expect(params).toEqual(['test', 123]);
    });

    it('should infer service interface', () => {
      type Interface = ServiceInterface<typeof TestService>;
      const instance: Interface = new TestService('test', 123);
      expect(instance.config).toBe('test');
      expect(instance.port).toBe(123);
    });

    it('should validate service types at compile time', () => {
      // These should compile without errors
      type ValidService = ValidateService<typeof TestService>;
      const validToken: ValidService = TestService;
      expect(validToken).toBe(TestService);

      // Abstract classes should be rejected at compile time
      // (This would be caught by TypeScript compiler)
    });
  });

  describe('Typed Factory', () => {
    it('should provide type-safe factory functions', () => {
      const configToken = createMetadataKey<string>('config');
      const portToken = createMetadataKey<number>('port');
      
      const deps = [configToken, portToken] as const;
      type Deps = DependencyArray<typeof deps>;
      
      const factory: TypedFactory<string, typeof deps> = (config, port) => {
        // TypeScript should infer config as string and port as number
        return `${config}:${port}`;
      };

      const result = factory('localhost', 3000);
      expect(result).toBe('localhost:3000');
    });
  });
});

describe('Constants', () => {
  describe('Predefined Tokens', () => {
    it('should provide container token', () => {
      expect(PREDEFINED_TOKENS.CONTAINER.description).toBe('DI_CONTAINER');
    });

    it('should provide logger token', () => {
      expect(PREDEFINED_TOKENS.LOGGER.description).toBe('DI_LOGGER');
    });
  });

  describe('String Tokens', () => {
    it('should provide common service tokens', () => {
      expect(STRING_TOKENS.USER_SERVICE).toBe('UserService');
      expect(STRING_TOKENS.AUTH_SERVICE).toBe('AuthService');
    });
  });

  describe('Symbol Tokens', () => {
    it('should provide unique symbol tokens', () => {
      expect(typeof SYMBOL_TOKENS.CONTAINER_ID).toBe('symbol');
      expect(typeof SYMBOL_TOKENS.INJECTABLE_METADATA).toBe('symbol');
    });
  });

  describe('Default Options', () => {
    it('should provide sensible defaults', () => {
      expect(DEFAULT_CONTAINER_OPTIONS.defaultScope).toBe('singleton');
      expect(DEFAULT_CONTAINER_OPTIONS.autoBindInjectable).toBe(true);
      expect(DEFAULT_CONTAINER_OPTIONS.throwOnMissingDependencies).toBe(true);
    });
  });
});

describe('Type Safety', () => {
  describe('Container Interface Type Safety', () => {
    it('should enforce correct return types at compile time', () => {
      class TestService {}
      
      // This test verifies TypeScript type inference
      // The actual container implementation will be tested later
      type ResolveReturnType = ReturnType<IContainer['resolve']>;
      
      // This should compile - verifying the interface structure
      const mockResolve = (() => {}) as IContainer['resolve'];
      expect(typeof mockResolve).toBe('function');
    });

    it('should enforce correct provider types at compile time', () => {
      class TestService {}
      
      const provider: ClassProvider<TestService> = {
        type: 'class',
        token: TestService,
        useClass: TestService
      };

      // This should compile without errors - type structure validation
      expect(provider.type).toBe('class');
      expect(provider.token).toBe(TestService);
    });
  });

  describe('Service Options Type Safety', () => {
    it('should validate service options', () => {
      const options: ServiceOptions = {
        scope: ServiceScope.SINGLETON,
        lazy: true,
        tags: ['web', 'api'],
        onActivation: (instance) => instance,
        onDeactivation: (instance) => {}
      };

      expect(options.scope).toBe('singleton');
      expect(options.lazy).toBe(true);
      expect(options.tags).toEqual(['web', 'api']);
    });
  });

  describe('Container Options Type Safety', () => {
    it('should validate container options', () => {
      const options: ContainerOptions = {
        defaultScope: ServiceScope.PROTOTYPE,
        autoBindInjectable: false,
        throwOnMissingDependencies: false,
        enableCaching: true,
        maxCacheSize: 500
      };

      expect(options.defaultScope).toBe('prototype');
      expect(options.autoBindInjectable).toBe(false);
    });
  });
});

// Compile-time type tests (these would be validated by TypeScript)
describe('Compile-time Type Tests', () => {
  it('should prevent invalid service identifiers', () => {
    // These should work
    class ValidService {}
    const validToken1: ServiceIdentifier = ValidService;
    const validToken2: ServiceIdentifier = 'string-token';
    const validToken3: ServiceIdentifier = Symbol('symbol-token');
    const validToken4: ServiceIdentifier = createMetadataKey('metadata-token');

    expect(validToken1).toBe(ValidService);
    expect(validToken2).toBe('string-token');
    expect(typeof validToken3).toBe('symbol');
    expect(validToken4.description).toBe('metadata-token');
  });

  it('should enforce provider type consistency', () => {
    class TestService {}
    
    // This should be valid
    const validProvider: Provider<TestService> = {
      type: 'class',
      token: TestService,
      useClass: TestService
    };

    expect(validProvider.type).toBe('class');
  });
});