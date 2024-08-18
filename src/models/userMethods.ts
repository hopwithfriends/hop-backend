import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../server";
import type { FriendStatusType, UserType } from "../types";
import { UserSchema } from "../types";
import { friends, spaces, userStatus, users } from "./schema";

export class UserMethods {
	async findUserById(userId: string): Promise<UserType | null> {
		try {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.then((result) => result[0]);
			if (user) {
				return user;
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
				.returning()
				.then((result) => result[0]);

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

	async insertFriend(userId: string, username: string): Promise<boolean> {
		try {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.then((result) => result[0]);

			const friend = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.then((result) => result[0]);

			if (!user || !friend) {
				console.log("Users don't exist");
				return false;
			}

			const existingFriendship = await db
				.select()
				.from(friends)
				.where(
					or(
						and(eq(friends.userId, user.id), eq(friends.friendId, friend.id)),
						and(eq(friends.userId, friend.id), eq(friends.friendId, user.id)),
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
						.values({ userId: user.id, friendId: friend.id });
					await tx
						.insert(friends)
						.values({ userId: friend.id, friendId: user.id });
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
						.where(eq(userStatus.userId, friend.id))
						.then((result) => result[0]);

					if (friendOnline) {
						status = friendOnline.spaceId ? friendOnline.spaceId : "online";
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
						.where(eq(spaces.id, friend.status as string))
						.then((result) => result[0]);

					if (friendSpace) {
						friend.status = {
							name: friendSpace.name,
							id: friendSpace.id,
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
