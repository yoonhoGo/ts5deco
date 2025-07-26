# ts5deco-inject

TypeScript 5의 최신 Modern Decorator API (TC39 Stage 3)를 사용하여 구축된 현대적인 의존성 주입 프레임워크입니다.

## 특징

- 🚀 **Modern Decorators**: TypeScript 5의 Modern Decorator API 사용 (실험적 decorator 아님)
- 🔄 **다중 스코프**: Singleton, Prototype, Transient 서비스 스코프
- 🎯 **타입 안전성**: 포괄적인 타입 정의로 완전한 TypeScript 지원
- 🏗️ **Fluent API**: 서비스 등록을 위한 직관적인 fluent 바인딩 API
- 🔍 **순환 의존성 감지**: 자동 순환 의존성 감지 및 오류 보고
- 🧬 **생명주기 훅**: @PostConstruct 및 @PreDestroy 생명주기 관리
- 📦 **듀얼 모듈 지원**: CommonJS 및 ESM 모듈 형식 모두 지원
- 🌊 **Tree-shakable**: 현대적인 번들러에 최적화
- 🧪 **완전한 테스트**: 88%+ 커버리지의 포괄적인 테스트 스위트

## 설치

```bash
npm install ts5deco-inject
```

## 빠른 시작

```typescript
import { Container, Injectable, Inject, createMetadataKey } from 'ts5deco-inject';

// 타입 안전한 주입을 위한 메타데이터 키 정의
const DATABASE_URL = createMetadataKey<string>('database.url');

@Injectable()
class DatabaseService {
  @Inject(DATABASE_URL)
  private url!: string;

  connect() {
    console.log(`${this.url}에 연결 중`);
  }
}

@Injectable() 
class UserService {
  @Inject(DatabaseService)
  private db!: DatabaseService;

  getUser(id: string) {
    this.db.connect();
    return { id, name: '홍길동' };
  }
}

// 컨테이너 생성 및 서비스 등록
const container = new Container();

container.register({
  type: 'value',
  token: DATABASE_URL,
  useValue: 'postgresql://localhost:5432/mydb'
});

container.register({
  type: 'class',
  token: DatabaseService,
  useClass: DatabaseService
});

container.register({
  type: 'class',
  token: UserService,
  useClass: UserService
});

// 서비스 해결 및 사용
const userService = container.resolve(UserService);
const user = userService.getUser('123');
console.log(user); // { id: '123', name: '홍길동' }
```

## 핵심 데코레이터

### @Injectable

클래스를 주입 가능하도록 표시하고 스코프를 지정합니다:

```typescript
@Injectable('singleton') // 기본 스코프
class ApiService {}

@Injectable('prototype') // 매번 새 인스턴스
class RequestHandler {}

@Injectable('transient') // 항상 새 인스턴스 생성
class TemporaryService {}
```

### @Inject

프로퍼티에 의존성을 주입합니다:

```typescript
@Injectable()
class OrderService {
  @Inject(PaymentService)
  private paymentService!: PaymentService;

  @Inject(LOGGER_TOKEN)
  private logger!: Logger;
}
```

### @PostConstruct

의존성 주입 후 호출되는 초기화 메서드를 정의합니다:

```typescript
@Injectable()
class DatabaseConnection {
  @PostConstruct
  async initialize() {
    await this.connect();
    console.log('데이터베이스가 연결되었습니다');
  }
}
```

### @PreDestroy

컨테이너가 해제될 때 호출되는 정리 메서드를 정의합니다:

```typescript
@Injectable()
class FileUploadService {
  @PreDestroy
  cleanup() {
    this.clearTempFiles();
    console.log('정리가 완료되었습니다');
  }
}
```

## 서비스 등록

### 클래스 프로바이더

```typescript
container.register({
  type: 'class',
  token: UserService,
  useClass: UserService,
  scope: ServiceScope.SINGLETON
});
```

### 값 프로바이더

```typescript
container.register({
  type: 'value',
  token: 'API_KEY',
  useValue: 'your-api-key-here'
});
```

### 팩토리 프로바이더

```typescript
container.register({
  type: 'factory',
  token: 'HTTP_CLIENT',
  useFactory: (config: Config) => new HttpClient(config.baseUrl),
  deps: [CONFIG_TOKEN],
  scope: ServiceScope.SINGLETON
});
```

### 기존 프로바이더 (별칭)

```typescript
container.register({
  type: 'existing', 
  token: 'USER_REPOSITORY',
  useExisting: UserService
});
```

## Fluent 바인딩 API

가독성 높은 서비스 등록을 위해:

```typescript
// 구현체에 바인딩
container.bind(UserService).to(UserServiceImpl).inSingletonScope();

// 값에 바인딩
container.bind('API_URL').toValue('https://api.example.com');

// 팩토리로 바인딩
container.bind('HTTP_CLIENT')
  .toFactory((config: Config) => new HttpClient(config))
  .withDependencies(CONFIG_TOKEN)
  .inSingletonScope();

// 기존 서비스에 바인딩
container.bind('USER_REPO').toExisting(UserService);

// 자기 자신에 바인딩 (토큰이 생성자인 경우)
container.bind(UserService).toSelf().inPrototypeScope();
```

## 서비스 스코프

### 싱글톤 (기본값)
- 컨테이너당 하나의 인스턴스
- 인스턴스가 캐시되고 재사용됨

