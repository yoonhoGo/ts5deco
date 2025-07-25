// Core IoC Container implementation

import {
  ServiceIdentifier,
  ServiceScope,
  Provider,
  FactoryProvider,
  IContainer,
  ServiceOptions,
  ContainerOptions,
  ServiceRegistration,
  ResolutionContext,
  ServiceInstance,
  ContainerError,
  CircularDependencyError,
  ServiceNotFoundError,
  InvalidProviderError,
  isClassProvider,
  isValueProvider,
  isFactoryProvider,
  isExistingProvider,
  IBindingBuilder,
  IBindingOptions,
  IBindingFactoryOptions,
  IBindingFinalized
} from '../types';

import {
  getClassMetadata,
  getPropertyMetadata,
  getAllPropertyMetadata,
  getMethodMetadata,
  getAllMethodMetadata
} from '../metadata';

import { DEFAULT_CONTAINER_OPTIONS } from '../types/constants';

/**
 * Core IoC Container implementation
 */
export class Container implements IContainer {
  private readonly registrations = new Map<ServiceIdentifier, ServiceRegistration>();
  private readonly instances = new Map<ServiceIdentifier, ServiceInstance>();
  private readonly children = new Set<Container>();
  private readonly options: ContainerOptions;
  private readonly parent: Container | undefined;
  private disposed = false;

  constructor(options: Partial<ContainerOptions> = {}, parent?: Container) {
    this.options = { ...DEFAULT_CONTAINER_OPTIONS, ...options };
    this.parent = parent;
    if (parent) {
      parent.children.add(this);
    }
  }

  /**
   * Register a service with the container
   */
  register<T>(provider: Provider<T>, options: ServiceOptions = {}): this {
    this.throwIfDisposed();
    
    if (!provider || !provider.token) {
      throw new InvalidProviderError('Provider must have a valid token');
    }

    // Validate provider based on type
    this.validateProvider(provider);

    // Create registration metadata
    const registration: ServiceRegistration<T> = {
      token: provider.token,
      provider,
      options: {
        scope: options.scope || (provider as any).scope || this.options.defaultScope || ServiceScope.SINGLETON,
        lazy: options.lazy ?? true,
        tags: options.tags || [],
        ...(options.onActivation && { onActivation: options.onActivation }),
        ...(options.onDeactivation && { onDeactivation: options.onDeactivation })
      },
      dependencies: this.extractDependencies(provider),
      metadata: (() => {
        const location = this.getSourceLocation();
        return {
          registeredAt: new Date(),
          ...(location && { sourceLocation: location })
        };
      })()
    };

    this.registrations.set(provider.token, registration);
    
    // Auto-bind injectable classes if enabled
    if (this.options.autoBindInjectable && isClassProvider(provider)) {
      this.autoBindInjectableClass(provider.useClass);
    }

    return this;
  }

  /**
   * Create a fluent binding builder
   */
  bind<T>(token: ServiceIdentifier<T>): IBindingBuilder<T> {
    return new BindingBuilder<T>(token, this);
  }

  /**
   * Resolve a service instance
   */
  resolve<T>(token: ServiceIdentifier<T>): T {
    this.throwIfDisposed();
    
    const context: ResolutionContext = {
      container: this,
      resolutionStack: [],
      cache: new Map(),
      isOptional: false
    };

    return this.resolveWithContext<T>(token, context);
  }

