import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

//Enums
export const roleEnum = pgEnum("role", [
	"anonymous",
	"member",
	"editor",
	"owner",
]);

export const themeEnum = pgEnum("theme", ["default"]);

//Tables
//User Table
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	username: text("username").notNull().unique(),
	nickname: text("nickname").notNull(),
	profilePicture: text("profilePicture").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const usersCredentials = pgTable("usersCredentials", {
	email: text("email").notNull().unique(),
	password: text("password").notNull(),
	userId: uuid("userId").references(() => users.id),
});

//Space Table
export const spaces = pgTable("spaces", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	flyUrl: text("flyUrl").notNull().unique(),
	theme: themeEnum("theme").notNull(),
});

//Relational Tables
export const friends = pgTable("friends", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => users.id, {onDelete: 'cascade'}),
	friendId: uuid("friendId")
		.notNull()
		.references(() => users.id, {onDelete: 'cascade'}),
	createdAt: timestamp("created_at").defaultNow(),
});

export const spaceMembers = pgTable("spaceMembers", {
	id: uuid("id").primaryKey().defaultRandom(),
	spaceId: uuid("spaceId")
		.notNull()
		.references(() => spaces.id, {onDelete: 'cascade'}),
	userId: uuid("userId")
		.notNull()
		.references(() => users.id, {onDelete: 'cascade'}),
	role: roleEnum("role").notNull(),
	lastConnection: timestamp("last_connection"),
});

export const userStatus = pgTable("userStatus", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => users.id, {onDelete: 'cascade'}),
	spaceId: uuid("spaceId")
		.notNull()
		.references(() => spaces.id, {onDelete: 'cascade'}),
});
