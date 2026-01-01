import express, { type Request, type Response, type Express, type RequestHandler } from "express";
import { type CorsOptions } from "cors";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

export interface StoreBackend {
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

    // Enhanced route method that accepts multiple middlewares
    route(
        method: 'get' | 'post' | 'put' | 'delete' | 'patch',
        path: string,
        handler: (db: NodePgDatabase<Record<string, never>>, req: Request, res: Response) => Promise<void>,
        ...middlewares: RequestHandler[]
    ) {
        const wrappedHandler: RequestHandler = async (req, res) => {
            await handler(this.#db, req, res);
        };

        // Apply all middlewares in order, then the handler
        this.#app[method](path, ...middlewares, wrappedHandler);
    }

    listen() {
        this.#app.listen(this.#port);
        return;
    }
}