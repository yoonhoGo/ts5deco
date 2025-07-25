// Tests for metadata collection system

import {
  createMetadataKey,
  setClassMetadata,
  getClassMetadata,
  setPropertyMetadata,
  getPropertyMetadata,
  setMethodMetadata,
  getMethodMetadata,
  hasClassMetadata,
  hasPropertyMetadata,
  hasMethodMetadata,
  clearClassMetadata,
  type MetadataKey
} from '../src/metadata';

import {
  Injectable,
  Inject,
  Singleton,
  Scope,
  PostConstruct,
  PreDestroy,
  Provider,
  DESIGN_TYPE
} from '../src/metadata/decorators';

describe('Metadata System', () => {
  describe('MetadataKey', () => {
    it('should create unique metadata keys', () => {
      const key1 = createMetadataKey<string>('test-key-1');
      const key2 = createMetadataKey<string>('test-key-2');
      
      expect(key1.key).not.toBe(key2.key);
      expect(key1.description).toBe('test-key-1');
      expect(key2.description).toBe('test-key-2');
    });
  });

  describe('Class Metadata', () => {
    class TestClass {}

    beforeEach(() => {
      clearClassMetadata(TestClass);
    });

    it('should store and retrieve class metadata', () => {
      const metadata = {
        injectable: true,
        scope: 'singleton' as const
      };

      setClassMetadata(TestClass, metadata);
      const retrieved = getClassMetadata(TestClass);

      expect(retrieved).toEqual(metadata);
      expect(hasClassMetadata(TestClass)).toBe(true);
    });

    it('should merge metadata when setting multiple times', () => {
      setClassMetadata(TestClass, { injectable: true });
      setClassMetadata(TestClass, { scope: 'prototype' });

      const retrieved = getClassMetadata(TestClass);
      expect(retrieved).toEqual({
        injectable: true,
        scope: 'prototype'
      });
    });
  });

  describe('Property Metadata', () => {
    class TestClass {
      testProperty: string = '';
    }

    it('should store and retrieve property metadata', () => {
      const token = createMetadataKey<string>('test-token');
      const metadata = {
        token,
        optional: true,
        inject: true
      };

      setPropertyMetadata(TestClass.prototype, 'testProperty', metadata);
      const retrieved = getPropertyMetadata(TestClass.prototype, 'testProperty');

      expect(retrieved).toEqual(metadata);
      expect(hasPropertyMetadata(TestClass.prototype, 'testProperty')).toBe(true);
    });
  });

  describe('Method Metadata', () => {
    class TestClass {
      testMethod() {}
    }

    it('should store and retrieve method metadata', () => {
      const metadata = {
        lifecycle: 'postConstruct' as const
      };

      setMethodMetadata(TestClass.prototype, 'testMethod', metadata);
      const retrieved = getMethodMetadata(TestClass.prototype, 'testMethod');

      expect(retrieved).toEqual(metadata);
      expect(hasMethodMetadata(TestClass.prototype, 'testMethod')).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should allow garbage collection of classes', () => {
      class TempClass {}
      
      setClassMetadata(TempClass, { injectable: true });
      expect(hasClassMetadata(TempClass)).toBe(true);
      
      clearClassMetadata(TempClass);
      expect(hasClassMetadata(TempClass)).toBe(false);
    });
  });
});

describe('Modern Decorators', () => {
  beforeEach(() => {
    // Clear any existing metadata
  });

  describe('@Injectable', () => {
    it('should mark class as injectable with default singleton scope', () => {
      @Injectable()
      class TestService {}

      const metadata = getClassMetadata(TestService);
      expect(metadata?.injectable).toBe(true);
      expect(metadata?.scope).toBe('singleton');
    });

    it('should mark class as injectable with custom scope', () => {
      @Injectable('prototype')
      class TestService {}

      const metadata = getClassMetadata(TestService);
      expect(metadata?.injectable).toBe(true);
      expect(metadata?.scope).toBe('prototype');
    });
  });

  describe('@Singleton', () => {
    it('should mark class as singleton', () => {
      @Singleton
      class TestService {}

      const metadata = getClassMetadata(TestService);
      expect(metadata?.scope).toBe('singleton');
    });
  });

  describe('@Scope', () => {
    it('should set custom scope', () => {
      @Scope('transient')
      class TestService {}

      const metadata = getClassMetadata(TestService);
      expect(metadata?.scope).toBe('transient');
    });
  });

  describe('@Inject', () => {
    it('should mark property for injection', () => {
      const token = createMetadataKey<string>('test-token');

      class TestService {
        @Inject(token)
        dependency!: string;
      }

      const instance = new TestService();
      const metadata = getPropertyMetadata(TestService.prototype, 'dependency');
      
      expect(metadata?.inject).toBe(true);
      expect(metadata?.token).toBe(token);
      expect(metadata?.optional).toBe(false);
    });

    it('should mark property as optional', () => {
      class TestService {
        @Inject(undefined, true)
        dependency?: string;
      }

      const instance = new TestService();
      const metadata = getPropertyMetadata(TestService.prototype, 'dependency');
      
      expect(metadata?.inject).toBe(true);
      expect(metadata?.optional).toBe(true);
    });
  });

  describe('@PostConstruct', () => {
    it('should mark method as post construct lifecycle', () => {
      class TestService {
        @PostConstruct
        init() {}
      }

      const instance = new TestService();
      const metadata = getMethodMetadata(TestService.prototype, 'init');
      
      expect(metadata?.lifecycle).toBe('postConstruct');
    });
  });

  describe('@PreDestroy', () => {
    it('should mark method as pre destroy lifecycle', () => {
      class TestService {
        @PreDestroy
        cleanup() {}
      }

      const instance = new TestService();
      const metadata = getMethodMetadata(TestService.prototype, 'cleanup');
      
      expect(metadata?.lifecycle).toBe('preDestroy');
    });
  });

  describe('Combined Decorators', () => {
    it('should work with multiple decorators', () => {
      const token = createMetadataKey<string>('test-token');

      @Scope('singleton') // Applied second, should win
      @Injectable('prototype') // Applied first
      class TestService {
        @Inject(token, true)
        dependency?: string;

        @PostConstruct
        init() {}

        @PreDestroy
        cleanup() {}
      }

      const instance = new TestService();
      const classMetadata = getClassMetadata(TestService);
      const propMetadata = getPropertyMetadata(TestService.prototype, 'dependency');
      const initMetadata = getMethodMetadata(TestService.prototype, 'init');
      const cleanupMetadata = getMethodMetadata(TestService.prototype, 'cleanup');

      expect(classMetadata?.injectable).toBe(true);
      expect(classMetadata?.scope).toBe('singleton');
      
      expect(propMetadata?.inject).toBe(true);
      expect(propMetadata?.token).toBe(token);
      expect(propMetadata?.optional).toBe(true);
      
      expect(initMetadata?.lifecycle).toBe('postConstruct');
      expect(cleanupMetadata?.lifecycle).toBe('preDestroy');
    });
  });
});