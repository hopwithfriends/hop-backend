import { eq, and, not } from "drizzle-orm";
import { db } from "../server";
import { spaces, spaceMembers } from "./schema";
import type {
	SpaceType,
	SpaceMemberType,
	RolesEnumType,
	ThemesEnumType,
} from "../types";
import { SpaceSchema, SpaceMemberSchema, RoleEnum } from "../types";
import { z } from "zod";

export class SpaceMethods {
	async insertSpace(
		name: string,
		flyUrl: string,
		userId: string,
		theme: ThemesEnumType = "default",
	): Promise<SpaceType | null> {
		try {
			// ! FLASK SDK INTERACTION NEEDS TO CONFIRM CREATION FIRST

			return await db.transaction(async (tx) => {
				const space: SpaceType = {
					name,
					flyUrl,
					theme,
				};

				console.log(space);

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

					console.log(spaceMember);

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
			// ! FLASK SDK INTERACTION NEEDS TO CONFIRM DELETION FIRST

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

	async findOwnedSpaces(userId: string): Promise<SpaceType[]> {
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

	async findInvitedSpaces(userId: string): Promise<SpaceType[]> {
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
}

export default new SpaceMethods();
