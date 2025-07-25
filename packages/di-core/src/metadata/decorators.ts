// Modern Decorator implementations using the metadata system

import {
  setClassMetadata,
  setPropertyMetadata,
  setMethodMetadata,
  createMetadataKey,
  type MetadataKey
} from './index';

/**
 * Marks a class as injectable for dependency injection
 */
export function Injectable(scope: 'singleton' | 'prototype' | 'transient' = 'singleton') {
  return function <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext
  ): T {
    setClassMetadata(target, {
      injectable: true,
      scope
    });
    
    return target;
  };
}

/**
 * Marks a property for dependency injection
 */
export function Inject(token?: MetadataKey | string, optional: boolean = false) {
  return function (
    target: undefined,
    context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext
  ) {
    context.addInitializer(function (this: any) {
      setPropertyMetadata(this.constructor.prototype, context.name, {
        token,
        optional,
        inject: true
      });
    });
  };
}

/**
 * Marks a class as singleton scope
 */
export function Singleton<T extends new (...args: any[]) => any>(
  target: T,
  context: ClassDecoratorContext
): T {
  setClassMetadata(target, {
    scope: 'singleton'
  });
  
  return target;
}

/**
 * Sets a custom scope for a class
 */
export function Scope(scope: 'singleton' | 'prototype' | 'transient') {
  return function <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext
  ): T {
    setClassMetadata(target, {
      scope
    });
    
    return target;
  };
}

/**
 * Marks a method to be called after instance construction
 */
export function PostConstruct(
  target: Function,
  context: ClassMethodDecoratorContext
): Function {
  context.addInitializer(function (this: any) {
    setMethodMetadata(this.constructor.prototype, context.name, {
      lifecycle: 'postConstruct'
    });
  });
  
  return target;
}

/**
 * Marks a method to be called before instance destruction
 */
export function PreDestroy(
  target: Function,
  context: ClassMethodDecoratorContext
): Function {
  context.addInitializer(function (this: any) {
    setMethodMetadata(this.constructor.prototype, context.name, {
      lifecycle: 'preDestroy'
    });
  });
  
  return target;
}

/**
 * Provides a service with a specific token
 */
export function Provider(token: MetadataKey | string, value: any) {
  return function <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext
  ): T {
    const providers = [{ token, value }];
    
    setClassMetadata(target, {
      providers
    });
    
    return target;
  };
}

// Commonly used metadata keys
export const DESIGN_TYPE = createMetadataKey<Function>('design:type');
export const DESIGN_PARAM_TYPES = createMetadataKey<Function[]>('design:paramtypes');
export const DESIGN_RETURN_TYPE = createMetadataKey<Function>('design:returntype');