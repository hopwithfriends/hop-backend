import { z } from "zod";

//Enums
const ThemeEnum = ["default"] as const; // ! Still not fully defined
export const RoleEnum = ["anonymous", "member", "editor", "admin"] as const; // ! Still not fully defined

export const RoleSchema = z.enum(RoleEnum);
export const ThemeSchema = z.enum(ThemeEnum)

//Zod Schemas
export const UserSchema = z.object({
	id: z.string().uuid().optional(),
	username: z.string().min(1),
	nickname: z.string(),
	profilePicture: z.string(),
});

export const UserCredentialSchema = z.object({
	email: z.string().email(),
	password: z.string(),
	userId: z.string().uuid().optional(),
});

export const SpaceSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1),
	flyUrl: z.string(),
	theme: z.enum(ThemeEnum),
});

export const FriendSchema = z.object({
	id: z.string().uuid().optional(),
	userId: z.string().uuid(),
	friendId: z.string().uuid(),
});

export const SpaceMemberSchema = z.object({
	id: z.string().uuid().optional(),
	spaceId: z.string().uuid(),
	userId: z.string().uuid(),
	role: z.enum(RoleEnum),
	lastConnection: z.date().optional(),
});

export const UserStatusSchema = z.object({
	id: z.string().uuid().optional(),
	userId: z.string().uuid(),
	spaceId: z.string().uuid(),
});

//Types for every schema
export type User = z.infer<typeof UserSchema>;
export type UserCredentials = z.infer<typeof UserCredentialSchema>;
export type Space = z.infer<typeof SpaceSchema>;
export type Friend = z.infer<typeof FriendSchema>;
export type SpaceMember = z.infer<typeof SpaceMemberSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export type RolesEnum = z.infer<typeof RoleSchema>;
export type ThemesEnum = z.infer<typeof ThemeSchema>;
