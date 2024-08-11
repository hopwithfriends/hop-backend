import pg from "pg";
import * as dotenv from "dotenv";
dotenv.config();
console.log(process.env.DATABASE_URL);
const client = new pg.Client({
	connectionString: process.env.DATABASE_URL,
});

export { client };
