// import 'dotenv/config';
// import { messages } from './schema.js';
// import { drizzle } from 'drizzle-orm/node-postgres';
// import {
//     sql,
//     eq,
//     and,
//     asc,
//     type InferSelectModel
// } from 'drizzle-orm';

// const db = drizzle(process.env.DB_URL!);

// // Types
// export type Message = InferSelectModel<typeof messages>;

// // ---------------------- MESSAGES CRUD ----------------------

// export async function insertMessage(
//     user_id: string,
//     queued: boolean,
//     message: object
// ): Promise<Message[]> {
//     return await db
//         .insert(messages)
//         .values({
//             user_id,
//             queued,
//             message: JSON.stringify(message)
//         })
//         .returning();
// }

// export async function readMessages(user_id: string): Promise<Message[]> {
//     return await db
//         .select()
//         .from(messages)
//         .where(eq(messages.user_id, user_id))
//         .orderBy(asc(messages.updated_at), asc(messages.id));
// }

// export async function queuedMessages(user_id: string): Promise<Message[]> {
//     return await db
//         .select()
//         .from(messages)
//         .where(
//             and(
//                 eq(messages.queued, true),
//                 eq(messages.user_id, user_id)
//             )
//         );
// }

// export async function unqueueMessages(user_id: string): Promise<Message[]> {
//     return await db
//         .update(messages)
//         .set({
//             queued: false,
//             updated_at: sql`now()`
//         })
//         .where(eq(messages.user_id, user_id))
//         .returning();
// }

// export async function deleteMessage(id: number): Promise<Message[]> {
//     return await db
//         .delete(messages)
//         .where(eq(messages.id, id))
//         .returning();
// }