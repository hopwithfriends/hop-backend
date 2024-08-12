import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "../server";
import { users, usersCredentials, friends } from "./schema";
import type { UserCredentialsType, UserType } from "../types";
import { UserCredentialSchema, UserSchema } from "../types";
import { z } from "zod";

export class UserMethods {
	async findAllUsers(): Promise<UserType[] | null> {
		try {
			const allUsers = await db.select().from(users);
			return allUsers;
		} catch (error) {
			console.log(error);
			return null;
		}
	}

	async findUserById(userId: string): Promise<UserType | null> {
		try {
			const user = await db.select().from(users).where(eq(users.id, userId));
			if (user.length > 0) {
				return user[0];
			}
			return null;
		} catch (error) {
			console.log(error);
			return null;
		}
	}
	async insertUser(
		username: string,
		password: string,
		email: string,
		profilePicture: string,
		nickname: string = username,
	): Promise<UserType | null> {
		let createdUser: UserType[];
		try {
			// ! This is still very mocklike, hashing + auth not done
			return await db.transaction(async (tx) => {
				try {
					const user: UserType = {
						username: username,
						nickname: nickname,
						profilePicture: profilePicture,
					};
					const userCredentials: Omit<UserCredentialsType, 'userId'>  = {
						email: email,
						password: password,
					};

					const validatedUser = UserSchema.parse(user);
					const validatedUserCredentials =
						UserCredentialSchema.parse(userCredentials);

					createdUser = await tx
						.insert(users)
						.values(validatedUser)
						.returning();

					if (createdUser[0].id) {
						validatedUserCredentials.userId = createdUser[0].id;
						await tx.insert(usersCredentials).values(validatedUserCredentials);
						return createdUser[0];
					}
					return null;
				} catch (error) {
					await tx.rollback();
					throw error;
				}
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				console.error("Validation failed:", error.errors);
			} else {
				console.log(error);
			}
			return null;
		}
	}

	async deleteUser(userId: string): Promise<boolean> {
		try {
			await db.transaction(async (tx) => {
				try {
					await tx
						.delete(usersCredentials)
						.where(eq(usersCredentials.userId, userId));
					await tx.delete(users).where(eq(users.id, userId));
					return true;
				} catch (error) {
					tx.rollback();
					throw error;
				}
			});
		} catch (error) {
			console.log(error);
		}
		return false;
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
