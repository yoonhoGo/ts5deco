import { MiddlewareFunction } from '../types';
import { addRouteMetadata, getRouteMetadata, setRouteMetadata, METADATA_KEYS } from '../metadata';

/**
 * 미들웨어를 적용하는 데코레이터 - TypeScript 5 Modern Decorator
 * 
 * @param middlewares - 적용할 미들웨어 함수들
 * @returns 메서드 데코레이터
 * 
 * @example
 * ```typescript
 * @Use(authMiddleware, loggingMiddleware)
 * @Get('/protected')
 * async getProtectedData() {
 *   // ...
 * }
 * ```
 */
export function Use(...middlewares: MiddlewareFunction[]) {
  return function (
    target: any,
    context: ClassMethodDecoratorContext
  ): void {
    // context.addInitializer를 사용하여 미들웨어 설정
    context.addInitializer(function (this: any) {
      const routes = getRouteMetadata(this.constructor);
      const updatedRoutes = routes.map(route => {
        if (route.propertyKey === context.name) {
          return {
            ...route,
            middlewares: [...middlewares, ...route.middlewares]
          };
        }
        return route;
      });

      // 업데이트된 라우트 메타데이터 설정
      if (updatedRoutes.length > 0) {
        setRouteMetadata(this.constructor, updatedRoutes);
      }
    });
  };
}

/**
 * 인증이 필요한 라우트임을 나타내는 데코레이터
 * 실제 인증 미들웨어는 사용자가 제공해야 함
 * 
 * @param authMiddleware - 인증 미들웨어 함수
 * @returns 메서드 데코레이터
 * 
 * @example
 * ```typescript
 * @Authenticated(jwtAuthMiddleware)
 * @Get('/profile')
 * async getProfile() {
 *   // ...
 * }
 * ```
 */
export function Authenticated(authMiddleware: MiddlewareFunction) {
  return Use(authMiddleware);
}

/**
 * 권한 확인이 필요한 라우트임을 나타내는 데코레이터
 * 
 * @param authorizeMiddleware - 권한 확인 미들웨어 함수
 * @returns 메서드 데코레이터
 * 
 * @example
 * ```typescript
 * @Authorized(adminOnlyMiddleware)
 * @Delete('/admin/users/:id')
 * async deleteUser() {
 *   // ...
 * }
 * ```
 */
export function Authorized(authorizeMiddleware: MiddlewareFunction) {
  return Use(authorizeMiddleware);
}

/**
 * 요청 검증이 필요한 라우트임을 나타내는 데코레이터
 * 
 * @param validationMiddleware - 검증 미들웨어 함수
 * @returns 메서드 데코레이터
 * 
 * @example
 * ```typescript
 * @Validated(validateUserSchema)
 * @Post('/users')
 * async createUser() {
 *   // ...
 * }
 * ```
 */
export function Validated(validationMiddleware: MiddlewareFunction) {
  return Use(validationMiddleware);
}
