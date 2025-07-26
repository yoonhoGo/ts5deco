import { MiddlewareFunction } from '../types';
import { setControllerMetadata } from '../metadata';

/**
 * 컨트롤러 데코레이터 옵션
 */
export interface ControllerOptions {
  path?: string;
  middlewares?: MiddlewareFunction[];
}

/**
 * 컨트롤러를 정의하는 데코레이터 - TypeScript 5 Modern Decorator
 * 
 * @param pathOrOptions - 기본 경로 또는 옵션 객체
 * @returns 클래스 데코레이터
 * 
 * @example
 * ```typescript
 * @Controller('/api/users')
 * export class UserController {
 *   // ...
 * }
 * 
 * @Controller({ path: '/api/users', middlewares: [authMiddleware] })
 * export class UserController {
 *   // ...
 * }
 * ```
 */
export function Controller(pathOrOptions?: string | ControllerOptions) {
  return function <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext
  ): T {
    let path = '';
    let middlewares: MiddlewareFunction[] = [];

    if (typeof pathOrOptions === 'string') {
      path = pathOrOptions;
    } else if (pathOrOptions) {
      path = pathOrOptions.path || '';
      middlewares = pathOrOptions.middlewares || [];
    }

    // 경로 정규화 (중복 슬래시 제거, 시작 슬래시 보장)
    path = ('/' + path).replace(/\/+/g, '/').replace(/\/$/, '') || '/';

    setControllerMetadata(target, {
      path,
      middlewares
    });

    return target;
  };
}
