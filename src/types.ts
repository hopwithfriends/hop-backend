import { z } from "zod";

// Enums
const ThemeEnum = ["default"] as const; // ! Still not fully defined
export const RoleEnum = ["anonymous", "member", "editor", "owner"] as const; // ! Still not fully defined

export const RoleSchema = z.enum(RoleEnum);
export const ThemeSchema = z.enum(ThemeEnum);

// Zod Schemas
export const UserSchema = z.object({
	id: z.string().uuid().optional(),
	username: z.string().min(1),
	nickname: z.string(),
	profilePicture: z.string(),
});

export const UserCredentialSchema = z.object({
	email: z.string().email(),
	password: z.string(),
	userId: z.string().uuid(),
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

export const StackWebhookDataSchema = z.object({
	id: z.string(),
	primary_email_verified: z.boolean(),
	signed_up_at_millis: z.number(),
	has_password: z.boolean(),
	// selected_team: z.object(),
	selected_team_id: z.string(),
	profile_image_url: z.string(),
	// client_metadata: z.object(),
	// server_metadata: z.object(),
});

export const StackWebhookSchema = z.object({
	event: z.string(),
	data: StackWebhookDataSchema,
});

// Typescript Types inferred from Zod Schemas
export type UserType = z.infer<typeof UserSchema>;
export type UserCredentialsType = z.infer<typeof UserCredentialSchema>;
export type SpaceType = z.infer<typeof SpaceSchema>;
export type FriendType = z.infer<typeof FriendSchema>;
export type SpaceMemberType = z.infer<typeof SpaceMemberSchema>;
export type UserStatusType = z.infer<typeof UserStatusSchema>;
export type RolesEnumType = z.infer<typeof RoleSchema>;
export type ThemesEnumType = z.infer<typeof ThemeSchema>;

export type StackWebhookDataType = z.infer<typeof StackWebhookDataSchema>;
export type StackWebhookType = z.infer<typeof StackWebhookSchema>;