```typescript
container.register({
  type: 'class',
  token: DatabaseService,
  useClass: DatabaseService,
  scope: ServiceScope.SINGLETON
});
```

### 프로토타입
- 해결할 때마다 새 인스턴스
- 의존성이 매번 해결됨

```typescript
container.register({
  type: 'class',
  token: RequestHandler,
  useClass: RequestHandler,
  scope: ServiceScope.PROTOTYPE
});
```

### 일시적(Transient)
- 항상 새 인스턴스 생성
- 프로토타입과 유사하지만 의미론적으로 다름

```typescript
container.register({
  type: 'class',
  token: TempService,
  useClass: TempService,
  scope: ServiceScope.TRANSIENT
});
```

## 자식 컨테이너

상속을 통해 격리된 스코프를 생성합니다:

```typescript
const parentContainer = new Container();
const childContainer = parentContainer.createChild();

// 자식은 부모 서비스에 접근 가능
// 자식 서비스가 부모 서비스를 재정의
```

## 컨테이너 옵션

```typescript
const container = new Container({
  defaultScope: ServiceScope.SINGLETON,
  autoBindInjectable: true,
  throwOnMissingDependencies: true,
  enableCaching: true,
  maxCacheSize: 1000
});
```

## 생명주기 관리

```typescript
@Injectable()
class ServiceWithLifecycle {
  @PostConstruct
  async initialize() {
    // 모든 의존성이 주입된 후 호출
    await this.setupConnections();
  }

  @PreDestroy
  async cleanup() {
    // 컨테이너가 해제될 때 호출
    await this.closeConnections();
  }
}

// 리소스 정리
await container.dispose();
```

## 오류 처리

프레임워크는 특정 오류 타입을 제공합니다:

```typescript
import { 
  ServiceNotFoundError,
  CircularDependencyError,
  InvalidProviderError 
} from 'ts5deco-inject';

try {
  const service = container.resolve('unknown-service');
} catch (error) {
  if (error instanceof ServiceNotFoundError) {
    console.log('서비스가 등록되지 않았습니다');
  }
}
```

## 실제 사용 예제

```typescript
import { Container, Injectable, Inject, createMetadataKey, PostConstruct } from 'ts5deco-inject';

// 토큰
const CONFIG = createMetadataKey<AppConfig>('config');
const LOGGER = createMetadataKey<Logger>('logger');
const DATABASE = createMetadataKey<Database>('database');

// 설정
interface AppConfig {
  port: number;
  dbUrl: string;
  logLevel: string;
}

// 로거 서비스
interface Logger {
  info(message: string): void;
  error(message: string): void;
}

@Injectable()
class ConsoleLogger implements Logger {
  @Inject(CONFIG)
  private config!: AppConfig;

  info(message: string) {
    if (this.config.logLevel === 'info') {
      console.log(`[정보] ${message}`);
    }
  }

  error(message: string) {
    console.error(`[오류] ${message}`);
  }
}

// 데이터베이스 서비스
interface Database {
  connect(): Promise<void>;
  query(sql: string): Promise<any[]>;
}

@Injectable()
class PostgresDatabase implements Database {
  @Inject(CONFIG)
  private config!: AppConfig;

  @Inject(LOGGER)
  private logger!: Logger;

  @PostConstruct
  async initialize() {
    await this.connect();
  }

  async connect() {
    this.logger.info(`${this.config.dbUrl}에 연결 중`);
    // 연결 로직
  }

  async query(sql: string) {
    this.logger.info(`실행 중: ${sql}`);
    // 쿼리 로직
    return [];
  }
}

// 비즈니스 서비스
@Injectable()
class UserService {
  @Inject(DATABASE)
  private db!: Database;

  @Inject(LOGGER)
  private logger!: Logger;

  async getUser(id: string) {
    this.logger.info(`사용자 ${id} 조회 중`);
    return await this.db.query(`SELECT * FROM users WHERE id = $1`);
  }

  async createUser(userData: any) {
    this.logger.info(`사용자 ${userData.email} 생성 중`);
    return await this.db.query(`INSERT INTO users ...`);
  }
}

// 컨테이너 설정
const container = new Container();

const config: AppConfig = {
  port: 3000,
  dbUrl: 'postgresql://localhost:5432/myapp',
  logLevel: 'info'
};

container.register({
  type: 'value',
  token: CONFIG,
  useValue: config
});

container.bind(LOGGER).to(ConsoleLogger).inSingletonScope();
container.bind(DATABASE).to(PostgresDatabase).inSingletonScope();
container.bind(UserService).toSelf().inSingletonScope();

// 애플리케이션 사용
const userService = container.resolve(UserService);
const user = await userService.getUser('123');

// 완료 시 정리
await container.dispose();
```

## TypeScript 설정

`tsconfig.json`에 다음을 포함해야 합니다:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    "useDefineForClassFields": false
  }
}
```

## API 문서

완전한 API 문서는 생성된 [TypeDoc 문서](./docs/)를 참조하세요.

## 기여하기

기여를 환영합니다! Pull Request를 자유롭게 제출해 주세요.

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

## 지원

질문이나 문제가 있으시면 [GitHub](https://github.com/yoonhoGo/ts5deco/issues)에서 이슈를 열어주세요.