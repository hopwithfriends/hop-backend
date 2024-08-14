import * as dotenv from "dotenv";
import pg from "pg";
dotenv.config();

const client = new pg.Client({
	connectionString: process.env.DATABASE_URL,
});

export { client };
