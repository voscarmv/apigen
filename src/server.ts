import express, { type Request, type Response, type Express, type RequestHandler } from "express";
import { type CorsOptions } from "cors";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface StoreBackend {
    migrate: () => void;
    listen: () => void;
}

export type DynamicStoreBackendParams = {
    dbUrl: string;
    port: number;
    corsOpts?: CorsOptions;
    migrationsFolder?: string;
};

export class DynamicStoreBackend implements StoreBackend {
    #db: NodePgDatabase<Record<string, never>>;
    #app: Express;
    #port: number;
    #migrationsFolder: string;

    constructor(params: DynamicStoreBackendParams) {
        this.#db = drizzle(params.dbUrl);
        this.#app = express();

        if (params.corsOpts) {
            this.#app.use(cors(params.corsOpts));
        } else {
            this.#app.use(cors());
        }

        this.#app.use(helmet());
        this.#app.use(morgan("combined"));
        this.#app.use(express.json());
        this.#port = params.port;
        this.#migrationsFolder = params.migrationsFolder || `${__dirname}/drizzle`;
    }

    // Default auth middleware that allows all requests
    #defaultAuthMiddleware = (req: Request, res: Response, next: () => void) => {
        next();
    };

    // Simple route generator
    route(
        method: 'get' | 'post' | 'put' | 'delete' | 'patch',
        path: string,
        handler: (db: NodePgDatabase<Record<string, never>>, req: Request, res: Response) => Promise<void>,
        authMiddleware?: (req: Request, res: Response, next: () => void) => void | Promise<void>
    ) {
        const wrappedHandler: RequestHandler = async (req, res) => {
            await handler(this.#db, req, res);
        };

        const middlewares: RequestHandler[] = [];

        // Use provided auth middleware or default (pass-through)
        const auth = authMiddleware || this.#defaultAuthMiddleware;
        middlewares.push((req, res, next) => auth(req, res, next));
        middlewares.push(wrappedHandler);
        this.#app[method](path, ...middlewares);
    }

    async migrate() {
        try {
            await migrate(this.#db, { migrationsFolder: this.#migrationsFolder });
        } catch (e: any) {
            console.log(e.message);
        }
        return;
    }

    listen() {
        this.#app.listen(this.#port);
        return;
    }
}