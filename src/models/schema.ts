import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", [
	"anonymous",
	"member",
	"editor",
	"owner",
]);

export const themeEnum = pgEnum("theme", ["default"]);

// TABLES
// User Table
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	username: text("username").unique(),
	nickname: text("nickname"),
	profilePicture: text("profile_picture"),
	createdAt: timestamp("created_at").defaultNow(),
});

// Space Table
export const spaces = pgTable("spaces", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	password: text("passowrd").notNull(),
	flyUrl: text("fly_url").notNull().unique(),
	theme: themeEnum("theme").notNull(),
});

// RELATIONAL TABLES
// Friends Table
export const friends = pgTable("friends", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	friendId: uuid("friend_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow(),
});

// Space Members Table
export const spaceMembers = pgTable("space_members", {
	id: uuid("id").primaryKey().defaultRandom(),
	spaceId: uuid("space_id")
		.notNull()
		.references(() => spaces.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	role: roleEnum("role").notNull(),
	lastConnection: timestamp("last_connection"),
});

// User Status Table
export const userStatus = pgTable("user_status", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	spaceId: uuid("space_id").references(() => spaces.id, {
		onDelete: "cascade",
	}),
});
