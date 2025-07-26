import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * HTTP 메서드 타입
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * 라우트 핸들러 함수 타입
 */
export type RouteHandler = (req: Request, res: Response, next: NextFunction) => any;

/**
 * 미들웨어 함수 타입
 */
export type MiddlewareFunction = RequestHandler;

/**
 * 컨트롤러 메타데이터
 */
export interface ControllerMetadata {
  path: string;
  middlewares: MiddlewareFunction[];
}

/**
 * 라우트 메타데이터
 */
export interface RouteMetadata {
  path: string;
  method: HttpMethod;
  middlewares: MiddlewareFunction[];
  propertyKey: string | symbol;
}


/**
 * 컨트롤러 생성자 타입
 */
export type ControllerConstructor = new (...args: any[]) => any;
