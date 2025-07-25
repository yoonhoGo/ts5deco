// Core types and interfaces for the DI/IoC Framework

import type { MetadataKey } from '../metadata';

/**
 * Service identifier type - can be a constructor, string, symbol, or MetadataKey
 */
export type ServiceIdentifier<T = any> = 
  | (new (...args: any[]) => T)
  | string 
  | symbol 
  | MetadataKey<T>;

/**
 * Service scope enumeration
 */
export enum ServiceScope {
  SINGLETON = 'singleton',
  PROTOTYPE = 'prototype', 
  TRANSIENT = 'transient'
}

/**
 * Service lifecycle hooks
 */
export enum ServiceLifecycle {
  POST_CONSTRUCT = 'postConstruct',
  PRE_DESTROY = 'preDestroy'
}

/**
 * Provider types for different service registration patterns
 */
export interface ClassProvider<T = any> {
  type: 'class';
  token: ServiceIdentifier<T>;
  useClass: new (...args: any[]) => T;
  scope?: ServiceScope;
}

export interface ValueProvider<T = any> {
  type: 'value';
  token: ServiceIdentifier<T>;
  useValue: T;
}

export interface FactoryProvider<T = any> {
  type: 'factory';
  token: ServiceIdentifier<T>;
  useFactory: (...deps: any[]) => T;
  deps?: ServiceIdentifier[];
  scope?: ServiceScope;
}

export interface ExistingProvider<T = any> {
  type: 'existing';
  token: ServiceIdentifier<T>;
  useExisting: ServiceIdentifier<T>;
}

/**
 * Union type for all provider types
 */
export type Provider<T = any> = 
  | ClassProvider<T>
  | ValueProvider<T> 
  | FactoryProvider<T>
  | ExistingProvider<T>;

/**
 * Service registration options
 */
export interface ServiceOptions {
  scope?: ServiceScope;
  lazy?: boolean;
  tags?: string[];
  onActivation?: (instance: any) => any;
  onDeactivation?: (instance: any) => void;
}

/**
 * Dependency injection information
 */
export interface DependencyInfo {
  token: ServiceIdentifier;
  optional: boolean;
  parameterIndex?: number;
  propertyKey?: string | symbol;
}

/**
 * Service registration metadata
 */
export interface ServiceRegistration<T = any> {
  token: ServiceIdentifier<T>;
  provider: Provider<T>;
  options: ServiceOptions;
  dependencies: DependencyInfo[];
  metadata: {
    registeredAt: Date;
    sourceLocation?: string;
  };
}

/**
 * Container configuration options
 */
export interface ContainerOptions {
  defaultScope?: ServiceScope;
  autoBindInjectable?: boolean;
  skipBaseClassChecks?: boolean;
  throwOnMissingDependencies?: boolean;
  enableCaching?: boolean;
  maxCacheSize?: number;
}

/**
 * Container interface for dependency injection operations
 */
export interface IContainer {
  /**
   * Register a service with the container
   */
  register<T>(provider: Provider<T>, options?: ServiceOptions): this;
  
  /**
   * Register a class as a service
   */
  bind<T>(token: ServiceIdentifier<T>): IBindingBuilder<T>;
  
  /**
   * Resolve a service instance
   */
  resolve<T>(token: ServiceIdentifier<T>): T;
  
  /**
   * Try to resolve a service, return undefined if not found
   */
  tryResolve<T>(token: ServiceIdentifier<T>): T | undefined;
  
  /**
   * Check if a service is registered
   */
  has(token: ServiceIdentifier): boolean;
  
  /**
   * Unbind a service from the container
   */
  unbind(token: ServiceIdentifier): boolean;
  
  /**
   * Create a child container
   */
  createChild(options?: Partial<ContainerOptions>): IContainer;
  
  /**
   * Get the parent container
   */
  getParent(): IContainer | undefined;
  
  /**
   * Get all registered service tokens
   */
  getServices(): ServiceIdentifier[];
  
  /**
   * Clear all registrations
   */
  clear(): void;
  
  /**
   * Dispose the container and all singleton instances
   */
  dispose(): Promise<void>;
}

/**
 * Fluent binding builder interface
 */
