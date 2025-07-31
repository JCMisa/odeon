import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  uuid,
  varchar,
  doublePrecision,
  pgEnum,
} from "drizzle-orm/pg-core";

export const songStatus = pgEnum("songStatus", [
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified")
      .$defaultFn(() => false)
      .notNull(),
    image: text("image"),
    credits: integer("credits").default(100),
    createdAt: timestamp("created_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("user_email_idx").on(table.email)]
);

export const song = pgTable(
  "song",
  {
    id: uuid().defaultRandom().primaryKey(),
    title: varchar("title").notNull(),
    s3Key: text("s3Key"),
    thumbnailS3Key: text("thumbnailS3Key"),
    status: songStatus("status").default("queued"),
    instrumental: boolean("instrumental").default(false),
    prompt: text("prompt"),
    lyrics: text("lyrics"),
    fullDescribedSong: text("fullDescribedSong"),
    describedLyrics: text("describedLyrics"),
    guidanceScale: doublePrecision("guidanceScale"),
    inferStep: doublePrecision("inferStep"),
    audioDuration: doublePrecision("audioDuration"),
    seed: doublePrecision("seed"),
    published: boolean("published").default(false),
    listenCount: integer("listenCount").default(0),
    // who created this song
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("song_s3Key_idx").on(table.s3Key)]
);

export const category = pgTable("category", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar("name").unique(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const songCategory = pgTable(
  "songCategory", // A descriptive name for the join table
  {
    id: uuid().defaultRandom().primaryKey(),
    songId: uuid("songId")
      .notNull()
      .references(() => song.id, { onDelete: "cascade" }), // Foreign key to song
    categoryId: uuid("categoryId")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }), // Foreign key to category
    createdAt: timestamp("created_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }
);

export const like = pgTable("like", {
  id: uuid().defaultRandom().primaryKey(),
  // who created the like
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // what song did the user liked
  songId: uuid("songId")
    .notNull()
    .references(() => song.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ------------------------------------------- SCHEMA RELATIONSHIPS -------------------------------------------

// Relations for the User table
export const userRelations = relations(user, ({ many }) => ({
  // A user can create many songs
  songs: many(song),
  // A user can have many likes (i.e., like many songs)
  likes: many(like),
}));

// Relations for the Song table
export const songRelations = relations(song, ({ one, many }) => ({
  // A song belongs to one user (the creator)
  user: one(user, {
    fields: [song.userId],
    references: [user.id],
  }),
  // A song can have many likes
  likes: many(like),
  // A song can have many categories
  songCategories: many(songCategory),
}));

// Relations for the Like table
export const likeRelations = relations(like, ({ one }) => ({
  // A like belongs to one user
  user: one(user, {
    fields: [like.userId],
    references: [user.id],
  }),
  // A like belongs to one song
  song: one(song, {
    fields: [like.songId],
    references: [song.id],
  }),
}));

// Relations for the Category table
export const categoryRelations = relations(category, ({ many }) => ({
  // Relation to many songs via the songCategory join table
  songCategories: many(songCategory),
}));

// Relations for the SongCategory Join Table (New)
export const songCategoryRelations = relations(songCategory, ({ one }) => ({
  // Each join entry belongs to one song
  song: one(song, {
    fields: [songCategory.songId],
    references: [song.id],
  }),
  // Each join entry belongs to one category
  category: one(category, {
    fields: [songCategory.categoryId],
    references: [category.id],
  }),
}));

// ------------------------------------------- BETTER AUTH ADDITIONAL USER SCHEMA CONFIGURATIONS -------------------------------------------

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const schema = {
  user,
  song,
  like,
  category,
  songCategory,
  session,
  account,
  verification,
  songStatus,
};
