import { HttpMethod, MiddlewareFunction } from '../types';
import { addRouteMetadata } from '../metadata';

/**
 * 라우트 데코레이터 옵션
 */
export interface RouteOptions {
  path?: string;
  middlewares?: MiddlewareFunction[];
}

/**
 * 기본 라우트 데코레이터 팩토리 - TypeScript 5 Modern Decorator
 */
function createRouteDecorator(method: HttpMethod) {
  return function (pathOrOptions?: string | RouteOptions) {
    return function (
      target: any,
      context: ClassMethodDecoratorContext
    ): void {
      let path = '';
      let middlewares: MiddlewareFunction[] = [];

      if (typeof pathOrOptions === 'string') {
        path = pathOrOptions;
      } else if (pathOrOptions) {
        path = pathOrOptions.path || '';
        middlewares = pathOrOptions.middlewares || [];
      }

      // 경로 정규화
      path = ('/' + path).replace(/\/+/g, '/').replace(/\/$/, '') || '/';

      // context.addInitializer를 사용하여 클래스 초기화 시 메타데이터 추가
      context.addInitializer(function (this: any) {
        addRouteMetadata(this.constructor, {
          path,
          method,
          middlewares,
          propertyKey: context.name
        });
      });
    };
  };
}

/**
 * GET 요청을 처리하는 라우트 데코레이터
 * 
 * @param pathOrOptions - 경로 또는 옵션 객체
 * @returns 메서드 데코레이터
 * 
 * @example
 * ```typescript
 * @Get('/users')
 * async getUsers() {
 *   // ...
 * }
 * 
 * @Get({ path: '/users/:id', middlewares: [validateId] })
 * async getUser() {
 *   // ...
 * }
 * ```
 */
export const Get = createRouteDecorator('GET');

/**
 * POST 요청을 처리하는 라우트 데코레이터
 */
export const Post = createRouteDecorator('POST');

/**
 * PUT 요청을 처리하는 라우트 데코레이터
 */
export const Put = createRouteDecorator('PUT');

/**
 * DELETE 요청을 처리하는 라우트 데코레이터
 */
export const Delete = createRouteDecorator('DELETE');

/**
 * PATCH 요청을 처리하는 라우트 데코레이터
 */
export const Patch = createRouteDecorator('PATCH');

/**
 * HEAD 요청을 처리하는 라우트 데코레이터
 */
export const Head = createRouteDecorator('HEAD');

/**
 * OPTIONS 요청을 처리하는 라우트 데코레이터
 */
export const Options = createRouteDecorator('OPTIONS');

/**
 * 모든 HTTP 메서드를 처리하는 라우트 데코레이터 - TypeScript 5 Modern Decorator
 */
export function All(pathOrOptions?: string | RouteOptions) {
  return function (
    target: any,
    context: ClassMethodDecoratorContext
  ): void {
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    
    let path = '';
    let middlewares: MiddlewareFunction[] = [];

    if (typeof pathOrOptions === 'string') {
      path = pathOrOptions;
    } else if (pathOrOptions) {
      path = pathOrOptions.path || '';
      middlewares = pathOrOptions.middlewares || [];
    }

    // 경로 정규화
    path = ('/' + path).replace(/\/+/g, '/').replace(/\/$/, '') || '/';

    // context.addInitializer를 사용하여 모든 메서드에 대해 라우트 메타데이터 추가
    context.addInitializer(function (this: any) {
      methods.forEach(method => {
        addRouteMetadata(this.constructor, {
          path,
          method,
          middlewares,
          propertyKey: context.name
        });
      });
    });
  };
}
