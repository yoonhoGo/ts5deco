// Advanced features demonstration

import { 
  Container, 
  Injectable, 
  Inject, 
  PostConstruct, 
  PreDestroy,
  ServiceScope,
  createMetadataKey,
  ContainerFactory
} from '../src';

// Example 1: Child Containers and Scoped Services
console.log('=== Example 1: Child Containers ===');

interface AuthService {
  getCurrentUser(): { id: string; role: string } | null;
  isAuthenticated(): boolean;
}

@Injectable()  
class GlobalAuthService implements AuthService {
  private currentUser: { id: string; role: string } | null = null;

  constructor() {
    console.log('GlobalAuthService created');
  }

  login(user: { id: string; role: string }) {
    this.currentUser = user;
    console.log(`User logged in: ${user.id} (${user.role})`);
  }

  logout() {
    console.log(`User logged out: ${this.currentUser?.id}`);
    this.currentUser = null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

@Injectable()
class RequestScopedAuthService implements AuthService {
  @Inject(GlobalAuthService)
  private globalAuth!: GlobalAuthService;

  private requestUser: { id: string; role: string } | null = null;

  constructor() {
    console.log('RequestScopedAuthService created');
  }

  setRequestUser(user: { id: string; role: string }) {
    this.requestUser = user;
  }

  getCurrentUser() {
    return this.requestUser || this.globalAuth.getCurrentUser();
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

// Setup parent container
const parentContainer = new Container();
parentContainer.bind(GlobalAuthService).toSelf().inSingletonScope();

// Create child container for request scope
const requestContainer = parentContainer.createChild();
requestContainer.bind(AuthService).to(RequestScopedAuthService).inPrototypeScope();

// Demo child container behavior
const globalAuth = parentContainer.resolve(GlobalAuthService);
globalAuth.login({ id: 'user1', role: 'admin' });

const requestAuth1 = requestContainer.resolve(AuthService);
console.log('Request 1 user:', requestAuth1.getCurrentUser());

// Simulate different request with overridden user
const requestAuth2 = requestContainer.resolve(AuthService) as RequestScopedAuthService;
requestAuth2.setRequestUser({ id: 'user2', role: 'user' });
console.log('Request 2 user:', requestAuth2.getCurrentUser());

console.log('');

// Example 2: Factory Providers with Complex Dependencies
console.log('=== Example 2: Factory Providers ===');

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  ssl: boolean;
}

interface ConnectionPool {
  getConnection(): Connection;
  close(): Promise<void>;
}

interface Connection {
  query(sql: string): Promise<any>;
  close(): Promise<void>;
}

class MockConnection implements Connection {
  constructor(private config: DatabaseConfig) {}

  async query(sql: string): Promise<any> {
    console.log(`Executing on ${this.config.host}:${this.config.port}/${this.config.database}: ${sql}`);
    return { rows: [], rowCount: 0 };
  }

  async close(): Promise<void> {
    console.log('Connection closed');
  }
}

class MockConnectionPool implements ConnectionPool {
  private connections: Connection[] = [];

  constructor(private config: DatabaseConfig, private maxConnections: number = 10) {
    console.log(`ConnectionPool created with ${maxConnections} max connections`);
  }

  getConnection(): Connection {
    if (this.connections.length === 0) {
      return new MockConnection(this.config);
    }
    return this.connections.pop()!;
  }

  async close(): Promise<void> {
    console.log('Closing connection pool...');
    await Promise.all(this.connections.map(conn => conn.close()));
    this.connections = [];
  }
}

const DB_CONFIG = createMetadataKey<DatabaseConfig>('db.config');
const CONNECTION_POOL = createMetadataKey<ConnectionPool>('connection.pool');
const MAX_CONNECTIONS = createMetadataKey<number>('max.connections');

const factoryContainer = new Container();

// Register configuration
factoryContainer.register({
  type: 'value',
  token: DB_CONFIG,
  useValue: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    ssl: false
  }
});

factoryContainer.register({
  type: 'value',
  token: MAX_CONNECTIONS,
  useValue: 20
});

// Factory provider with multiple dependencies
factoryContainer.register({
  type: 'factory',
  token: CONNECTION_POOL,
  useFactory: (config: DatabaseConfig, maxConnections: number) => {
    return new MockConnectionPool(config, maxConnections);
  },
  deps: [DB_CONFIG, MAX_CONNECTIONS],
  scope: ServiceScope.SINGLETON
});

const pool = factoryContainer.resolve(CONNECTION_POOL);
const connection = pool.getConnection();
await connection.query('SELECT * FROM users');

console.log('');

// Example 3: Container Factory Patterns
console.log('=== Example 3: Container Factory Patterns ===');

// Different container configurations for different environments
const devContainer = ContainerFactory.createTestContainer();
const prodContainer = ContainerFactory.createStrictContainer();
const perfContainer = ContainerFactory.createHighPerformanceContainer();

@Injectable()
class ConfigurableService {
  constructor() {
    console.log('ConfigurableService created');
  }

  getEnvironment(): string {
    return 'configured';
  }
}

// Register same service in different containers
devContainer.bind(ConfigurableService).toSelf();
prodContainer.bind(ConfigurableService).toSelf();
perfContainer.bind(ConfigurableService).toSelf();

console.log('Dev container service:', devContainer.resolve(ConfigurableService).getEnvironment());
console.log('Prod container service:', prodContainer.resolve(ConfigurableService).getEnvironment());
console.log('Perf container service:', perfContainer.resolve(ConfigurableService).getEnvironment());

console.log('');

// Example 4: Lifecycle Management with Complex Scenarios
console.log('=== Example 4: Complex Lifecycle Management ===');

@Injectable()
class DatabaseConnection {
  private connected = false;
  private transactions: string[] = [];

  @PostConstruct
  async connect() {
    console.log('Connecting to database...');
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    console.log('Database connected');
  }

  async beginTransaction(): Promise<string> {
    if (!this.connected) throw new Error('Not connected');
    const txId = `tx_${Date.now()}`;
    this.transactions.push(txId);
    console.log(`Transaction started: ${txId}`);
    return txId;
  }

  async commitTransaction(txId: string) {
    const index = this.transactions.indexOf(txId);
    if (index > -1) {
      this.transactions.splice(index, 1);
      console.log(`Transaction committed: ${txId}`);
    }
  }

  @PreDestroy
  async cleanup() {
    console.log('Cleaning up database connection...');
    
    // Rollback any pending transactions
    for (const txId of this.transactions) {
      console.log(`Rolling back transaction: ${txId}`);
    }
    this.transactions = [];
    
    if (this.connected) {
      console.log('Disconnecting from database...');
      this.connected = false;
    }
    
    console.log('Database cleanup complete');
  }
}

@Injectable()
class TransactionManager {
  @Inject(DatabaseConnection)
  private db!: DatabaseConnection;

  private activeTx: string | null = null;

  async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    const txId = await this.db.beginTransaction();
    this.activeTx = txId;
    
    try {
      const result = await operation();
      await this.db.commitTransaction(txId);
      return result;
    } catch (error) {
      console.log(`Transaction failed, rolling back: ${txId}`);
      throw error;
    } finally {
      this.activeTx = null;
    }
  }

  @PreDestroy
  cleanup() {
    if (this.activeTx) {
      console.log(`TransactionManager: Cleaning up active transaction: ${this.activeTx}`);
    }
  }
}

const lifecycleContainer = new Container();
lifecycleContainer.bind(DatabaseConnection).toSelf().inSingletonScope();
lifecycleContainer.bind(TransactionManager).toSelf().inSingletonScope();

// Use the transaction manager
const txManager = lifecycleContainer.resolve(TransactionManager);

await txManager.withTransaction(async () => {
  console.log('Performing database operation...');
  await new Promise(resolve => setTimeout(resolve, 50));
  console.log('Operation completed');
});

// Cleanup all containers
console.log('\n=== Cleanup ===');
await parentContainer.dispose();
await requestContainer.dispose();
await factoryContainer.dispose();
await devContainer.dispose();
await prodContainer.dispose();
await perfContainer.dispose();
await lifecycleContainer.dispose();

console.log('All containers disposed');

// Example 5: Error Handling and Recovery
console.log('\n=== Example 5: Error Handling ===');

@Injectable()
class FlakyService {
  private attempts = 0;

