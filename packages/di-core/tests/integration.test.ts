// Integration tests for real-world scenarios

import {
  Container,
  Injectable,
  Inject,
  PostConstruct,
  PreDestroy,
  Singleton,
  ServiceScope,
  createMetadataKey
} from '../src';

describe('Real-world Integration Scenarios', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  afterEach(async () => {
    await container.dispose();
  });

  describe('Web Service Architecture', () => {
    it('should support typical web service dependencies', () => {
      // Define tokens
      const CONFIG_TOKEN = createMetadataKey<Config>('config');
      const LOGGER_TOKEN = createMetadataKey<Logger>('logger');
      const DATABASE_TOKEN = createMetadataKey<Database>('database');

      // Configuration service
      interface Config {
        port: number;
        dbUrl: string;
        logLevel: string;
      }

      const config: Config = {
        port: 3000,
        dbUrl: 'mongodb://localhost:27017/test',
        logLevel: 'info'
      };

      // Logger service
      interface Logger {
        info(message: string): void;
        error(message: string): void;
      }

      @Injectable()
      class ConsoleLogger implements Logger {
        @Inject(CONFIG_TOKEN)
        private config!: Config;

        info(message: string): void {
          if (this.config.logLevel === 'info') {
            console.log(`[INFO] ${message}`);
          }
        }

        error(message: string): void {
          console.error(`[ERROR] ${message}`);
        }
      }

      // Database service
      interface Database {
        connect(): void;
        query(sql: string): any[];
      }

      @Injectable()
      class MongoDatabase implements Database {
        @Inject(CONFIG_TOKEN)
        private config!: Config;

        @Inject(LOGGER_TOKEN)
        private logger!: Logger;

        private connected = false;

        @PostConstruct
        initialize() {
          this.connect();
        }

        connect(): void {
          this.logger.info(`Connecting to database: ${this.config.dbUrl}`);
          this.connected = true;
        }

        query(sql: string): any[] {
          if (!this.connected) {
            throw new Error('Database not connected');
          }
          this.logger.info(`Executing query: ${sql}`);
          return [];
        }

        @PreDestroy
        disconnect() {
          this.logger.info('Disconnecting from database');
          this.connected = false;
        }
      }

      // User service
      @Injectable()
      class UserService {
        @Inject(DATABASE_TOKEN)
        private db!: Database;

        @Inject(LOGGER_TOKEN)
        private logger!: Logger;

        async getUser(id: string) {
          this.logger.info(`Fetching user: ${id}`);
          return this.db.query(`SELECT * FROM users WHERE id = '${id}'`);
        }

        async createUser(userData: any) {
          this.logger.info(`Creating user: ${userData.email}`);
          return this.db.query(`INSERT INTO users ...`);
        }
      }

      // User controller
      @Injectable()
      class UserController {
        @Inject(UserService)
        private userService!: UserService;

        async handleGetUser(req: any) {
          return await this.userService.getUser(req.params.id);
        }

        async handleCreateUser(req: any) {
          return await this.userService.createUser(req.body);
        }
      }

      // Register services
      container.register({
        type: 'value',
        token: CONFIG_TOKEN,
        useValue: config
      });

      container.register({
        type: 'class',
        token: LOGGER_TOKEN,
        useClass: ConsoleLogger
      });

      container.register({
        type: 'class',
        token: DATABASE_TOKEN,
        useClass: MongoDatabase
      });

      container.register({
        type: 'class',
        token: UserService,
        useClass: UserService
      });

      container.register({
        type: 'class',
        token: UserController,
        useClass: UserController
      });

      // Test the complete integration
      const controller = container.resolve(UserController);
      expect(controller).toBeInstanceOf(UserController);
      expect(controller['userService']).toBeInstanceOf(UserService);
      expect(controller['userService']['db']).toBeInstanceOf(MongoDatabase);
      expect(controller['userService']['logger']).toBeInstanceOf(ConsoleLogger);
    });
  });

  describe('Plugin Architecture', () => {
    it('should support plugin-based architecture', () => {
      // Plugin interface
      interface Plugin {
        name: string;
        initialize(): void;
        execute(context: any): any;
      }

      // Core service
      @Injectable()
      class PluginManager {
        private plugins: Plugin[] = [];

        registerPlugin(plugin: Plugin) {
          this.plugins.push(plugin);
          plugin.initialize();
        }

        executePlugins(context: any) {
          return this.plugins.map(plugin => ({
            name: plugin.name,
            result: plugin.execute(context)
          }));
        }
      }

      // Plugins
      @Injectable()
      class AuthPlugin implements Plugin {
        name = 'auth';

        initialize() {
          console.log('Auth plugin initialized');
        }

        execute(context: any) {
          return { authenticated: true, user: context.user };
        }
      }

      @Injectable()
      class LoggingPlugin implements Plugin {
        name = 'logging';

        initialize() {
          console.log('Logging plugin initialized');
        }

        execute(context: any) {
          return { logged: true, timestamp: Date.now() };
        }
      }

      // Application service
      @Injectable()
      class Application {
        @Inject(PluginManager)
        private pluginManager!: PluginManager;

        @Inject(AuthPlugin)
        private authPlugin!: AuthPlugin;

        @Inject(LoggingPlugin)
        private loggingPlugin!: LoggingPlugin;

        @PostConstruct
        initializeApp() {
          this.pluginManager.registerPlugin(this.authPlugin);
          this.pluginManager.registerPlugin(this.loggingPlugin);
        }

        processRequest(request: any) {
          const context = { user: request.user, path: request.path };
          return this.pluginManager.executePlugins(context);
        }
      }

      // Register services
      container.register({
        type: 'class',
        token: PluginManager,
        useClass: PluginManager
      });

      container.register({
        type: 'class',
        token: AuthPlugin,
        useClass: AuthPlugin
      });

      container.register({
        type: 'class',
        token: LoggingPlugin,
        useClass: LoggingPlugin
      });

      container.register({
        type: 'class',
        token: Application,
        useClass: Application
      });

      // Test the plugin architecture
      const app = container.resolve(Application);
      const results = app.processRequest({ user: { id: 1 }, path: '/api/test' });

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('auth');
      expect(results[1].name).toBe('logging');
      expect(results[0].result.authenticated).toBe(true);
      expect(results[1].result.logged).toBe(true);
    });
  });

  describe('Microservice Communication', () => {
    it('should support microservice-style dependency injection', async () => {
      // Service interfaces
      interface HttpClient {
        get(url: string): Promise<any>;
        post(url: string, data: any): Promise<any>;
      }

      interface ConfigService {
        get(key: string): string;
      }

      interface EventBus {
        emit(event: string, data: any): void;
        on(event: string, handler: Function): void;
      }

      // Token definitions
      const HTTP_CLIENT = createMetadataKey<HttpClient>('http.client');
      const CONFIG_SERVICE = createMetadataKey<ConfigService>('config.service');
      const EVENT_BUS = createMetadataKey<EventBus>('event.bus');

      // Implementations
      @Injectable()
      class FetchHttpClient implements HttpClient {
        async get(url: string) {
          return { data: `GET ${url}`, status: 200 };
        }

        async post(url: string, data: any) {
          return { data: `POST ${url}`, body: data, status: 201 };
        }
      }

      @Injectable()
      class EnvConfigService implements ConfigService {
        private config = {
          'api.base.url': 'https://api.example.com',
          'service.name': 'user-service',
          'cache.ttl': '300'
        };

        get(key: string): string {
          return this.config[key as keyof typeof this.config] || '';
        }
      }

      @Injectable()
      class SimpleEventBus implements EventBus {
        private handlers = new Map<string, Function[]>();

        emit(event: string, data: any): void {
          const eventHandlers = this.handlers.get(event) || [];
          eventHandlers.forEach(handler => handler(data));
        }

        on(event: string, handler: Function): void {
          const handlers = this.handlers.get(event) || [];
          handlers.push(handler);
          this.handlers.set(event, handlers);
        }
      }

      // Business services
      @Injectable()
      class UserApiService {
        @Inject(HTTP_CLIENT)
        private http!: HttpClient;

        @Inject(CONFIG_SERVICE)
        private config!: ConfigService;

        @Inject(EVENT_BUS)
        private eventBus!: EventBus;

        async getUser(id: string) {
          const baseUrl = this.config.get('api.base.url');
          const result = await this.http.get(`${baseUrl}/users/${id}`);
          
          this.eventBus.emit('user.fetched', { id, result });
          return result;
        }

        async createUser(userData: any) {
          const baseUrl = this.config.get('api.base.url');
          const result = await this.http.post(`${baseUrl}/users`, userData);
          
          this.eventBus.emit('user.created', { userData, result });
          return result;
        }
      }

      @Injectable()
      class NotificationService {
        @Inject(EVENT_BUS)
        private eventBus!: EventBus;

        @PostConstruct
        initialize() {
          this.eventBus.on('user.created', (data) => {
            console.log('Sending welcome email to:', data.userData.email);
          });

          this.eventBus.on('user.fetched', (data) => {
            console.log('User accessed:', data.id);
          });
        }
      }

      // Register all services
      container.register({
        type: 'class',
        token: HTTP_CLIENT,
        useClass: FetchHttpClient
      });

      container.register({
        type: 'class',
        token: CONFIG_SERVICE,
        useClass: EnvConfigService
      });

      container.register({
        type: 'class',
        token: EVENT_BUS,
        useClass: SimpleEventBus
      });

      container.register({
        type: 'class',
        token: UserApiService,
        useClass: UserApiService
      });

      container.register({
        type: 'class',
        token: NotificationService,
        useClass: NotificationService
      });

      // Test the microservice communication
      const userApi = container.resolve(UserApiService);
      const notifications = container.resolve(NotificationService);

      expect(userApi).toBeInstanceOf(UserApiService);
      expect(notifications).toBeInstanceOf(NotificationService);

      // Test API calls (would trigger events)
      const user = await userApi.getUser('123');
      expect(user.data).toBe('GET https://api.example.com/users/123');

      const newUser = await userApi.createUser({ email: 'test@example.com' });
      expect(newUser.status).toBe(201);
    });
  });
});

