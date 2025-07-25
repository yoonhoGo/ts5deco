// Constants and predefined tokens for the DI framework

import { createMetadataKey } from '../metadata';
import type { ContainerOptions, ServiceScope } from './index';

/**
 * Predefined metadata keys for common scenarios
 */
export const PREDEFINED_TOKENS = {
  // Container and infrastructure
  CONTAINER: createMetadataKey<any>('DI_CONTAINER'),
  LOGGER: createMetadataKey<any>('DI_LOGGER'),
  CONFIG: createMetadataKey<any>('DI_CONFIG'),
  
  // Common service interfaces
  HTTP_CLIENT: createMetadataKey<any>('HTTP_CLIENT'),
  DATABASE: createMetadataKey<any>('DATABASE'),
  CACHE: createMetadataKey<any>('CACHE'),
  EVENT_BUS: createMetadataKey<any>('EVENT_BUS'),
  
  // Framework internals
  METADATA_READER: createMetadataKey<any>('METADATA_READER'),
  LIFECYCLE_MANAGER: createMetadataKey<any>('LIFECYCLE_MANAGER'),
  DEPENDENCY_RESOLVER: createMetadataKey<any>('DEPENDENCY_RESOLVER')
} as const;

/**
 * String tokens for common services
 */
export const STRING_TOKENS = {
  // Environment and configuration
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DATABASE_URL: 'DATABASE_URL',
  API_KEY: 'API_KEY',
  
  // Application services
  USER_SERVICE: 'UserService',
  AUTH_SERVICE: 'AuthService',
  EMAIL_SERVICE: 'EmailService',
  
  // Infrastructure
  REDIS_CLIENT: 'RedisClient',
  MONGO_CLIENT: 'MongoClient',
  MYSQL_CLIENT: 'MySQLClient'
} as const;

/**
 * Symbol tokens for unique identification
 */
export const SYMBOL_TOKENS = {
  // Core container symbols
  CONTAINER_ID: Symbol('DI_CONTAINER_ID'),
  PARENT_CONTAINER: Symbol('DI_PARENT_CONTAINER'),
  CHILD_CONTAINERS: Symbol('DI_CHILD_CONTAINERS'),
  
  // Metadata symbols
  INJECTABLE_METADATA: Symbol('INJECTABLE_METADATA'),
  DEPENDENCIES_METADATA: Symbol('DEPENDENCIES_METADATA'),
  SCOPE_METADATA: Symbol('SCOPE_METADATA'),
  
  // Lifecycle symbols
  POST_CONSTRUCT: Symbol('POST_CONSTRUCT'),
  PRE_DESTROY: Symbol('PRE_DESTROY'),
  
  // Special tokens
  SELF: Symbol('DI_SELF'),
  OPTIONAL: Symbol('DI_OPTIONAL'),
  MULTIPLE: Symbol('DI_MULTIPLE')
} as const;

/**
 * Default container configuration
 */
export const DEFAULT_CONTAINER_OPTIONS: ContainerOptions = {
  defaultScope: 'singleton' as ServiceScope,
  autoBindInjectable: true,
  skipBaseClassChecks: false,
  throwOnMissingDependencies: true,
  enableCaching: true,
  maxCacheSize: 1000
};

/**
 * Default service scopes
 */
export const DEFAULT_SCOPES = {
  SINGLETON: 'singleton' as const,
  PROTOTYPE: 'prototype' as const, 
  TRANSIENT: 'transient' as const
};

/**
 * Container event names as constants
 */
export const CONTAINER_EVENTS = {
  SERVICE_REGISTERED: 'service:registered',
  SERVICE_RESOLVED: 'service:resolved', 
  SERVICE_CREATED: 'service:created',
  SERVICE_DISPOSED: 'service:disposed',
  CONTAINER_DISPOSED: 'container:disposed',
  DEPENDENCY_RESOLVED: 'dependency:resolved',
  CIRCULAR_DEPENDENCY: 'circular:dependency',
  MISSING_DEPENDENCY: 'missing:dependency'
} as const;

/**
 * Decorator metadata keys
 */
export const DECORATOR_KEYS = {
  INJECTABLE: 'design:injectable',
  INJECT: 'design:inject',
  SCOPE: 'design:scope',
  POST_CONSTRUCT: 'design:postconstruct',
  PRE_DESTROY: 'design:predestroy',
  OPTIONAL: 'design:optional',
  SELF: 'design:self',
  MULTIPLE: 'design:multiple'
} as const;

/**
 * Error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  SERVICE_NOT_FOUND: (token: string) => `Service not found: ${token}`,
  CIRCULAR_DEPENDENCY: (chain: string[]) => `Circular dependency detected: ${chain.join(' -> ')}`,
  INVALID_PROVIDER: (reason: string) => `Invalid provider: ${reason}`,
  CONTAINER_DISPOSED: 'Container has been disposed',
  INVALID_SCOPE: (scope: string) => `Invalid scope: ${scope}`,
  ABSTRACT_CLASS: (name: string) => `Cannot instantiate abstract class: ${name}`,
  MISSING_DEPENDENCY: (token: string, target: string) => `Missing dependency ${token} in ${target}`,
  INVALID_TOKEN: (token: string) => `Invalid service token: ${token}`,
  REGISTRATION_FAILED: (token: string, reason: string) => `Failed to register ${token}: ${reason}`,
  RESOLUTION_FAILED: (token: string, reason: string) => `Failed to resolve ${token}: ${reason}`
} as const;

/**
 * Performance and debugging constants
 */
export const PERFORMANCE_CONSTANTS = {
  MAX_RESOLUTION_DEPTH: 100,
  MAX_CIRCULAR_REFERENCES: 10,
  DEFAULT_CACHE_SIZE: 1000,
  DEFAULT_TIMEOUT_MS: 5000,
  GC_INTERVAL_MS: 60000, // 1 minute
  STATS_COLLECTION_INTERVAL_MS: 30000 // 30 seconds
} as const;

/**
 * Feature flags for optional functionality
 */
export const FEATURE_FLAGS = {
  ENABLE_ASYNC_RESOLUTION: true,
  ENABLE_LAZY_LOADING: true,
  ENABLE_PROXY_SERVICES: true,
  ENABLE_AOP_SUPPORT: false,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_DEBUG_LOGGING: false,
  ENABLE_STRICT_MODE: true
} as const;

/**
 * Type-safe access to all constants
 */
export const CONSTANTS = {
  TOKENS: {
    ...PREDEFINED_TOKENS,
    ...STRING_TOKENS,
    ...SYMBOL_TOKENS
  },
  DEFAULTS: {
    CONTAINER_OPTIONS: DEFAULT_CONTAINER_OPTIONS,
    SCOPES: DEFAULT_SCOPES
  },
  EVENTS: CONTAINER_EVENTS,
  DECORATORS: DECORATOR_KEYS,
  ERRORS: ERROR_MESSAGES,
  PERFORMANCE: PERFORMANCE_CONSTANTS,
  FEATURES: FEATURE_FLAGS
} as const;