import * as dotenv from "dotenv";
import pg from "pg";
dotenv.config();
console.log(process.env.DATABASE_URL);
const client = new pg.Client({
	connectionString: process.env.DATABASE_URL,
});

export { client };
