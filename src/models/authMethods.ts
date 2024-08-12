import { z } from "zod";
import { db } from "../server";
import { users } from "./schema";

class AuthMethods {
	async insertUser(userId: string) {
		try {
			const createdUser = await db
				.insert(users)
				.values({
					id: userId,
				})
				.returning();
			return createdUser[0];
		} catch (error) {
			// Improve error handling here!
			console.error(error);
			throw new Error("Failed to register user!");
		}
	}
}

export default new AuthMethods();