export interface IBindingBuilder<T> {
  to(implementation: new (...args: any[]) => T): IBindingOptions<T>;
  toValue(value: T): IBindingFinalized<T>;
  toFactory(factory: (...deps: any[]) => T): IBindingFactoryOptions<T>;
  toExisting(token: ServiceIdentifier<T>): IBindingFinalized<T>;
  toSelf(): IBindingOptions<T>;
}

export interface IBindingOptions<T> {
  inSingletonScope(): IBindingFinalized<T>;
  inPrototypeScope(): IBindingFinalized<T>;
  inTransientScope(): IBindingFinalized<T>;
  inScope(scope: ServiceScope): IBindingFinalized<T>;
  withOptions(options: ServiceOptions): IBindingFinalized<T>;
}

export interface IBindingFactoryOptions<T> {
  withDependencies(...deps: ServiceIdentifier[]): IBindingOptions<T>;
  inSingletonScope(): IBindingFinalized<T>;
  inPrototypeScope(): IBindingFinalized<T>;
  inTransientScope(): IBindingFinalized<T>;
  inScope(scope: ServiceScope): IBindingFinalized<T>;
  withOptions(options: ServiceOptions): IBindingFinalized<T>;
}

export interface IBindingFinalized<T> {
  // Marker interface for completed bindings
}

/**
 * Resolution context for tracking dependency resolution
 */
export interface ResolutionContext {
  container: IContainer;
  resolutionStack: ServiceIdentifier[];
  cache: Map<ServiceIdentifier, any>;
  isOptional: boolean;
}

/**
 * Service instance metadata
 */
export interface ServiceInstance<T = any> {
  instance: T;
  scope: ServiceScope;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  disposed: boolean;
}

/**
 * Container events
 */
export enum ContainerEvent {
  SERVICE_REGISTERED = 'service:registered',
  SERVICE_RESOLVED = 'service:resolved',
  SERVICE_CREATED = 'service:created',
  SERVICE_DISPOSED = 'service:disposed',
  CONTAINER_DISPOSED = 'container:disposed'
}

/**
 * Event data for container events
 */
export interface ContainerEventData {
  token: ServiceIdentifier;
  instance?: any;
  container: IContainer;
  timestamp: Date;
}

/**
 * Event listener type
 */
export type ContainerEventListener = (data: ContainerEventData) => void;

/**
 * Container snapshot for debugging/testing
 */
export interface ContainerSnapshot {
  registrations: ServiceRegistration[];
  instances: Map<ServiceIdentifier, ServiceInstance>;
  childContainers: IContainer[];
  options: ContainerOptions;
  createdAt: Date;
}

/**
 * Error types for container operations
 */
export class ContainerError extends Error {
  constructor(message: string, public readonly token?: ServiceIdentifier) {
    super(message);
    this.name = 'ContainerError';
  }
}

export class CircularDependencyError extends ContainerError {
  constructor(
    public readonly dependencyChain: ServiceIdentifier[],
    token?: ServiceIdentifier
  ) {
    super(
      `Circular dependency detected: ${dependencyChain.map(t => String(t)).join(' -> ')}`,
      token
    );
    this.name = 'CircularDependencyError';
  }
}

export class ServiceNotFoundError extends ContainerError {
  constructor(token: ServiceIdentifier) {
    super(`Service not found: ${String(token)}`, token);
    this.name = 'ServiceNotFoundError';
  }
}

export class InvalidProviderError extends ContainerError {
  constructor(message: string, token?: ServiceIdentifier) {
    super(message, token);
    this.name = 'InvalidProviderError';
  }
}

/**
 * Type guards for provider types
 */
export function isClassProvider(provider: Provider): provider is ClassProvider {
  return provider.type === 'class';
}

export function isValueProvider(provider: Provider): provider is ValueProvider {
  return provider.type === 'value';
}

export function isFactoryProvider(provider: Provider): provider is FactoryProvider {
  return provider.type === 'factory';
}

export function isExistingProvider(provider: Provider): provider is ExistingProvider {
  return provider.type === 'existing';
}

/**
 * Utility types for improved type inference
 */
export type ConstructorParameters<T extends new (...args: any[]) => any> = 
  T extends new (...args: infer P) => any ? P : never;

export type InstanceType<T extends new (...args: any[]) => any> = 
  T extends new (...args: any[]) => infer R ? R : any;

export type InferServiceType<T extends ServiceIdentifier> = 
  T extends new (...args: any[]) => infer R ? R :
  T extends MetadataKey<infer R> ? R :
  any;