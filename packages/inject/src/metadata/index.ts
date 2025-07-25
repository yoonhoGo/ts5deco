// Metadata collection system for Modern Decorators

export interface MetadataKey<T = any> {
  readonly key: symbol;
  readonly description: string;
}

export interface ClassMetadata {
  dependencies?: Array<MetadataKey | string>;
  scope?: 'singleton' | 'prototype' | 'transient';
  injectable?: boolean;
  providers?: Array<{ token: MetadataKey | string; value: any }>;
}

export interface PropertyMetadata {
  token?: MetadataKey | string | undefined;
  optional?: boolean;
  inject?: boolean;
}

export interface MethodMetadata {
  parameterTypes?: Array<MetadataKey | string>;
  returnType?: MetadataKey | string;
  lifecycle?: 'postConstruct' | 'preDestroy';
}

// Memory-efficient storage using WeakMap
const classMetadataStore = new WeakMap<Function, ClassMetadata>();
const propertyMetadataStore = new WeakMap<object, Map<string | symbol, PropertyMetadata>>();
const methodMetadataStore = new WeakMap<object, Map<string | symbol, MethodMetadata>>();

/**
 * Creates a metadata key for type-safe metadata operations
 */
export function createMetadataKey<T = any>(description: string): MetadataKey<T> {
  return {
    key: Symbol(description),
    description
  };
}

/**
 * Sets metadata for a class
 */
export function setClassMetadata(target: Function, metadata: ClassMetadata): void {
  const existing = classMetadataStore.get(target) || {};
  classMetadataStore.set(target, { ...existing, ...metadata });
}

/**
 * Gets metadata for a class
 */
export function getClassMetadata(target: Function): ClassMetadata | undefined {
  return classMetadataStore.get(target);
}

/**
 * Sets metadata for a class property
 */
export function setPropertyMetadata(
  target: object,
  propertyKey: string | symbol,
  metadata: PropertyMetadata
): void {
  let targetMetadata = propertyMetadataStore.get(target);
  if (!targetMetadata) {
    targetMetadata = new Map();
    propertyMetadataStore.set(target, targetMetadata);
  }
  
  const existing = targetMetadata.get(propertyKey) || {};
  targetMetadata.set(propertyKey, { ...existing, ...metadata });
}

/**
 * Gets metadata for a class property
 */
export function getPropertyMetadata(
  target: object,
  propertyKey: string | symbol
): PropertyMetadata | undefined {
  const targetMetadata = propertyMetadataStore.get(target);
  return targetMetadata?.get(propertyKey);
}

/**
 * Sets metadata for a class method
 */
export function setMethodMetadata(
  target: object,
  methodKey: string | symbol,
  metadata: MethodMetadata
): void {
  let targetMetadata = methodMetadataStore.get(target);
  if (!targetMetadata) {
    targetMetadata = new Map();
    methodMetadataStore.set(target, targetMetadata);
  }
  
  const existing = targetMetadata.get(methodKey) || {};
  targetMetadata.set(methodKey, { ...existing, ...metadata });
}

/**
 * Gets metadata for a class method
 */
export function getMethodMetadata(
  target: object,
  methodKey: string | symbol
): MethodMetadata | undefined {
  const targetMetadata = methodMetadataStore.get(target);
  return targetMetadata?.get(methodKey);
}

/**
 * Gets all property metadata for a class
 */
export function getAllPropertyMetadata(target: object): Map<string | symbol, PropertyMetadata> | undefined {
  return propertyMetadataStore.get(target);
}

/**
 * Gets all method metadata for a class
 */
export function getAllMethodMetadata(target: object): Map<string | symbol, MethodMetadata> | undefined {
  return methodMetadataStore.get(target);
}

/**
 * Checks if a class has any metadata
 */
export function hasClassMetadata(target: Function): boolean {
  return classMetadataStore.has(target);
}

/**
 * Checks if a property has metadata
 */
export function hasPropertyMetadata(target: object, propertyKey: string | symbol): boolean {
  const targetMetadata = propertyMetadataStore.get(target);
  return targetMetadata?.has(propertyKey) ?? false;
}

/**
 * Checks if a method has metadata
 */
export function hasMethodMetadata(target: object, methodKey: string | symbol): boolean {
  const targetMetadata = methodMetadataStore.get(target);
  return targetMetadata?.has(methodKey) ?? false;
}

/**
 * Clears all metadata for a class (useful for testing)
 */
export function clearClassMetadata(target: Function): void {
  classMetadataStore.delete(target);
  propertyMetadataStore.delete(target.prototype);
  methodMetadataStore.delete(target.prototype);
}