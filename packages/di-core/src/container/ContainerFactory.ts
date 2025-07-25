// Container factory for creating and configuring containers

import { Container } from './Container';
import { IContainer, ContainerOptions, ServiceScope } from '../types';

/**
 * Factory for creating and configuring containers
 */
export class ContainerFactory {
  /**
   * Create a new container with default configuration
   */
  static create(options?: Partial<ContainerOptions>): IContainer {
    return new Container(options);
  }

  /**
   * Create a container optimized for singleton services
   */
  static createSingletonContainer(): IContainer {
    return new Container({
      defaultScope: ServiceScope.SINGLETON,
      enableCaching: true,
      autoBindInjectable: true,
      throwOnMissingDependencies: true
    });
  }

  /**
   * Create a container optimized for prototype services
   */
  static createPrototypeContainer(): IContainer {
    return new Container({
      defaultScope: ServiceScope.PROTOTYPE,
      enableCaching: false,
      autoBindInjectable: true,
      throwOnMissingDependencies: true
    });
  }

  /**
   * Create a testing container with relaxed validation
   */
  static createTestContainer(): IContainer {
    return new Container({
      defaultScope: ServiceScope.SINGLETON,
      enableCaching: true,
      autoBindInjectable: false,
      throwOnMissingDependencies: false,
      skipBaseClassChecks: true
    });
  }

  /**
   * Create a strict container with enhanced validation
   */
  static createStrictContainer(): IContainer {
    return new Container({
      defaultScope: ServiceScope.SINGLETON,
      enableCaching: true,
      autoBindInjectable: true,
      throwOnMissingDependencies: true,
      skipBaseClassChecks: false,
      maxCacheSize: 500
    });
  }

  /**
   * Create a high-performance container
   */
  static createHighPerformanceContainer(): IContainer {
    return new Container({
      defaultScope: ServiceScope.SINGLETON,
      enableCaching: true,
      autoBindInjectable: true,
      throwOnMissingDependencies: true,
      maxCacheSize: 2000
    });
  }
}