  /**
   * Try to resolve a service, return undefined if not found
   */
  tryResolve<T>(token: ServiceIdentifier<T>): T | undefined {
    try {
      return this.resolve<T>(token);
    } catch (error) {
      if (error instanceof ServiceNotFoundError) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Check if a service is registered
   */
  has(token: ServiceIdentifier): boolean {
    return this.registrations.has(token) || (this.parent?.has(token) ?? false);
  }

  /**
   * Unbind a service from the container
   */
  unbind(token: ServiceIdentifier): boolean {
    this.throwIfDisposed();
    
    const instance = this.instances.get(token);
    if (instance) {
      this.disposeInstance(instance, token);
      this.instances.delete(token);
    }
    
    return this.registrations.delete(token);
  }

  /**
   * Create a child container
   */
  createChild(options: Partial<ContainerOptions> = {}): IContainer {
    this.throwIfDisposed();
    return new Container(options, this);
  }

  /**
   * Get the parent container
   */
  getParent(): IContainer | undefined {
    return this.parent;
  }

  /**
   * Get all registered service tokens
   */
  getServices(): ServiceIdentifier[] {
    const tokens = Array.from(this.registrations.keys());
    if (this.parent) {
      tokens.push(...this.parent.getServices());
    }
    return [...new Set(tokens)]; // Remove duplicates
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.throwIfDisposed();
    
    // Dispose all instances
    for (const [token, instance] of this.instances) {
      this.disposeInstance(instance, token);
    }
    
    this.instances.clear();
    this.registrations.clear();
  }

  /**
   * Dispose the container and all singleton instances
   */
  async dispose(): Promise<void> {
    if (this.disposed) return;
    
    this.disposed = true;
    
    // Dispose all child containers first
    for (const child of this.children) {
      await child.dispose();
    }
    this.children.clear();
    
    // Dispose all instances
    for (const [token, instance] of this.instances) {
      this.disposeInstance(instance, token);
    }
    
    this.instances.clear();
    this.registrations.clear();
    
    // Remove from parent
    if (this.parent) {
      this.parent.children.delete(this);
    }
  }

  // Private helper methods

  private resolveWithContext<T>(token: ServiceIdentifier<T>, context: ResolutionContext): T {
    // Check for circular dependencies
    if (context.resolutionStack.includes(token)) {
      throw new CircularDependencyError([...context.resolutionStack, token], token);
    }

    // Check cache first (only for circular dependency prevention during this resolution)
    if (context.cache.has(token)) {
      return context.cache.get(token);
    }

    // Find registration
    const registration = this.findRegistration(token);
    if (!registration) {
      if (this.options.throwOnMissingDependencies && !context.isOptional) {
        throw new ServiceNotFoundError(token);
      }
      return undefined as any;
    }

    const scope = registration.options.scope || ServiceScope.SINGLETON;

    // For prototype and transient scopes, don't check for existing instances
    // Only singletons should be cached
    if (scope === ServiceScope.SINGLETON) {
      const existingInstance = this.instances.get(token);
      if (existingInstance) {
        existingInstance.lastAccessed = new Date();
        existingInstance.accessCount++;
        return existingInstance.instance;
      }
    }

    // Add to resolution stack
    context.resolutionStack.push(token);

    try {
      // Create instance
      const instance = this.createInstance<T>(registration, context);
      
      // Cache singleton instances only
      if (scope === ServiceScope.SINGLETON) {
        const serviceInstance: ServiceInstance<T> = {
          instance,
          scope,
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 1,
          disposed: false
        };
        this.instances.set(token, serviceInstance);
      }

      // Add to resolution cache for circular dependency prevention 
      // (only during active resolution of this token)
      context.cache.set(token, instance);

      // Call activation hook if defined
      if (registration.options.onActivation) {
        registration.options.onActivation(instance);
      }

      return instance;
    } finally {
      // Remove from resolution stack
      context.resolutionStack.pop();
    }
  }

  private createInstance<T>(registration: ServiceRegistration<T>, context: ResolutionContext): T {
    const { provider } = registration;

    if (isClassProvider(provider)) {
      return this.createClassInstance(provider.useClass, context);
    }

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    if (isFactoryProvider(provider)) {
      const dependencies = this.resolveDependencies(provider.deps || [], context);
      return provider.useFactory(...dependencies);
    }

    if (isExistingProvider(provider)) {
      return this.resolveWithContext(provider.useExisting, context);
    }

    throw new InvalidProviderError(`Unknown provider type for token: ${String((provider as any).token)}`, (provider as any).token);
  }

  private createClassInstance<T>(constructor: new (...args: any[]) => T, context: ResolutionContext): T {
    // Get constructor dependencies from metadata
    const dependencies = this.getConstructorDependencies(constructor);
    const resolvedDependencies = this.resolveDependencies(dependencies, context);

    // Create instance
    const instance = new constructor(...resolvedDependencies);

    // Inject properties
    this.injectProperties(instance, context);

    // Call PostConstruct methods
    this.callLifecycleMethods(instance, 'postConstruct');

    return instance;
  }

  private getConstructorDependencies(constructor: Function): ServiceIdentifier[] {
    const metadata = getClassMetadata(constructor);
    return metadata?.dependencies || [];
  }

  private resolveDependencies(tokens: ServiceIdentifier[], context: ResolutionContext): any[] {
    return tokens.map(token => {
      const childContext = { ...context, isOptional: false };
      return this.resolveWithContext(token, childContext);
    });
  }

  private injectProperties(instance: any, context: ResolutionContext): void {
    const propertiesMetadata = getAllPropertyMetadata(instance.constructor.prototype);
    if (!propertiesMetadata) return;

    for (const [propertyKey, metadata] of propertiesMetadata) {
      if (metadata.inject && metadata.token) {
        try {
          const childContext = { ...context, isOptional: metadata.optional || false };
          const dependency = this.resolveWithContext(metadata.token, childContext);
          if (dependency !== undefined) {
            instance[propertyKey] = dependency;
          }
        } catch (error) {
          if (!metadata.optional) {
            throw error;
          }
        }
      }
    }
  }

  private callLifecycleMethods(instance: any, lifecycle: 'postConstruct' | 'preDestroy'): void {
    const methodsMetadata = getAllMethodMetadata(instance.constructor.prototype);
    if (!methodsMetadata) return;

    for (const [methodName, metadata] of methodsMetadata) {
      if (metadata.lifecycle === lifecycle) {
        const method = instance[methodName];
        if (typeof method === 'function') {
          method.call(instance);
        }
      }
    }
  }

  private findRegistration(token: ServiceIdentifier): ServiceRegistration | undefined {
    const registration = this.registrations.get(token);
    if (registration) return registration;

    // Check parent container
    if (this.parent) {
      return (this.parent as Container).findRegistration(token);
    }

    return undefined;
  }

  private validateProvider(provider: Provider): void {
    if (isClassProvider(provider)) {
      if (!provider.useClass || typeof provider.useClass !== 'function') {
        throw new InvalidProviderError('ClassProvider must have a valid useClass constructor');
      }
    } else if (isFactoryProvider(provider)) {
      if (!provider.useFactory || typeof provider.useFactory !== 'function') {
        throw new InvalidProviderError('FactoryProvider must have a valid useFactory function');
      }
    } else if (isExistingProvider(provider)) {
      if (!provider.useExisting) {
        throw new InvalidProviderError('ExistingProvider must have a valid useExisting token');
      }
    }
  }

  private extractDependencies(provider: Provider): any[] {
    if (isClassProvider(provider)) {
      return this.getConstructorDependencies(provider.useClass);
    }
    if (isFactoryProvider(provider)) {
      return provider.deps || [];
    }
    return [];
  }

  private autoBindInjectableClass(constructor: Function): void {
    const metadata = getClassMetadata(constructor);
    if (metadata?.injectable) {
      // Auto-register injectable dependencies
      const dependencies = metadata.dependencies || [];
      dependencies.forEach(dep => {
        if (typeof dep === 'function' && !this.has(dep)) {
          this.register({
            type: 'class',
            token: dep,
            useClass: dep as any
          });
        }
      });
    }
  }

  private disposeInstance(instance: ServiceInstance, token: ServiceIdentifier): void {
    if (instance.disposed) return;

    // Call PreDestroy methods
    this.callLifecycleMethods(instance.instance, 'preDestroy');

    // Call deactivation hook if defined
    const registration = this.registrations.get(token);
    if (registration?.options.onDeactivation) {
      registration.options.onDeactivation(instance.instance);
    }

    instance.disposed = true;
  }

  private getSourceLocation(): string | undefined {
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      for (let i = 3; i < lines.length; i++) {
        const line = lines[i];
        if (line && !line.includes('Container.ts') && !line.includes('node_modules')) {
          return line.trim();
        }
      }
    }
    return undefined;
  }

  private throwIfDisposed(): void {
    if (this.disposed) {
      throw new ContainerError('Container has been disposed');
    }
  }
}

/**
 * Fluent binding builder implementation
 */
class BindingBuilder<T> implements IBindingBuilder<T> {
  constructor(
    private readonly token: ServiceIdentifier<T>,
    private readonly container: Container
  ) {}

