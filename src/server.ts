import app from "./app";
import * as schema from "./models/schema";
import { client } from "./models";
import { drizzle } from "drizzle-orm/node-postgres";
import chalk from "chalk";
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
	await client
		.connect()
		.then(() => {
			console.log(
				new Date().toLocaleString() + chalk.yellow(" Connected to Database"),
			);
			// Start Express web server
			console.log(chalk.green(` Server listening on http://localhost:${PORT}`));
		})
		.catch(() => {
			console.log(chalk.red("Failed to connect to the database!"));
		});
});


const db = drizzle(client, { schema });
export { db };