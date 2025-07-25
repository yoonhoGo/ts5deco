// Web service architecture example

import { Container, Injectable, Inject, PostConstruct, PreDestroy, createMetadataKey } from '../src';

// Define tokens for type-safe injection
const CONFIG_TOKEN = createMetadataKey<AppConfig>('config');
const LOGGER_TOKEN = createMetadataKey<Logger>('logger');
const DATABASE_TOKEN = createMetadataKey<Database>('database');
const CACHE_TOKEN = createMetadataKey<Cache>('cache');

// Configuration interface
interface AppConfig {
  port: number;
  dbUrl: string;
  cacheUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Logger interface and implementation
interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

@Injectable()
class ConsoleLogger implements Logger {
  @Inject(CONFIG_TOKEN)
  private config!: AppConfig;

  debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${new Date().toISOString()} ${message}`);
    }
  }

  info(message: string): void {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${new Date().toISOString()} ${message}`);
    }
  }

  warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${new Date().toISOString()} ${message}`);
    }
  }

  error(message: string): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${new Date().toISOString()} ${message}`);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }
}

// Database interface and implementation
interface Database {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  insert(table: string, data: Record<string, any>): Promise<string>;
}

@Injectable()
class PostgresDatabase implements Database {
  @Inject(CONFIG_TOKEN)
  private config!: AppConfig;

  @Inject(LOGGER_TOKEN)
  private logger!: Logger;

  private connected = false;

  @PostConstruct
  async initialize() {
    await this.connect();
  }

  @PreDestroy
  async cleanup() {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    this.logger.info(`Connecting to database: ${this.config.dbUrl}`);
    // Simulate async connection
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    this.logger.info('Database connection established');
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      this.logger.info('Disconnecting from database');
      this.connected = false;
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    
    this.logger.debug(`Executing query: ${sql} with params: ${JSON.stringify(params)}`);
    
    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Mock result based on query
    if (sql.includes('SELECT * FROM users')) {
      return [{ id: '1', name: 'John Doe', email: 'john@example.com' }] as T[];
    }
    
    return [] as T[];
  }

  async insert(table: string, data: Record<string, any>): Promise<string> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    this.logger.debug(`Inserting into ${table}: ${JSON.stringify(data)}`);
    
    // Simulate insert
    await new Promise(resolve => setTimeout(resolve, 30));
    
    return id;
  }
}

// Cache interface and implementation
interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

@Injectable()
class RedisCache implements Cache {
  @Inject(CONFIG_TOKEN)
  private config!: AppConfig;

  @Inject(LOGGER_TOKEN)
  private logger!: Logger;

  private cache = new Map<string, { value: string; expires: number }>();

  @PostConstruct
  initialize() {
    this.logger.info(`Cache initialized with URL: ${this.config.cacheUrl}`);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.logger.debug(`Cache miss for key: ${key}`);
      return null;
    }
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired for key: ${key}`);
      return null;
    }
    
    this.logger.debug(`Cache hit for key: ${key}`);
    return entry.value;
  }

  async set(key: string, value: string, ttl: number = 300): Promise<void> {
    const expires = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expires });
    this.logger.debug(`Cache set for key: ${key} (TTL: ${ttl}s)`);
  }

  async delete(key: string): Promise<void> {
    const deleted = this.cache.delete(key);
    this.logger.debug(`Cache delete for key: ${key} (existed: ${deleted})`);
  }
}

// Business services
interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable()
class UserRepository {
  @Inject(DATABASE_TOKEN)
  private db!: Database;

  @Inject(LOGGER_TOKEN)
  private logger!: Logger;

  async findById(id: string): Promise<User | null> {
    this.logger.info(`Finding user by ID: ${id}`);
    const users = await this.db.query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return users[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.info(`Finding user by email: ${email}`);
    const users = await this.db.query<User>('SELECT * FROM users WHERE email = $1', [email]);
    return users[0] || null;
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    this.logger.info(`Creating user: ${userData.email}`);
    const id = await this.db.insert('users', userData);
    return { id, ...userData };
  }
}

@Injectable()
class UserService {
  @Inject(UserRepository)
  private userRepo!: UserRepository;

  @Inject(CACHE_TOKEN)
  private cache!: Cache;

  @Inject(LOGGER_TOKEN)
  private logger!: Logger;

  async getUser(id: string): Promise<User | null> {
    // Try cache first
    const cacheKey = `user:${id}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      this.logger.info(`Returning cached user: ${id}`);
      return JSON.parse(cached);
    }

    // Fetch from database
    const user = await this.userRepo.findById(id);
    
    if (user) {
      // Cache the result
      await this.cache.set(cacheKey, JSON.stringify(user), 300);
      this.logger.info(`User cached: ${id}`);
    }

    return user;
  }

  async createUser(userData: { name: string; email: string }): Promise<User> {
    // Check if user already exists
    const existing = await this.userRepo.findByEmail(userData.email);
    if (existing) {
      throw new Error(`User already exists: ${userData.email}`);
    }

    // Create new user
    const user = await this.userRepo.create(userData);
    
    // Cache the new user
    const cacheKey = `user:${user.id}`;
    await this.cache.set(cacheKey, JSON.stringify(user), 300);
    
    this.logger.info(`User created and cached: ${user.id}`);
    return user;
  }

  async invalidateUserCache(id: string): Promise<void> {
    await this.cache.delete(`user:${id}`);
    this.logger.info(`User cache invalidated: ${id}`);
  }
}

