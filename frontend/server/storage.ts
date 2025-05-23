import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  columns, type Column, type InsertColumn,
  knowledgeBases, type KnowledgeBase, type InsertKnowledgeBase,
  folders, type Folder, type InsertFolder,
  markdownFiles, type MarkdownFile, type InsertMarkdownFile,
  articles, type Article, type InsertArticle,
  subscriptions, type Subscription, type InsertSubscription
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Column methods
  getColumn(id: number): Promise<Column | undefined>;
  getColumnsByCreator(creatorId: number): Promise<Column[]>;
  getHotColumns(limit?: number): Promise<Column[]>;
  getNewColumns(limit?: number): Promise<Column[]>;
  getColumnsByCategory(categoryId: number): Promise<Column[]>;
  searchColumns(query: string, searchType?: 'id' | 'name'): Promise<Column[]>;
  createColumn(column: InsertColumn): Promise<Column>;
  updateColumn(id: number, column: Partial<Column>): Promise<Column | undefined>;
  deleteColumn(id: number): Promise<boolean>;
  
  // Knowledge base methods
  getKnowledgeBasesByCreator(creatorId: number): Promise<KnowledgeBase[]>;
  getKnowledgeBase(id: number): Promise<KnowledgeBase | undefined>;
  createKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBase(id: number, kb: Partial<KnowledgeBase>): Promise<KnowledgeBase | undefined>;
  deleteKnowledgeBase(id: number): Promise<boolean>;
  
  // Folder methods
  getFoldersByKnowledgeBase(kbId: number): Promise<Folder[]>;
  getFolder(id: number): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  
  // Markdown file methods
  getMarkdownFilesByKnowledgeBase(kbId: number): Promise<MarkdownFile[]>;
  getMarkdownFilesByFolder(folderId: number): Promise<MarkdownFile[]>;
  getMarkdownFile(id: number): Promise<MarkdownFile | undefined>;
  createMarkdownFile(file: InsertMarkdownFile): Promise<MarkdownFile>;
  updateMarkdownFile(id: number, file: Partial<MarkdownFile>): Promise<MarkdownFile | undefined>;
  deleteMarkdownFile(id: number): Promise<boolean>;
  
  // Article methods
  getArticlesByColumn(columnId: number): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<Article>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  
  // Subscription methods
  getSubscriptionsByUser(userId: number): Promise<Subscription[]>;
  getSubscriptionsByColumn(columnId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  deleteSubscription(userId: number, columnId: number): Promise<boolean>;
  isSubscribed(userId: number, columnId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private columns: Map<number, Column>;
  private knowledgeBases: Map<number, KnowledgeBase>;
  private folders: Map<number, Folder>;
  private markdownFiles: Map<number, MarkdownFile>;
  private articles: Map<number, Article>;
  private subscriptions: Map<number, Subscription>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private columnIdCounter: number;
  private kbIdCounter: number;
  private folderIdCounter: number;
  private fileIdCounter: number;
  private articleIdCounter: number;
  private subscriptionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.columns = new Map();
    this.knowledgeBases = new Map();
    this.folders = new Map();
    this.markdownFiles = new Map();
    this.articles = new Map();
    this.subscriptions = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.columnIdCounter = 1;
    this.kbIdCounter = 1;
    this.folderIdCounter = 1;
    this.fileIdCounter = 1;
    this.articleIdCounter = 1;
    this.subscriptionIdCounter = 1;
    
    // Initialize with sample categories
    this.initializeCategories();
  }
  
  private initializeCategories() {
    const sampleCategories = [
      { name: "Blockchain", icon: "chart-bar", slug: "blockchain" },
      { name: "DeFi", icon: "box", slug: "defi" },
      { name: "NFT", icon: "puzzle", slug: "nft" },
      { name: "Metaverse", icon: "globe", slug: "metaverse" },
      { name: "Security", icon: "shield", slug: "security" },
      { name: "Zero Knowledge Proofs", icon: "zap", slug: "zero-knowledge" }
    ];
    
    sampleCategories.forEach(cat => {
      this.createCategory(cat);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Column methods
  async getColumn(id: number): Promise<Column | undefined> {
    return this.columns.get(id);
  }
  
  async getColumnsByCreator(creatorId: number): Promise<Column[]> {
    return Array.from(this.columns.values()).filter(col => col.creatorId === creatorId);
  }
  
  async getHotColumns(limit: number = 10): Promise<Column[]> {
    return Array.from(this.columns.values())
      .filter(col => col.isPublished && col.isHot)
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, limit);
  }
  
  async getNewColumns(limit: number = 10): Promise<Column[]> {
    return Array.from(this.columns.values())
      .filter(col => col.isPublished && col.isNew)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async getColumnsByCategory(categoryId: number): Promise<Column[]> {
    return Array.from(this.columns.values())
      .filter(col => col.isPublished && col.categoryId === categoryId);
  }
  
  async searchColumns(query: string, searchType: 'id' | 'name' = 'name'): Promise<Column[]> {
    const lowerQuery = query.toLowerCase();
    
    // For ID search type, we need to parse the query as a number
    const potentialId = parseInt(query);
    const isValidId = !isNaN(potentialId);
    
    return Array.from(this.columns.values())
      .filter(col => {
        // Default behavior - only return published columns
        // Exception: when using ID search and there's a direct match
        const isIdDirectMatch = searchType === 'id' && isValidId && col.id === potentialId;
        if (!col.isPublished && !isIdDirectMatch) {
          return false;
        }
        
        // If specifically searching by ID
        if (searchType === 'id') {
          // Only match if the ID is valid and matches exactly
          return isValidId && col.id === potentialId;
        }
        
        // If searching by name (default)
        return col.title.toLowerCase().includes(lowerQuery) || 
               col.description.toLowerCase().includes(lowerQuery);
      });
  }
  
  async createColumn(insertColumn: InsertColumn): Promise<Column> {
    const id = this.columnIdCounter++;
    const now = new Date();
    const column: Column = { 
      ...insertColumn, 
      id, 
      articleCount: 0, 
      subscriberCount: 0, 
      rating: 0, 
      createdAt: now, 
      updatedAt: now 
    };
    this.columns.set(id, column);
    return column;
  }
  
  async updateColumn(id: number, columnData: Partial<Column>): Promise<Column | undefined> {
    const column = await this.getColumn(id);
    if (!column) return undefined;
    
    const updatedColumn = { 
      ...column, 
      ...columnData, 
      updatedAt: new Date() 
    };
    this.columns.set(id, updatedColumn);
    return updatedColumn;
  }
  
  async deleteColumn(id: number): Promise<boolean> {
    return this.columns.delete(id);
  }

  // Knowledge base methods
  async getKnowledgeBasesByCreator(creatorId: number): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBases.values()).filter(kb => kb.creatorId === creatorId);
  }
  
  async getKnowledgeBase(id: number): Promise<KnowledgeBase | undefined> {
    return this.knowledgeBases.get(id);
  }
  
  async createKnowledgeBase(insertKB: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const id = this.kbIdCounter++;
    const now = new Date();
    const kb: KnowledgeBase = { ...insertKB, id, createdAt: now };
    this.knowledgeBases.set(id, kb);
    return kb;
  }
  
  async updateKnowledgeBase(id: number, kbData: Partial<KnowledgeBase>): Promise<KnowledgeBase | undefined> {
    const kb = await this.getKnowledgeBase(id);
    if (!kb) return undefined;
    
    const updatedKB = { ...kb, ...kbData };
    this.knowledgeBases.set(id, updatedKB);
    return updatedKB;
  }
  
  async deleteKnowledgeBase(id: number): Promise<boolean> {
    return this.knowledgeBases.delete(id);
  }

  // Folder methods
  async getFoldersByKnowledgeBase(kbId: number): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(folder => folder.knowledgeBaseId === kbId);
  }
  
  async getFolder(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }
  
  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = this.folderIdCounter++;
    const now = new Date();
    const folder: Folder = { ...insertFolder, id, createdAt: now };
    this.folders.set(id, folder);
    return folder;
  }
  
  async updateFolder(id: number, folderData: Partial<Folder>): Promise<Folder | undefined> {
    const folder = await this.getFolder(id);
    if (!folder) return undefined;
    
    const updatedFolder = { ...folder, ...folderData };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }
  
  async deleteFolder(id: number): Promise<boolean> {
    return this.folders.delete(id);
  }

  // Markdown file methods
  async getMarkdownFilesByKnowledgeBase(kbId: number): Promise<MarkdownFile[]> {
    return Array.from(this.markdownFiles.values()).filter(file => file.knowledgeBaseId === kbId);
  }
  
  async getMarkdownFilesByFolder(folderId: number): Promise<MarkdownFile[]> {
    return Array.from(this.markdownFiles.values()).filter(file => file.folderId === folderId);
  }
  
  async getMarkdownFile(id: number): Promise<MarkdownFile | undefined> {
    return this.markdownFiles.get(id);
  }
  
  async createMarkdownFile(insertFile: InsertMarkdownFile): Promise<MarkdownFile> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const file: MarkdownFile = { ...insertFile, id, createdAt: now, updatedAt: now };
    this.markdownFiles.set(id, file);
    return file;
  }
  
  async updateMarkdownFile(id: number, fileData: Partial<MarkdownFile>): Promise<MarkdownFile | undefined> {
    const file = await this.getMarkdownFile(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...fileData, updatedAt: new Date() };
    this.markdownFiles.set(id, updatedFile);
    return updatedFile;
  }
  
  async deleteMarkdownFile(id: number): Promise<boolean> {
    return this.markdownFiles.delete(id);
  }

  // Article methods
  async getArticlesByColumn(columnId: number): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter(article => article.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }
  
  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = this.articleIdCounter++;
    const now = new Date();
    const article: Article = { ...insertArticle, id, createdAt: now };
    this.articles.set(id, article);
    
    // Update article count for the column
    const column = await this.getColumn(insertArticle.columnId);
    if (column) {
      await this.updateColumn(column.id, { articleCount: column.articleCount + 1 });
    }
    
    return article;
  }
  
  async updateArticle(id: number, articleData: Partial<Article>): Promise<Article | undefined> {
    const article = await this.getArticle(id);
    if (!article) return undefined;
    
    const updatedArticle = { ...article, ...articleData };
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }
  
  async deleteArticle(id: number): Promise<boolean> {
    const article = await this.getArticle(id);
    if (!article) return false;
    
    const result = this.articles.delete(id);
    
    // Update article count for the column
    if (result) {
      const column = await this.getColumn(article.columnId);
      if (column && column.articleCount > 0) {
        await this.updateColumn(column.id, { articleCount: column.articleCount - 1 });
      }
    }
    
    return result;
  }

  // Subscription methods
  async getSubscriptionsByUser(userId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => sub.userId === userId);
  }
  
  async getSubscriptionsByColumn(columnId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => sub.columnId === columnId);
  }
  
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    // Check if already subscribed
    const existing = await this.isSubscribed(insertSubscription.userId, insertSubscription.columnId);
    if (existing) {
      throw new Error("User is already subscribed to this column");
    }
    
    const id = this.subscriptionIdCounter++;
    const now = new Date();
    const subscription: Subscription = { ...insertSubscription, id, subscriptionDate: now };
    this.subscriptions.set(id, subscription);
    
    // Update subscriber count for the column
    const column = await this.getColumn(insertSubscription.columnId);
    if (column) {
      await this.updateColumn(column.id, { subscriberCount: column.subscriberCount + 1 });
    }
    
    return subscription;
  }
  
  async deleteSubscription(userId: number, columnId: number): Promise<boolean> {
    const subscription = Array.from(this.subscriptions.values()).find(
      sub => sub.userId === userId && sub.columnId === columnId
    );
    
    if (!subscription) return false;
    
    const result = this.subscriptions.delete(subscription.id);
    
    // Update subscriber count for the column
    if (result) {
      const column = await this.getColumn(columnId);
      if (column && column.subscriberCount > 0) {
        await this.updateColumn(column.id, { subscriberCount: column.subscriberCount - 1 });
      }
    }
    
    return result;
  }
  
  async isSubscribed(userId: number, columnId: number): Promise<boolean> {
    return Array.from(this.subscriptions.values()).some(
      sub => sub.userId === userId && sub.columnId === columnId
    );
  }
}

export const storage = new MemStorage();
