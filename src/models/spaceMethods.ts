import { and, eq, not } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db } from "../server";
import type {
	RolesEnumType,
	SpaceMemberType,
	SpaceType,
	ThemesEnumType,
} from "../types";
const FLY_API_URL = process.env.FLY_API_URL || "http://localhost:5000/api/apps";
import { RoleEnum, SpaceMemberSchema, SpaceSchema } from "../types";
import { spaceMembers, spaces } from "./schema";

export class SpaceMethods {
	async insertSpace(
		id: string,
		name: string,
		userId: string,
		password: string,
		theme: ThemesEnumType = "default",
	): Promise<SpaceType | null> {
		try {
			const appName = `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${id}`;
			// SDK
			try {
				const response = await fetch(FLY_API_URL, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						app_name: appName,
						password: password,
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
			} catch (error) {
				throw error as Error;
			}

			// IF SDK CONFIRMED
			const flyUrl = `https://${appName}.fly.dev`;
			return await db.transaction(async (tx) => {
				const space: SpaceType = {
					id,
					name,
					password,
					flyUrl,
					theme,
				};

				const validatedSpace = SpaceSchema.parse(space);

				const createdSpace = await tx
					.insert(spaces)
					.values(validatedSpace)
					.returning().then((result) => result[0]);

				if (createdSpace.id) {
					const spaceMember: SpaceMemberType = {
						spaceId: createdSpace.id,
						userId,
						role: "owner",
					};

					const validatedSpaceMember = SpaceMemberSchema.parse(spaceMember);

					await tx.insert(spaceMembers).values(validatedSpaceMember);

					return createdSpace;
				}
				return null;
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				console.error("Validation failed:", error.errors);
			} else {
				console.error("Error creating space:", error);
			}
			return null;
		}
	}

	async deleteSpace(spaceId: string, userId: string): Promise<boolean> {
		try {
			const spaceToDelete = await db
				.select()
				.from(spaces)
				.where(eq(spaces.id, spaceId)).then((result) => result[0]);

			if (!spaceToDelete) return false;

			const spaceOwner = await db
				.select()
				.from(spaceMembers)
				.where(
					and(
						eq(spaceMembers.role, "owner"),
						eq(spaceMembers.spaceId, spaceId),
						eq(spaceMembers.userId, userId),
					),
				).then((result) => result[0]);

			if (!spaceOwner) return false;

			const appName = (spaceToDelete.flyUrl.match(
				/(?<=https:\/\/).*?(?=\.fly\.dev)/,
			) || [null])[0];

			try {
				const response = await fetch(FLY_API_URL, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						app_name: appName,
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
			} catch (error) {
				throw error as Error;
			}

			return await db.transaction(async (tx) => {
				await tx.delete(spaceMembers).where(eq(spaceMembers.spaceId, spaceId));
				await tx.delete(spaces).where(eq(spaces.id, spaceId));

				return true;
			});
		} catch (error) {
			console.error("Error deleting space:", error);
			return false;
		}
	}

	async addUserToSpace(
		spaceId: string,
		userId: string,
		role: RolesEnumType,
	): Promise<boolean> {
		try {
			const spaceMember: SpaceMemberType = {
				spaceId,
				userId,
				role,
			};

			const validatedSpaceMember = SpaceMemberSchema.parse(spaceMember);

			const memberExists = await db
				.select()
				.from(spaceMembers)
				.where(
					and(
						eq(spaceMembers.spaceId, validatedSpaceMember.spaceId),
						eq(spaceMembers.userId, validatedSpaceMember.userId),
					),
				).then((result) => result[0]);

			console.log("memberExists", memberExists);
			if (memberExists) return false;

			await db.insert(spaceMembers).values(validatedSpaceMember);

			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				console.error("Validation failed:", error.errors);
			} else {
				console.error("Error adding user to space:", error);
			}
			return false;
		}
	}

	async removeUserFromSpace(spaceId: string, adminId: string, userId: string) {
		const [adminRole, userRole] = await Promise.all([
			db
				.select({ role: spaceMembers.role })
				.from(spaceMembers)
				.where(
					and(eq(spaceMembers.id, adminId), eq(spaceMembers.spaceId, spaceId)),
				)
				.then((result) => result[0].role),
			db
				.select({ role: spaceMembers.role })
				.from(spaceMembers)
				.where(
					and(eq(spaceMembers.id, userId), eq(spaceMembers.spaceId, spaceId)),
				)
				.then((result) => result[0].role),
		]);

		const roleHierarchy = { owner: 3, editor: 2, member: 1, anonymous: 0 };

		const canRemove =
			roleHierarchy[adminRole] > roleHierarchy[userRole] &&
			userRole !== "owner";

		if (canRemove || userId === adminId) {
			await db
				.delete(spaceMembers)
				.where(
					and(eq(spaceMembers.userId, userId), eq(spaceMembers.id, spaceId)),
				);
			return true;
		}
	}

	async findOwnedSpaces(
		userId: string,
	): Promise<Omit<SpaceType, "password">[]> {
		try {
			const adminSpaces = await db
				.select({
					id: spaces.id,
					name: spaces.name,
					flyUrl: spaces.flyUrl,
					theme: spaces.theme,
					password: spaces.password,
				})
				.from(spaceMembers)
				.innerJoin(spaces, eq(spaceMembers.spaceId, spaces.id))
				.where(
					and(eq(spaceMembers.userId, userId), eq(spaceMembers.role, "owner")),
				);

			return adminSpaces;
		} catch (error) {
			console.error("Error fetching admin spaces:", error);
			return [];
		}
	}

	async findInvitedSpaces(
		userId: string,
	): Promise<Omit<SpaceType, "password">[]> {
		try {
			const memberSpaces = await db
				.select({
					id: spaces.id,
					name: spaces.name,
					flyUrl: spaces.flyUrl,
					theme: spaces.theme,
					password: spaces.password,
				})
				.from(spaceMembers)
				.innerJoin(spaces, eq(spaceMembers.spaceId, spaces.id))
				.where(
					and(
						eq(spaceMembers.userId, userId),
						not(eq(spaceMembers.role, "owner")),
					),
				);

			return memberSpaces;
		} catch (error) {
			console.error("Error fetching non-admin member spaces:", error);
			return [];
		}
	}

	async findSpace(id: string): Promise<SpaceType | null> {
		try {
			const space = await db
				.select({
					id: spaces.id,
					name: spaces.name,
					flyUrl: spaces.flyUrl,
					theme: spaces.theme,
					password: spaces.password,
				})
				.from(spaces)
				.where(eq(spaces.id, id)).then((result) => result[0]);
			return space;
		} catch (error) {
			console.log("Body does not have the correct information!");
			return null;
		}
	}
}

export default new SpaceMethods();
