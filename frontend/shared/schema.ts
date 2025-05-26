import { pgTable, text, serial, integer, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isCreator: boolean("is_creator").default(false).notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Content categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  slug: text("slug").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Column (series of content)
export const columns = pgTable("columns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  categoryId: integer("category_id").references(() => categories.id),
  articleCount: integer("article_count").default(0).notNull(),
  subscriberCount: integer("subscriber_count").default(0).notNull(),
  rating: integer("rating").default(0),
  isPublished: boolean("is_published").default(false).notNull(),
  isHot: boolean("is_hot").default(false).notNull(),
  isNew: boolean("is_new").default(true).notNull(),
  // 支付相关字段
  paymentType: integer("payment_type").default(0).notNull(), // 0: 买断, 1: 订阅
  price: integer("price").default(0).notNull(), // 价格 (SUI)
  subscriptionDays: integer("subscription_days").default(30), // 订阅天数
  totalEarnings: integer("total_earnings").default(0).notNull(), // 总收入
  availableRewards: integer("available_rewards").default(0).notNull(), // 可提取奖励
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertColumnSchema = createInsertSchema(columns).omit({
  id: true,
  articleCount: true,
  subscriberCount: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
});

// Knowledge bases (top level)
export const knowledgeBases = pgTable("knowledge_bases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBases).omit({
  id: true,
  createdAt: true,
});

// Folders (mid level)
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  knowledgeBaseId: integer("knowledge_base_id").notNull().references(() => knowledgeBases.id),
  parentFolderId: integer("parent_folder_id").references(() => folders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
});

// Markdown files (content level)
export const markdownFiles = pgTable("markdown_files", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  folderId: integer("folder_id").references(() => folders.id),
  knowledgeBaseId: integer("knowledge_base_id").notNull().references(() => knowledgeBases.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMarkdownFileSchema = createInsertSchema(markdownFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Articles (published content)
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  columnId: integer("column_id").notNull().references(() => columns.id),
  markdownFileId: integer("markdown_file_id").references(() => markdownFiles.id),
  order: integer("order").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  columnId: integer("column_id").notNull().references(() => columns.id),
  subscriptionDate: timestamp("subscription_date").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  subscriptionDate: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Column = typeof columns.$inferSelect;
export type InsertColumn = z.infer<typeof insertColumnSchema>;

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type MarkdownFile = typeof markdownFiles.$inferSelect;
export type InsertMarkdownFile = z.infer<typeof insertMarkdownFileSchema>;

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