describe('Performance and Scalability', () => {
  it('should handle large dependency graphs efficiently', async () => {
    const container = new Container();

    // Create a large dependency graph
    const services = [];
    for (let i = 0; i < 50; i++) {
      const ServiceClass = class {
        static serviceName = `Service${i}`;
      };
      
      Object.defineProperty(ServiceClass, 'name', { value: `Service${i}` });
      
      container.register({
        type: 'class',
        token: `Service${i}`,
        useClass: ServiceClass
      });
      
      services.push(`Service${i}`);
    }

    // Measure resolution time
    const start = Date.now();
    
    // Resolve all services
    const instances = services.map(token => container.resolve(token));
    
    const end = Date.now();
    const resolutionTime = end - start;

    expect(instances).toHaveLength(50);
    expect(resolutionTime).toBeLessThan(100); // Should resolve in less than 100ms
    
    await container.dispose();
  });

  it('should handle concurrent resolution requests', async () => {
    const container = new Container();

    @Injectable()
    class ConcurrentService {
      @PostConstruct
      async initialize() {
        // Simulate async initialization
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    container.register({
      type: 'class',
      token: ConcurrentService,
      useClass: ConcurrentService
    });

    // Resolve the same service concurrently
    const promises = Array.from({ length: 10 }, () => 
      container.resolve(ConcurrentService)
    );

    const instances = await Promise.all(promises);

    // All instances should be the same (singleton)
    instances.forEach(instance => {
      expect(instance).toBe(instances[0]);
      expect(instance).toBeInstanceOf(ConcurrentService);
    });

    await container.dispose();
  });
});