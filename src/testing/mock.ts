import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../models/schema";

//mock client
dotenv.config();

console.log("Database URL:", process.env.DATABASE_TEST_URL);
const mockClient = new pg.Client({
	connectionString: process.env.DATABASE_TEST_URL,
});

export { mockClient };

//clear DB
async function deleteAllData(connectionString: string) {
	const db = drizzle(mockClient, { schema });

	try {
		await db.transaction(async (tx) => {
			for (const table of Object.values(schema)) {
				if (typeof table === "object" && "name" in table) {
					await tx.delete(table);
				}
			}
		});
		console.log("All data deleted successfully.");
	} catch (error) {
		console.error("Error deleting data:", error);
	}
}