  to(implementation: new (...args: any[]) => T) {
    return new BindingOptions<T>(this.token, this.container, {
      type: 'class',
      token: this.token,
      useClass: implementation
    });
  }

  toValue(value: T) {
    this.container.register({
      type: 'value',
      token: this.token,
      useValue: value
    });
    return new BindingFinalized<T>();
  }

  toFactory(factory: (...deps: any[]) => T) {
    return new BindingFactoryOptions<T>(this.token, this.container, factory);
  }

  toExisting(token: ServiceIdentifier<T>) {
    this.container.register({
      type: 'existing',
      token: this.token,
      useExisting: token
    });
    return new BindingFinalized<T>();
  }

  toSelf() {
    if (typeof this.token !== 'function') {
      throw new InvalidProviderError('toSelf() can only be used with class tokens');
    }
    return this.to(this.token as any);
  }
}

class BindingOptions<T> implements IBindingOptions<T> {
  constructor(
    private readonly token: ServiceIdentifier<T>,
    private readonly container: Container,
    private provider: Provider<T>
  ) {}

  inSingletonScope() {
    this.container.register(this.provider, { scope: ServiceScope.SINGLETON });
    return new BindingFinalized<T>();
  }

  inPrototypeScope() {
    this.container.register(this.provider, { scope: ServiceScope.PROTOTYPE });
    return new BindingFinalized<T>();
  }

