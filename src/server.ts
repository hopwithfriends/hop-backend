import { drizzle } from "drizzle-orm/node-postgres";
import app from "./app";
import { client } from "./models";
import * as schema from "./models/schema";

const PORT = process.env.PORT || 8080;

declare global {
	namespace Express {
		interface Request {
			user: string;
		}
	}
}

const db = drizzle(client, { schema });

async function startServer() {
	try {
		await client.connect();
		console.log(`${new Date().toLocaleString()} + Connected to Database`);

		app.listen(PORT, () => {
			console.log(`Server listening on port ${PORT}`);
		});
	} catch (error) {
		console.log("Failed to connect to the database!", error);
		process.exit(1);
	}
}

startServer();

export { db };
