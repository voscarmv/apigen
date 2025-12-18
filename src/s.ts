import express, { type Express } from "express";
import { type CorsOptions } from "cors";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

export interface StoreBackend {
    migrate: () => void;
    listen: () => void;
};

export type MessageStoreBackendParams = {
    dbUrl: string,
    port: number,
    corsOpts?: CorsOptions,
};

export class AiMessageStoreBackend implements StoreBackend {
    #db: NodePgDatabase<Record<string, never>>;
    #app: Express;
    #port: number;
    constructor(params: MessageStoreBackendParams){
        this.#db=drizzle(params.dbUrl);
        this.#app=express();
        if(params.corsOpts){
            this.#app.use(cors(params.corsOpts));
        } else {
            this.#app.use(cors());
        }
        this.#app.use(helmet());
        this.#app.use(morgan("combined"));
        this.#app.use(express.json());
        this.#port = params.port;
    }
    async migrate(){
        await migrate(this.#db, {migrationsFolder: './dist/drizzle'});
        return;
    }
    listen(){
        this.#app.listen(this.#port);
        return;
    }
}
