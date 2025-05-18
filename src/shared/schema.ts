import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  isCreator: boolean("is_creator").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Series table (aka Courses)
export const series = pgTable("series", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  price: text("price").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  moduleCount: integer("module_count").default(0).notNull(),
  subscriberCount: integer("subscriber_count").default(0).notNull(), 
  isTrending: boolean("is_trending").default(false).notNull(),
  isNew: boolean("is_new").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories for organizing series
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  iconName: text("icon_name").notNull(),
  seriesCount: integer("series_count").default(0).notNull(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  seriesId: integer("series_id").notNull().references(() => series.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Content hierarchy - KnowledgeBase (top level)
export const knowledgeBases = pgTable("knowledge_bases", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Content hierarchy - Folders
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  knowledgeBaseId: integer("knowledge_base_id").notNull().references(() => knowledgeBases.id),
  parentFolderId: integer("parent_folder_id").references(() => folders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Content hierarchy - Files (markdown content)
export const contentFiles = pgTable("content_files", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  knowledgeBaseId: integer("knowledge_base_id").notNull().references(() => knowledgeBases.id),
  folderId: integer("folder_id").references(() => folders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Modules (parts of a series)
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  seriesId: integer("series_id").notNull().references(() => series.id),
  order: integer("order").notNull(),
  contentFileId: integer("content_file_id").references(() => contentFiles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Progress tracking for users
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => modules.id),
  isCompleted: boolean("is_completed").default(false).notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  bio: true,
  avatarUrl: true,
  isCreator: true,
});

export const insertSeriesSchema = createInsertSchema(series).pick({
  title: true,
  description: true,
  thumbnailUrl: true,
  creatorId: true,
  price: true,
  categoryId: true,
  isTrending: true,
  isNew: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
  iconName: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  seriesId: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBases).pick({
  title: true,
  description: true,
  creatorId: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  title: true,
  knowledgeBaseId: true,
  parentFolderId: true,
});

export const insertContentFileSchema = createInsertSchema(contentFiles).pick({
  title: true,
  content: true,
  knowledgeBaseId: true,
  folderId: true,
});

export const insertModuleSchema = createInsertSchema(modules).pick({
  title: true,
  seriesId: true,
  order: true,
  contentFileId: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  moduleId: true,
  isCompleted: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSeries = z.infer<typeof insertSeriesSchema>;
export type Series = typeof series.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;

export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;

export type InsertContentFile = z.infer<typeof insertContentFileSchema>;
export type ContentFile = typeof contentFiles.$inferSelect;

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

// Extended schemas for form validation
export const userLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userRegisterSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type UserLoginCredentials = z.infer<typeof userLoginSchema>;
export type UserRegisterData = z.infer<typeof userRegisterSchema>;
