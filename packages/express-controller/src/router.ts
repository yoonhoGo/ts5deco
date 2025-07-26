import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { ControllerConstructor } from './types';
import { getControllerMetadata, getRouteMetadata } from './metadata';
import { BaseResponse } from './responses/BaseResponse';

/**
 * 컨트롤러에서 Express Router를 생성합니다
 * 
 * @param controllers - 등록할 컨트롤러 클래스들
 * @returns Express Router 인스턴스
 * 
 * @example
 * ```typescript
 * import { createRouter } from 'ts5deco-express-controller';
 * import { UserController, PostController } from './controllers';
 * 
 * const router = createRouter([UserController, PostController]);
 * app.use('/api', router);
 * ```
 */
export function createRouter(controllers: ControllerConstructor[]): Router {
  const router = Router();

  controllers.forEach(ControllerClass => {
    registerController(router, ControllerClass);
  });

  return router;
}

/**
 * 단일 컨트롤러를 라우터에 등록합니다
 * 
 * @param router - Express Router 인스턴스
 * @param ControllerClass - 등록할 컨트롤러 클래스
 * 
 * @example
 * ```typescript
 * import { registerController } from 'ts5deco-express-controller';
 * import { UserController } from './controllers/user.controller';
 * 
 * const router = Router();
 * registerController(router, UserController);
 * app.use('/api', router);
 * ```
 */
export function registerController(router: Router, ControllerClass: ControllerConstructor): void {
  const controllerMetadata = getControllerMetadata(ControllerClass);
  const routeMetadata = getRouteMetadata(ControllerClass);

  if (!controllerMetadata) {
    console.warn(`Controller ${ControllerClass.name} does not have @Controller decorator`);
    return;
  }

  // 컨트롤러 인스턴스 생성
  const controllerInstance = new ControllerClass();

  // 각 라우트에 대해 등록
  routeMetadata.forEach(route => {
    const fullPath = combinePaths(controllerMetadata.path, route.path);
    const method = route.method.toLowerCase() as keyof Router;
    
    // 메서드 핸들러 생성
    const handler = createMethodHandler(controllerInstance, route.propertyKey);
    
    // 미들웨어 배열 생성 (컨트롤러 미들웨어 + 라우트 미들웨어 + 핸들러)
    const middlewares = [
      ...controllerMetadata.middlewares,
      ...route.middlewares,
      handler
    ];

    // 라우터에 등록
    if (typeof router[method] === 'function') {
      (router[method] as any)(fullPath, ...middlewares);
    }
  });
}

/**
 * 메서드 핸들러를 생성합니다 - Request, Response, NextFunction을 직접 전달
 */
function createMethodHandler(controllerInstance: any, propertyKey: string | symbol) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 메서드 실행 - req, res, next를 직접 전달
      const result = await controllerInstance[propertyKey](req, res, next);

      // 응답이 이미 전송되었다면 아무것도 하지 않음
      if (res.headersSent) {
        return;
      }

      // BaseResponse 인스턴스인 경우 send 메서드 호출
      if (result instanceof BaseResponse) {
        result.send(res);
        return;
      }

      // 결과가 있다면 JSON으로 응답 (기존 방식 유지)
      if (result !== undefined) {
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 경로를 결합합니다
 */
function combinePaths(basePath: string, routePath: string): string {
  const combined = `${basePath}${routePath}`.replace(/\/+/g, '/');
  return combined === '/' ? '/' : combined.replace(/\/$/, '');
}

/**
 * Express 앱에 컨트롤러들을 등록하는 헬퍼 함수
 * 
 * @param app - Express 앱 인스턴스
 * @param controllers - 등록할 컨트롤러 클래스들
 * @param basePath - 기본 경로 (기본값: '')
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { registerControllers } from 'ts5deco-express-controller';
 * import { UserController, PostController } from './controllers';
 * 
 * const app = express();
 * registerControllers(app, [UserController, PostController], '/api');
 * ```
 */
export function registerControllers(
  app: any, 
  controllers: ControllerConstructor[], 
  basePath: string = ''
): void {
  const router = createRouter(controllers);
  app.use(basePath, router);
}
