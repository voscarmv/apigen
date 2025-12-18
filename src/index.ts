import { AiMessageStoreBackend } from "./s.js";
import 'dotenv/config';
if(!process.env.DATABASE_URL){
    throw Error('DATABASE_URL undefined');
}
const server = new AiMessageStoreBackend({
    dbUrl: process.env.DATABASE_URL,
    port: 3000
})

server.migrate();