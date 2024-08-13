import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../server";
import type { UserCredentialsType, UserType } from "../types";
import { UserCredentialSchema, UserSchema } from "../types";
import { friends, users, usersCredentials } from "./schema";

export class UserMethods {
	async findUserById(userId: string): Promise<UserType | null> {
		try {
			const user = await db.select().from(users).where(eq(users.id, userId));
			if (user.length > 0) {
				const validatedUser = UserSchema.parse(user[0]);
				if (!validatedUser) return null;
				return validatedUser;
			}
			return null;
		} catch (error) {
			console.log(error);
			return null;
		}
	}

	async updateUser(
		userId: string,
		data: Omit<UserType, "id">,
	): Promise<UserType | null> {
		let createdUser: UserType[];
		try {
			const validatedData = UserSchema.omit({ id: true }).parse(data);
			const updatedUser = await db
				.update(users)
				.set(validatedData)
				.where(eq(users.id, userId))
				.returning();

			const validatedUpdatedUser = UserSchema.parse(updatedUser);

			if (!validatedUpdatedUser) return null;
			return validatedUpdatedUser;
		} catch (error) {
			if (error instanceof z.ZodError) {
				console.error("Validation failed:", error.errors);
			} else {
				console.log(error);
			}
			return null;
		}
	}

	async insertFriend(userId: string, friendId: string): Promise<boolean> {
		try {
			const userExists = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			const friendExists = await db
				.select()
				.from(users)
				.where(eq(users.id, friendId))
				.limit(1);

			if (!userExists || !friendExists) {
				console.log("Users don't exist");
				return false;
			}

			const existingFriendship = await db
				.select()
				.from(friends)
				.where(
					or(
						and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
						and(eq(friends.userId, friendId), eq(friends.friendId, userId)),
					),
				);

			if (existingFriendship.length > 0) {
				console.log("Users are already friends");
				return false;
			}

			await db.transaction(async (tx) => {
				try {
					await tx.insert(friends).values({ userId, friendId });
					await tx
						.insert(friends)
						.values({ userId: friendId, friendId: userId });
				} catch (error) {
					await tx.rollback();
					throw error;
				}
			});
			return true;
		} catch (error) {
			console.error("Error adding friend:", error);
			return false;
		}
	}

	async deleteFriend(userId: string, friendId: string): Promise<boolean> {
		try {
			await db.transaction(async (tx) => {
				try {
					await tx
						.delete(friends)
						.where(
							and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
						);
					await tx
						.delete(friends)
						.where(
							and(eq(friends.userId, friendId), eq(friends.friendId, userId)),
						);
				} catch (error) {
					await tx.rollback();
					throw error;
				}
			});
			return true;
		} catch (error) {
			console.error("Error deleting friend:", error);
			return false;
		}
	}

	async findAllFriends(userId: string): Promise<UserType[]> {
		try {
			const friendIds = await db
				.select({ friendId: friends.friendId })
				.from(friends)
				.where(or(eq(friends.userId, userId), eq(friends.friendId, userId)))
				.then((rows) => rows.map((row) => row.friendId));

			const friendsData = await db
				.select()
				.from(users)
				.where(inArray(users.id, friendIds));
			return friendsData.filter((friend) => friend.id !== userId);
		} catch (error) {
			console.error("Error getting friends:", error);
			return [];
		}
	}
}

export default new UserMethods();
