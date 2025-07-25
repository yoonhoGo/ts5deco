// Advanced types and utilities for enhanced type safety

import type { ServiceIdentifier, Provider, ServiceScope } from './index';

/**
 * Conditional types for improved decorator type inference
 */
export type DecoratorTarget<T> = T extends ClassDecorator 
  ? new (...args: any[]) => any
  : T extends PropertyDecorator 
  ? any
  : T extends MethodDecorator
  ? (...args: any[]) => any
  : T extends ParameterDecorator
  ? any
  : never;

/**
 * Extract constructor parameter types for dependency injection
 */
export type ExtractConstructorParams<T extends new (...args: any[]) => any> = 
  T extends new (...args: infer P) => any ? P : never;

/**
 * Type-safe dependency array for factory providers
 */
export type DependencyArray<T extends readonly ServiceIdentifier[]> = {
  readonly [K in keyof T]: T[K] extends ServiceIdentifier<infer U> ? U : any;
};

/**
 * Factory function type with typed dependencies
 */
export type TypedFactory<T, TDeps extends readonly ServiceIdentifier[] = readonly ServiceIdentifier[]> = 
  (...deps: DependencyArray<TDeps>) => T;

/**
 * Enhanced factory provider with typed dependencies
 */
export interface TypedFactoryProvider<T, TDeps extends readonly ServiceIdentifier[] = readonly ServiceIdentifier[]> {
  type: 'factory';
  token: ServiceIdentifier<T>;
  useFactory: TypedFactory<T, TDeps>;
  deps: TDeps;
  scope?: ServiceScope;
}

/**
 * Service registration with compile-time type checking
 */
export type TypedServiceRegistration<T> = {
  [K in keyof Provider<T>]: Provider<T>[K];
} & {
  __serviceType?: T; // Phantom type for compile-time checking
};

/**
 * Container interface with enhanced type safety
 */
export interface ITypedContainer {
  /**
   * Register with enhanced type checking
   */
  registerTyped<T>(registration: TypedServiceRegistration<T>): this;
  
  /**
   * Resolve with guaranteed return type
   */
  resolveTyped<T>(token: ServiceIdentifier<T>): T;
  
  /**
   * Register a factory with typed dependencies
   */
  registerFactory<T, TDeps extends readonly ServiceIdentifier[]>(
    token: ServiceIdentifier<T>,
    factory: TypedFactory<T, TDeps>,
    deps: TDeps,
    scope?: ServiceScope
  ): this;
}

/**
 * Decorator context types for Modern Decorators
 */
export type InjectableDecoratorContext = ClassDecoratorContext;
export type InjectDecoratorContext = ClassFieldDecoratorContext | ClassAccessorDecoratorContext;
export type LifecycleDecoratorContext = ClassMethodDecoratorContext;

/**
 * Metadata extraction utilities
 */
export type ExtractMetadata<T> = T extends { __metadata: infer M } ? M : never;

/**
 * Service collection builder for bulk registrations
 */
export interface IServiceCollection {
  addSingleton<T>(token: ServiceIdentifier<T>, implementation?: new (...args: any[]) => T): this;
  addTransient<T>(token: ServiceIdentifier<T>, implementation?: new (...args: any[]) => T): this;
  addScoped<T>(token: ServiceIdentifier<T>, implementation?: new (...args: any[]) => T): this;
  addInstance<T>(token: ServiceIdentifier<T>, instance: T): this;
  addFactory<T>(token: ServiceIdentifier<T>, factory: (...deps: any[]) => T, deps?: ServiceIdentifier[]): this;
  build(): Provider[];
}

/**
 * Module definition for organizing services
 */
export interface ModuleMetadata {
  providers?: Provider[];
  imports?: ModuleClass[];
  exports?: ServiceIdentifier[];
}

export interface ModuleClass {
  new (...args: any[]): any;
}

/**
 * Async service resolution for lazy loading
 */
export interface IAsyncContainer {
  resolveAsync<T>(token: ServiceIdentifier<T>): Promise<T>;
  registerAsync<T>(token: ServiceIdentifier<T>, factory: () => Promise<T>): this;
}

/**
 * Conditional types for service validation
 */
export type ValidateService<T> = T extends abstract new (...args: any[]) => any
  ? 'Abstract classes cannot be used as concrete services'
  : T extends new (...args: any[]) => any
  ? T
  : 'Only constructable types can be used as services';

/**
 * Service interface extraction
 */
export type ServiceInterface<T> = T extends new (...args: any[]) => infer I ? I : never;

/**
 * Dependency graph types
 */
export interface DependencyNode {
  token: ServiceIdentifier;
  dependencies: Set<ServiceIdentifier>;
  dependents: Set<ServiceIdentifier>;
  depth: number;
}

export type DependencyGraph = Map<ServiceIdentifier, DependencyNode>;

/**
 * Resolution strategy types
 */
export enum ResolutionStrategy {
  THROW_ON_MISSING = 'throw',
  RETURN_UNDEFINED = 'undefined',
  USE_DEFAULT = 'default'
}

/**
 * Interceptor types for AOP support
 */
export interface IInterceptor {
  intercept(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor;
}

export type InterceptorFactory = (...args: any[]) => IInterceptor;

/**
 * Service proxy types for lazy loading and interception
 */
export interface ServiceProxy<T> {
  readonly __isProxy: true;
  readonly __target: ServiceIdentifier<T>;
  readonly __container: any; // Avoid circular dependency
}

/**
 * Compile-time service validation
 */
export type EnsureService<T> = T extends new (...args: any[]) => any 
  ? T 
  : never;

/**
 * Union type for all possible injection tokens
 */
export type InjectionToken<T = any> = 
  | ServiceIdentifier<T>
  | string 
  | symbol
  | { toString(): string };

/**
 * Helper type for optional dependencies
 */
export type Optional<T> = T | undefined;

/**
 * Container hierarchy types
 */
export interface ContainerHierarchy {
  root: any; // Avoid circular dependency
  current: any;
  path: any[];
}

/**
 * Service lifecycle state
 */
export enum ServiceState {
  REGISTERED = 'registered',
  CREATING = 'creating', 
  CREATED = 'created',
  DISPOSED = 'disposed'
}

/**
 * Enhanced error types with generic support
 */
export class TypedContainerError<T = any> extends Error {
  constructor(
    message: string,
    public readonly token?: ServiceIdentifier<T>,
    public readonly serviceType?: T
  ) {
    super(message);
    this.name = 'TypedContainerError';
  }
}