  @PostConstruct
  initialize() {
    this.attempts++;
    if (this.attempts < 2) {
      throw new Error(`Initialization failed (attempt ${this.attempts})`);
    }
    console.log('FlakyService initialized successfully');
  }

  doWork(): string {
    return 'work completed';
  }
}

@Injectable()  
class ReliableService {
  constructor() {
    console.log('ReliableService created');
  }

  doWork(): string {
    return 'reliable work';
  }
}

const errorContainer = new Container({
  throwOnMissingDependencies: false // Allow graceful degradation
});

errorContainer.bind(FlakyService).toSelf();
errorContainer.bind(ReliableService).toSelf();

// Try to resolve the flaky service
try {
  const flakyService = errorContainer.resolve(FlakyService);
  console.log('Flaky result:', flakyService.doWork());
} catch (error) {
  console.log('Failed to resolve FlakyService:', (error as Error).message);
  
  // Fallback to reliable service
  const reliableService = errorContainer.resolve(ReliableService);
  console.log('Fallback result:', reliableService.doWork());
}

// Try resolving non-existent service (should return undefined due to container config)
const nonExistent = errorContainer.tryResolve('non-existent-service');
console.log('Non-existent service result:', nonExistent);

// Cleanup
await errorContainer.dispose();
console.log('Error handling demo completed');