import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("username").notNull().unique(),
	email: text("email").notNull().unique(),
	nickname: text("nickname").notNull(),
	password: text("password").notNull(),
	profilePicture: text("profilePicture").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const spaces = pgTable("spaces", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	flyUrl: text("flyUrl").notNull().unique(),
	theme: text("theme").notNull(),
	userid: uuid("user_id").references(() => users.id),
});

export const friends = pgTable("friends", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	friendId: uuid("friend_id")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("created_at").defaultNow(),
});

export const spaceMembers = pgTable("spaceMembers", {
	id: uuid("id").primaryKey().defaultRandom(),
	spaceId: uuid("space_id")
		.notNull()
		.references(() => spaces.id),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	role: text("role").notNull(),
	lastConnection: timestamp("last_connection"),
});

export const userStatus = pgTable("userStatus", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	spaceId: uuid("space_id")
		.notNull()
		.references(() => spaces.id),
});
