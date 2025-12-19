import { AiMessageStoreBackend } from "./server.js";
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
    throw Error('DATABASE_URL undefined');
}

const server = new AiMessageStoreBackend({
    dbUrl: process.env.DATABASE_URL,
    port: 3000
});

(async () => {
    console.log("Migrate DB");
    await server.migrate()
    console.log("Done Migrating DB. Start server...");
    server.listen();
})();