@Injectable()
class UserController {
  @Inject(UserService)
  private userService!: UserService;

  @Inject(LOGGER_TOKEN)
  private logger!: Logger;

  async handleGetUser(userId: string): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      this.logger.info(`GET /users/${userId}`);
      const user = await this.userService.getUser(userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      return { success: true, data: user };
    } catch (error) {
      this.logger.error(`Error getting user ${userId}: ${error}`);
      return { success: false, error: 'Internal server error' };
    }
  }

  async handleCreateUser(userData: { name: string; email: string }): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      this.logger.info(`POST /users - ${userData.email}`);
      const user = await this.userService.createUser(userData);
      return { success: true, data: user };
    } catch (error) {
      this.logger.error(`Error creating user: ${error}`);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Application setup
async function createWebServiceContainer(): Promise<Container> {
  const container = new Container();

  // Configuration
  const config: AppConfig = {
    port: 3000,
    dbUrl: 'postgresql://localhost:5432/myapp',
    cacheUrl: 'redis://localhost:6379',
    logLevel: 'info'
  };

  // Register configuration
  container.register({
    type: 'value',
    token: CONFIG_TOKEN,
    useValue: config
  });

  // Register infrastructure services
  container.bind(LOGGER_TOKEN).to(ConsoleLogger).inSingletonScope();
  container.bind(DATABASE_TOKEN).to(PostgresDatabase).inSingletonScope();
  container.bind(CACHE_TOKEN).to(RedisCache).inSingletonScope();

  // Register business services
  container.bind(UserRepository).toSelf().inSingletonScope();
  container.bind(UserService).toSelf().inSingletonScope();
  container.bind(UserController).toSelf().inSingletonScope();

  return container;
}

// Demo usage
async function runWebServiceDemo() {
  console.log('=== Web Service Architecture Demo ===\n');

  const container = await createWebServiceContainer();
  const userController = container.resolve(UserController);

  console.log('1. Creating a new user...');
  const createResult = await userController.handleCreateUser({
    name: 'Alice Smith',
    email: 'alice@example.com'
  });
  
  console.log('Create result:', JSON.stringify(createResult, null, 2));

  if (createResult.success && createResult.data) {
    console.log('\n2. Fetching the user (should hit database)...');
    const getResult1 = await userController.handleGetUser(createResult.data.id);
    console.log('Get result 1:', JSON.stringify(getResult1, null, 2));

    console.log('\n3. Fetching the same user again (should hit cache)...');
    const getResult2 = await userController.handleGetUser(createResult.data.id);
    console.log('Get result 2:', JSON.stringify(getResult2, null, 2));
  }

  console.log('\n4. Trying to fetch non-existent user...');
  const notFoundResult = await userController.handleGetUser('nonexistent');
  console.log('Not found result:', JSON.stringify(notFoundResult, null, 2));

  console.log('\n5. Trying to create duplicate user...');
  const duplicateResult = await userController.handleCreateUser({
    name: 'Alice Duplicate',
    email: 'alice@example.com'
  });
  console.log('Duplicate result:', JSON.stringify(duplicateResult, null, 2));

  // Cleanup
  console.log('\n6. Cleaning up...');
  await container.dispose();
  console.log('Container disposed - all services cleaned up');
}

// Run the demo
runWebServiceDemo().catch(console.error);