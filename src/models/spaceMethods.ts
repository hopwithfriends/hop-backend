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
			const appName = `${name.toLowerCase().replace(/ /g, "")}-${id}`;
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
					.returning();

				if (createdSpace[0].id) {
					const spaceMember: SpaceMemberType = {
						spaceId: createdSpace[0].id,
						userId,
						role: "owner",
					};

					const validatedSpaceMember = SpaceMemberSchema.parse(spaceMember);

					await tx.insert(spaceMembers).values(validatedSpaceMember);

					return createdSpace[0];
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

	async deleteSpace(spaceId: string): Promise<boolean> {
		try {
			const spaceToDelete = await db
				.select()
				.from(spaces)
				.where(eq(spaces.id, spaceId));

			if (!spaceToDelete) return false;

			const appName = (spaceToDelete[0].flyUrl.match(
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

	async findSpace(id: string): Promise<Omit<SpaceType, "password"> | null> {
		try {
			const space = await db
				.select({
					id: spaces.id,
					name: spaces.name,
					flyUrl: spaces.flyUrl,
					theme: spaces.theme,
				})
				.from(spaces)
				.where(eq(spaces.id, id));

			if (!space[0]) return null;

			return space[0];
		} catch (error) {
			console.log("Body does not have the correct information!");
			return null;
		}
	}
}

export default new SpaceMethods();
