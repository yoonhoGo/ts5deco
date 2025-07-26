import { ControllerMetadata, RouteMetadata } from './types';

// Modern decorator용 메타데이터 저장소
const metadataStorage = new WeakMap<any, Map<string | symbol, any>>();

// 메타데이터 유틸리티 함수
function getMetadataMap(target: any): Map<string | symbol, any> {
  if (!metadataStorage.has(target)) {
    metadataStorage.set(target, new Map());
  }
  return metadataStorage.get(target)!;
}

function defineMetadata(key: string | symbol, value: any, target: any): void {
  const metadataMap = getMetadataMap(target);
  metadataMap.set(key, value);
}

function getMetadata<T = any>(key: string | symbol, target: any): T | undefined {
  const metadataMap = metadataStorage.get(target);
  return metadataMap?.get(key);
}

/**
 * 메타데이터 키 상수
 */
export const METADATA_KEYS = {
  CONTROLLER: Symbol('controller'),
  ROUTES: Symbol('routes'),
  PARAMETERS: Symbol('parameters'),
  MIDDLEWARES: Symbol('middlewares')
} as const;

/**
 * 컨트롤러 메타데이터를 설정합니다
 */
export function setControllerMetadata(target: any, metadata: ControllerMetadata): void {
  defineMetadata(METADATA_KEYS.CONTROLLER, metadata, target);
}

/**
 * 컨트롤러 메타데이터를 가져옵니다
 */
export function getControllerMetadata(target: any): ControllerMetadata | undefined {
  return getMetadata(METADATA_KEYS.CONTROLLER, target);
}

/**
 * 라우트 메타데이터를 설정합니다
 */
export function setRouteMetadata(target: any, metadata: RouteMetadata[]): void {
  defineMetadata(METADATA_KEYS.ROUTES, metadata, target);
}

/**
 * 라우트 메타데이터를 가져옵니다
 */
export function getRouteMetadata(target: any): RouteMetadata[] {
  return getMetadata(METADATA_KEYS.ROUTES, target) || [];
}

/**
 * 라우트 메타데이터를 추가합니다
 */
export function addRouteMetadata(target: any, metadata: RouteMetadata): void {
  const existingRoutes = getRouteMetadata(target);
  setRouteMetadata(target, [...existingRoutes, metadata]);
}

