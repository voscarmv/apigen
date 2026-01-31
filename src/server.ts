import express, { type Request, type Response, type Express, type RequestHandler } from "express";
import { type CorsOptions } from "cors";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import type { NextFunction } from "express-serve-static-core";

export interface StoreBackend {
    listen: () => void;
}

export type DynamicStoreBackendParams = {
    dbUrl: string;
    port: number;
    corsOpts?: CorsOptions;
    middlewares?: RequestHandler[];
};

export type RouteParams = {
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;
    handler: (db: NodePgDatabase<Record<string, never>>, req: Request, res: Response) => Promise<void>;
    middlewares?: ((db: NodePgDatabase<Record<string, never>>, req: Request, res: Response, next: NextFunction) => Promise<void>)[];
};

export type ExpressMiddlewareType = 'json' | 'urlencoded' | 'raw' | 'text' | 'static';
export type MiddlewareOptions = Record<string, any>;

export class DynamicStoreBackend implements StoreBackend {
    #db: NodePgDatabase<Record<string, never>>;
    #app: Express;
    #port: number;

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

        // Default body parsers - can be overridden with useMiddleware
        this.#app.use(express.json({ limit: '50mb' }));
        this.#app.use(express.urlencoded({ limit: '50mb', extended: true }));

        // Add custom middlewares
        if (params.middlewares) {
            params.middlewares.forEach(mw => this.#app.use(mw));
        }

        this.#port = params.port;
    }

    useMiddleware(type: ExpressMiddlewareType, options?: MiddlewareOptions) {
        if (type === 'static') {
            this.#app.use(express.static(options?.path || 'public', options));
        } else {
            this.#app.use(express[type](options || {}));
        }
        return this;
    }

    route(params: RouteParams) {
        const { method, path, handler, middlewares = [] } = params;

        const wrappedMiddlewares = middlewares.map(mw => {
            const wrapped: RequestHandler = async (req, res, next) => {
                await mw(this.#db, req, res, next);
            };
            return wrapped;
        });

        const wrappedHandler: RequestHandler = async (req, res) => {
            await handler(this.#db, req, res);
        };

        this.#app[method](path, ...wrappedMiddlewares, wrappedHandler);
    }

    listen() {
        this.#app.listen(this.#port);
        return;
    }
}