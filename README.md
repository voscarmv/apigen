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
backend.route({
    method: 'get',
    path: '/users',
    handler: async (db, req, res) => {
        const allUsers = await db.select().from(users);
        res.json(allUsers);
    }
});

// Add a route with auth middleware
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

backend.route({
    method: 'post',
    path: '/users',
    middlewares: [requireAuth],
    handler: async (db, req, res) => {
        const newUser = await db.insert(users).values(req.body).returning();
        res.json(newUser[0]);
    }
});

// Start server
backend.listen();
console.log('Server running on port 3000');
```

## API

### `new DynamicStoreBackend(params)`

Creates a new backend instance with pre-configured middleware (CORS, Helmet, Morgan, JSON parsing).

**Parameters:**
- `dbUrl` (string): PostgreSQL connection string
- `port` (number): Port to run server on
- `corsOpts` (optional): CORS configuration object

### `backend.route(params)`

Adds a new route to the server.

**Parameters object:**
- `method`: HTTP method (`'get' | 'post' | 'put' | 'delete' | 'patch'`)
- `path`: Route path (e.g., `/users/:id`)
- `handler`: Request handler function `(db, req, res) => Promise<void>`
- `middlewares` (optional): Array of Express middleware functions

### `backend.listen()`

Starts the Express server on the configured port.

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
backend.route({
    method: 'get',
    path: '/tasks',
    handler: async (db, req, res) => {
        const allTasks = await db.select().from(tasks);
        res.json(allTasks);
    }
});

// Get task by ID
backend.route({
    method: 'get',
    path: '/tasks/:id',
    handler: async (db, req, res) => {
        const task = await db
            .select()
            .from(tasks)
            .where(eq(tasks.id, req.params.id));
        res.json(task[0]);
    }
});

// Create task with API key auth
const apiKeyAuth = (req, res, next) => {
    if (req.headers['x-api-key'] !== 'secret') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

backend.route({
    method: 'post',
    path: '/tasks',
    middlewares: [apiKeyAuth],
    handler: async (db, req, res) => {
        const newTask = await db.insert(tasks).values(req.body).returning();
        res.json(newTask[0]);
    }
});

backend.listen();
```

## Using Multiple Middlewares

You can chain multiple middlewares for complex authentication, validation, or processing:
```typescript
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

backend.route({
    method: 'post',
    path: '/upload',
    middlewares: [requireAuth, upload.single('file'), validateFile],
    handler: async (db, req, res) => {
        // Access uploaded file via req.file
        res.json({ success: true, filename: req.file?.originalname });
    }
});
```

## Features

- 🚀 Quick Express + Drizzle setup
- 🔒 Built-in security with Helmet
- 🌐 CORS support out of the box
- 📝 Request logging with Morgan
- 🔧 Flexible middleware support
- 💾 Direct database access in handlers
- 📦 TypeScript support