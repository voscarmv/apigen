# apigen

A simple, flexible Express backend generator with Drizzle ORM integration.

## Installation

```bash
npm install @voscarmv/apigen
```

## Basic demo

See a working demo [here.](https://github.com/voscarmv/backendapi)

## Basic Usage

```typescript
import { DynamicStoreBackend } from '@voscarmv/apigen';
import { users } from './schema.js'; // Your Drizzle schema
import { eq } from 'drizzle-orm';

// Create backend instance
const backend = new DynamicStoreBackend({
    dbUrl: process.env.DATABASE_URL!,
    port: 3000
});

// Add a public route
backend.route('get', '/users', async (db, req, res) => {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
});

// Add a route with auth
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

backend.route('post', '/users', async (db, req, res) => {
    const newUser = await db.insert(users).values(req.body).returning();
    res.json(newUser[0]);
}, requireAuth);

// Start server
backend.listen();
console.log('Server running on port 3000');
```

## API

### `new DynamicStoreBackend(params)`

Creates a new backend instance.

**Parameters:**
- `dbUrl` (string): PostgreSQL connection string
- `port` (number): Port to run server on
- `corsOpts` (optional): CORS configuration
- `migrationsFolder` (optional): Path to migrations folder

### `backend.route(method, path, handler, authMiddleware?)`

Adds a new route to the server.

**Parameters:**
- `method`: HTTP method (`'get' | 'post' | 'put' | 'delete' | 'patch'`)
- `path`: Route path (e.g., `/users/:id`)
- `handler`: Request handler `(db, req, res) => void`
- `authMiddleware` (optional): Auth middleware `(req, res, next) => void`

### `backend.migrate()`

Runs database migrations.

### `backend.listen()`

Starts the Express server.

## Complete Example

```typescript
import { DynamicStoreBackend } from '@voscarmv/apigen';
import { tasks } from './schema.js';
import { eq } from 'drizzle-orm';

const backend = new DynamicStoreBackend({
    dbUrl: process.env.DATABASE_URL!,
    port: 3000
});

// Get all tasks
backend.route('get', '/tasks', async (db, req, res) => {
    const allTasks = await db.select().from(tasks);
    res.json(allTasks);
});

// Get task by ID
backend.route('get', '/tasks/:id', async (db, req, res) => {
    const task = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, req.params.id));
    res.json(task[0]);
});

// Create task (protected)
backend.route('post', '/tasks', async (db, req, res) => {
    const newTask = await db.insert(tasks).values(req.body).returning();
    res.json(newTask[0]);
}, (req, res, next) => {
    if (req.headers['x-api-key'] !== 'secret') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
});

backend.listen();
```