  inTransientScope() {
    this.container.register(this.provider, { scope: ServiceScope.TRANSIENT });
    return new BindingFinalized<T>();
  }

  inScope(scope: ServiceScope) {
    this.container.register(this.provider, { scope });
    return new BindingFinalized<T>();
  }

  withOptions(options: ServiceOptions) {
    this.container.register(this.provider, options);
    return new BindingFinalized<T>();
  }
}

class BindingFactoryOptions<T> implements IBindingFactoryOptions<T> {
  private deps: ServiceIdentifier[] = [];

  constructor(
    private readonly token: ServiceIdentifier<T>,
    private readonly container: Container,
    private readonly factory: (...deps: any[]) => T
  ) {}

  withDependencies(...deps: ServiceIdentifier[]) {
    this.deps = deps;
    // Register immediately with default scope
    this.container.register({
      type: 'factory',
      token: this.token,
      useFactory: this.factory,
      deps: this.deps
    });
    return new BindingFinalized<T>();
  }

  inSingletonScope() {
    this.container.register({
      type: 'factory',
      token: this.token,
      useFactory: this.factory,
      deps: this.deps,
      scope: ServiceScope.SINGLETON
    });
    return new BindingFinalized<T>();
  }

  inPrototypeScope() {
    this.container.register({
      type: 'factory',
      token: this.token,
      useFactory: this.factory,
      deps: this.deps,
      scope: ServiceScope.PROTOTYPE
    });
    return new BindingFinalized<T>();
  }

  inTransientScope() {
    this.container.register({
      type: 'factory',
      token: this.token,
      useFactory: this.factory,
      deps: this.deps,
      scope: ServiceScope.TRANSIENT
    });
    return new BindingFinalized<T>();
  }

  inScope(scope: ServiceScope) {
    this.container.register({
      type: 'factory',
      token: this.token,
      useFactory: this.factory,
      deps: this.deps,
      scope
    });
    return new BindingFinalized<T>();
  }

  withOptions(options: ServiceOptions) {
    this.container.register({
      type: 'factory',
      token: this.token,
      useFactory: this.factory,
      deps: this.deps
    }, options);
    return new BindingFinalized<T>();
  }
}

class BindingFinalized<T> implements IBindingFinalized<T> {
  // Marker class for completed bindings
}