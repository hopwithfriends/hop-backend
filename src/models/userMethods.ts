import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../server";
import type { UserType } from "../types";
import { UserSchema } from "../types";
import { friends, userStatus, users } from "./schema";

export class UserMethods {
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

			const validatedUpdatedUser = UserSchema.parse(updatedUser[0]);

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

	async insertFriend(userId: string, username: string): Promise<boolean> {
		try {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			const friend = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (!user || !friend) {
				console.log("Users don't exist");
				return false;
			}

			const existingFriendship = await db
				.select()
				.from(friends)
				.where(
					or(
						and(
							eq(friends.userId, user[0].id),
							eq(friends.friendId, friend[0].id),
						),
						and(
							eq(friends.userId, friend[0].id),
							eq(friends.friendId, user[0].id),
						),
					),
				);

			if (existingFriendship.length > 0) {
				console.log("Users are already friends");
				return false;
			}
			await db.transaction(async (tx) => {
				try {
					await tx
						.insert(friends)
						.values({ userId: user[0].id, friendId: friend[0].id });
					await tx
						.insert(friends)
						.values({ userId: friend[0].id, friendId: user[0].id });
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

	async changeStatus(
		userId: string,
		addStatus = true,
		spaceId: string | null = null,
	) {
		type UserDataType = {
			userId: string;
			spaceId?: string;
		};

		if (!addStatus) {
			await db.delete(userStatus).where(eq(userStatus.userId, userId));
			return true;
		}

		const userData: UserDataType = { userId };
		if (!spaceId) {
			userData.userId = userId;
		}

		await db.insert(userStatus).values(userData);
		return true;
	}
}

export default new UserMethods();
