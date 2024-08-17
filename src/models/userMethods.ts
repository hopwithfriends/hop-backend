import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../server";
import type { FriendStatusType, UserType } from "../types";
import { UserSchema } from "../types";
import { friends, spaces, userStatus, users } from "./schema";

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

	async findAllFriends(userId: string): Promise<FriendStatusType[]> {
		try {
			const friendIds = await db
				.select({ friendId: friends.friendId })
				.from(friends)
				.where(or(eq(friends.userId, userId), eq(friends.friendId, userId)))
				.then((rows) => rows.map((row) => row.friendId));

			const friendsData = await db
				.select({
					id: users.id,
					username: users.username,
					nickname: users.nickname,
					profilePicture: users.profilePicture,
				})
				.from(users)
				.where(inArray(users.id, friendIds));
			const friendsFound = friendsData.filter((friend) => friend.id !== userId);

			const friendStatusPromises: Promise<FriendStatusType>[] =
				friendsFound.map(async (friend) => {
					let status: string | null = null;
					const friendOnline = await db
						.select()
						.from(userStatus)
						.where(eq(userStatus.userId, friend.id));

					if (friendOnline[0]) {
						status = friendOnline[0].spaceId
							? friendOnline[0].spaceId
							: "online";
					}
					const friendWithStatus: FriendStatusType = {
						id: friend.id,
						username: friend.username,
						nickname: friend.nickname,
						profilePicture: friend.profilePicture,
						status: status,
					};
					return friendWithStatus;
				});

			const friendStatus = await Promise.all(friendStatusPromises);

			const friendSpacesPromises: Promise<FriendStatusType>[] =
				friendStatus.map(async (friend) => {
					if (friend.status === null || friend.status === "online")
						return friend;
					const friendSpace = await db
						.select()
						.from(spaces)
						.where(eq(spaces.id, friend.status as string));

					if (friendSpace[0]) {
						friend.status = {
							name: friendSpace[0].name,
							id: friendSpace[0].id,
						};
					}
					return friend;
				});
			const friendSpaces = await Promise.all(friendSpacesPromises);
			return friendSpaces;
		} catch (error) {
			console.error("Error getting friends:", error);
			return [];
		}
	}
}

export default new UserMethods();
