import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { 
  insertUserSchema, 
  insertCategorySchema,
  insertColumnSchema,
  insertKnowledgeBaseSchema,
  insertFolderSchema,
  insertMarkdownFileSchema,
  insertArticleSchema,
  insertSubscriptionSchema
} from "@shared/schema";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "cyber-pearl-rock-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new SessionStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );

  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect username or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Helper middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Helper middleware to check if user is a creator
  const isCreator = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated() && (req.user as any)?.isCreator) {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Creator access required" });
  };

  // Handle validation errors
  const validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: any) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors 
          });
        } else {
          next(error);
        }
      }
    };
  };

  // Auth Routes
  app.post("/api/auth/register", validateRequest(insertUserSchema), async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user with hashed password
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        isCreator: false
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error creating user", error: (error as Error).message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
      
      req.logIn(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/current-user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // User Routes
  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own profile
      if (userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
      }
      
      // Don't allow updating username, email, or password through this endpoint
      const { username, email, password, isCreator, ...updateData } = req.body;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user", error: (error as Error).message });
    }
  });

  app.post("/api/users/become-creator", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const updatedUser = await storage.updateUser(userId, { isCreator: true });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user", error: (error as Error).message });
    }
  });

  // Category Routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories", error: (error as Error).message });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Error fetching category", error: (error as Error).message });
    }
  });

  // Column Routes
  app.get("/api/columns/hot", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const columns = await storage.getHotColumns(limit);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching hot columns", error: (error as Error).message });
    }
  });

  app.get("/api/columns/new", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const columns = await storage.getNewColumns(limit);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching new columns", error: (error as Error).message });
    }
  });

  app.get("/api/columns/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const searchType = req.query.type as 'id' | 'name' || 'name';
      
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      // Pass the search type parameter to the storage method
      const columns = await storage.searchColumns(query, searchType);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Error searching columns", error: (error as Error).message });
    }
  });

  app.get("/api/columns/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const columns = await storage.getColumnsByCategory(categoryId);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching columns by category", error: (error as Error).message });
    }
  });

  app.get("/api/columns/creator/:creatorId", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const columns = await storage.getColumnsByCreator(creatorId);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching creator columns", error: (error as Error).message });
    }
  });

  app.get("/api/columns/:id", async (req, res) => {
    try {
      const columnId = parseInt(req.params.id);
      const column = await storage.getColumn(columnId);
      
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      
      // Check if column is published or user is the creator
      const isCreator = req.isAuthenticated() && (req.user as any).id === column.creatorId;
      if (!column.isPublished && !isCreator) {
        return res.status(403).json({ message: "This column is not published" });
      }
      
      res.json(column);
    } catch (error) {
      res.status(500).json({ message: "Error fetching column", error: (error as Error).message });
    }
  });

  app.post("/api/columns", isCreator, validateRequest(insertColumnSchema), async (req, res) => {
    try {
      const creatorId = (req.user as any).id;
      
      const column = await storage.createColumn({
        ...req.body,
        creatorId
      });
      
      res.status(201).json(column);
    } catch (error) {
      res.status(500).json({ message: "Error creating column", error: (error as Error).message });
    }
  });

  app.patch("/api/columns/:id", isCreator, async (req, res) => {
    try {
      const columnId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if column exists and belongs to this creator
      const column = await storage.getColumn(columnId);
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      
      if (column.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this column" });
      }
      
      const updatedColumn = await storage.updateColumn(columnId, req.body);
      res.json(updatedColumn);
    } catch (error) {
      res.status(500).json({ message: "Error updating column", error: (error as Error).message });
    }
  });

  app.delete("/api/columns/:id", isCreator, async (req, res) => {
    try {
      const columnId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if column exists and belongs to this creator
      const column = await storage.getColumn(columnId);
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      
      if (column.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this column" });
      }
      
      const deleted = await storage.deleteColumn(columnId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete column" });
      }
      
      res.json({ message: "Column deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting column", error: (error as Error).message });
    }
  });

  // Knowledge Base Routes
  app.get("/api/knowledge-bases/creator", isCreator, async (req, res) => {
    try {
      const creatorId = (req.user as any).id;
      const kbs = await storage.getKnowledgeBasesByCreator(creatorId);
      res.json(kbs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching knowledge bases", error: (error as Error).message });
    }
  });

  app.get("/api/knowledge-bases/:id", isCreator, async (req, res) => {
    try {
      const kbId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      const kb = await storage.getKnowledgeBase(kbId);
      if (!kb) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      // Ensure the creator owns this knowledge base
      if (kb.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      res.json(kb);
    } catch (error) {
      res.status(500).json({ message: "Error fetching knowledge base", error: (error as Error).message });
    }
  });

  app.post("/api/knowledge-bases", isCreator, validateRequest(insertKnowledgeBaseSchema), async (req, res) => {
    try {
      const creatorId = (req.user as any).id;
      
      const kb = await storage.createKnowledgeBase({
        ...req.body,
        creatorId
      });
      
      res.status(201).json(kb);
    } catch (error) {
      res.status(500).json({ message: "Error creating knowledge base", error: (error as Error).message });
    }
  });

  app.patch("/api/knowledge-bases/:id", isCreator, async (req, res) => {
    try {
      const kbId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if KB exists and belongs to this creator
      const kb = await storage.getKnowledgeBase(kbId);
      if (!kb) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      if (kb.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const updatedKB = await storage.updateKnowledgeBase(kbId, req.body);
      res.json(updatedKB);
    } catch (error) {
      res.status(500).json({ message: "Error updating knowledge base", error: (error as Error).message });
    }
  });

  app.delete("/api/knowledge-bases/:id", isCreator, async (req, res) => {
    try {
      const kbId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if KB exists and belongs to this creator
      const kb = await storage.getKnowledgeBase(kbId);
      if (!kb) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      if (kb.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const deleted = await storage.deleteKnowledgeBase(kbId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete knowledge base" });
      }
      
      res.json({ message: "Knowledge base deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting knowledge base", error: (error as Error).message });
    }
  });

  // Folder Routes
  app.get("/api/knowledge-bases/:kbId/folders", isCreator, async (req, res) => {
    try {
      const kbId = parseInt(req.params.kbId);
      const creatorId = (req.user as any).id;
      
      // Check if KB exists and belongs to this creator
      const kb = await storage.getKnowledgeBase(kbId);
      if (!kb) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      if (kb.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const folders = await storage.getFoldersByKnowledgeBase(kbId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching folders", error: (error as Error).message });
    }
  });

  app.post("/api/folders", isCreator, validateRequest(insertFolderSchema), async (req, res) => {
    try {
      const creatorId = (req.user as any).id;
      
      // Check if KB exists and belongs to this creator
      const kb = await storage.getKnowledgeBase(req.body.knowledgeBaseId);
      if (!kb) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      if (kb.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const folder = await storage.createFolder(req.body);
      res.status(201).json(folder);
    } catch (error) {
      res.status(500).json({ message: "Error creating folder", error: (error as Error).message });
    }
  });

  app.patch("/api/folders/:id", isCreator, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if folder exists
      const folder = await storage.getFolder(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Check if KB belongs to this creator
      const kb = await storage.getKnowledgeBase(folder.knowledgeBaseId);
      if (kb?.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const updatedFolder = await storage.updateFolder(folderId, req.body);
      res.json(updatedFolder);
    } catch (error) {
      res.status(500).json({ message: "Error updating folder", error: (error as Error).message });
    }
  });

  app.delete("/api/folders/:id", isCreator, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if folder exists
      const folder = await storage.getFolder(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Check if KB belongs to this creator
      const kb = await storage.getKnowledgeBase(folder.knowledgeBaseId);
      if (kb?.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const deleted = await storage.deleteFolder(folderId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete folder" });
      }
      
      res.json({ message: "Folder deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting folder", error: (error as Error).message });
    }
  });

  // Markdown File Routes
  app.get("/api/knowledge-bases/:kbId/files", isCreator, async (req, res) => {
    try {
      const kbId = parseInt(req.params.kbId);
      const creatorId = (req.user as any).id;
      
      // Check if KB exists and belongs to this creator
      const kb = await storage.getKnowledgeBase(kbId);
      if (!kb) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      if (kb.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const files = await storage.getMarkdownFilesByKnowledgeBase(kbId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Error fetching files", error: (error as Error).message });
    }
  });

  app.get("/api/folders/:folderId/files", isCreator, async (req, res) => {
    try {
      const folderId = parseInt(req.params.folderId);
      const creatorId = (req.user as any).id;
      
      // Check if folder exists
      const folder = await storage.getFolder(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Check if KB belongs to this creator
      const kb = await storage.getKnowledgeBase(folder.knowledgeBaseId);
      if (kb?.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const files = await storage.getMarkdownFilesByFolder(folderId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Error fetching files", error: (error as Error).message });
    }
  });

  app.get("/api/files/:id", isCreator, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      const file = await storage.getMarkdownFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if KB belongs to this creator
      const kb = await storage.getKnowledgeBase(file.knowledgeBaseId);
      if (kb?.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Error fetching file", error: (error as Error).message });
    }
  });

  app.post("/api/files", isCreator, validateRequest(insertMarkdownFileSchema), async (req, res) => {
    try {
      const creatorId = (req.user as any).id;
      
      // Check if KB exists and belongs to this creator
      const kb = await storage.getKnowledgeBase(req.body.knowledgeBaseId);
      if (!kb) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      if (kb.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const file = await storage.createMarkdownFile(req.body);
      res.status(201).json(file);
    } catch (error) {
      res.status(500).json({ message: "Error creating file", error: (error as Error).message });
    }
  });

  app.patch("/api/files/:id", isCreator, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if file exists
      const file = await storage.getMarkdownFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if KB belongs to this creator
      const kb = await storage.getKnowledgeBase(file.knowledgeBaseId);
      if (kb?.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const updatedFile = await storage.updateMarkdownFile(fileId, req.body);
      res.json(updatedFile);
    } catch (error) {
      res.status(500).json({ message: "Error updating file", error: (error as Error).message });
    }
  });

  app.delete("/api/files/:id", isCreator, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if file exists
      const file = await storage.getMarkdownFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if KB belongs to this creator
      const kb = await storage.getKnowledgeBase(file.knowledgeBaseId);
      if (kb?.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this knowledge base" });
      }
      
      const deleted = await storage.deleteMarkdownFile(fileId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete file" });
      }
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting file", error: (error as Error).message });
    }
  });

  // Article Routes
  app.get("/api/columns/:columnId/articles", async (req, res) => {
    try {
      const columnId = parseInt(req.params.columnId);
      const column = await storage.getColumn(columnId);
      
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      
      // Get articles for this column
      const articles = await storage.getArticlesByColumn(columnId);
      
      // If not published and not the creator, only return published articles
      const isCreator = req.isAuthenticated() && (req.user as any).id === column.creatorId;
      if (!isCreator) {
        return res.json(articles.filter(article => article.isPublished));
      }
      
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching articles", error: (error as Error).message });
    }
  });

  app.post("/api/articles", isCreator, validateRequest(insertArticleSchema), async (req, res) => {
    try {
      const creatorId = (req.user as any).id;
      
      // Check if column exists and belongs to this creator
      const column = await storage.getColumn(req.body.columnId);
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      
      if (column.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this column" });
      }
      
      // If markdownFileId is provided, check if it belongs to the creator
      if (req.body.markdownFileId) {
        const file = await storage.getMarkdownFile(req.body.markdownFileId);
        if (!file) {
          return res.status(404).json({ message: "Markdown file not found" });
        }
        
        const kb = await storage.getKnowledgeBase(file.knowledgeBaseId);
        if (kb?.creatorId !== creatorId) {
          return res.status(403).json({ message: "Forbidden: You don't own this markdown file" });
        }
      }
      
      const article = await storage.createArticle(req.body);
      res.status(201).json(article);
    } catch (error) {
      res.status(500).json({ message: "Error creating article", error: (error as Error).message });
    }
  });

  app.patch("/api/articles/:id", isCreator, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if article exists
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if column belongs to this creator
      const column = await storage.getColumn(article.columnId);
      if (column?.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this column" });
      }
      
      // If changing markdownFileId, check if it belongs to the creator
      if (req.body.markdownFileId && req.body.markdownFileId !== article.markdownFileId) {
        const file = await storage.getMarkdownFile(req.body.markdownFileId);
        if (!file) {
          return res.status(404).json({ message: "Markdown file not found" });
        }
        
        const kb = await storage.getKnowledgeBase(file.knowledgeBaseId);
        if (kb?.creatorId !== creatorId) {
          return res.status(403).json({ message: "Forbidden: You don't own this markdown file" });
        }
      }
      
      const updatedArticle = await storage.updateArticle(articleId, req.body);
      res.json(updatedArticle);
    } catch (error) {
      res.status(500).json({ message: "Error updating article", error: (error as Error).message });
    }
  });

  app.delete("/api/articles/:id", isCreator, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const creatorId = (req.user as any).id;
      
      // Check if article exists
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if column belongs to this creator
      const column = await storage.getColumn(article.columnId);
      if (column?.creatorId !== creatorId) {
        return res.status(403).json({ message: "Forbidden: You don't own this column" });
      }
      
      const deleted = await storage.deleteArticle(articleId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete article" });
      }
      
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting article", error: (error as Error).message });
    }
  });

  // Subscription Routes
  app.get("/api/users/current/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptions = await storage.getSubscriptionsByUser(userId);
      
      // Get the full column data for each subscription
      const subscribedColumns = await Promise.all(
        subscriptions.map(async sub => {
          const column = await storage.getColumn(sub.columnId);
          return column;
        })
      );
      
      // Filter out any null values (columns that no longer exist)
      res.json(subscribedColumns.filter(Boolean));
    } catch (error) {
      res.status(500).json({ message: "Error fetching subscriptions", error: (error as Error).message });
    }
  });

  // My Columns - Get columns created by the current user
  app.get("/api/users/current/columns", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const columns = await storage.getColumnsByCreator(userId);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user columns", error: (error as Error).message });
    }
  });

  // My Knowledge Bases - Get knowledge bases created by the current user
  app.get("/api/users/current/knowledge-bases", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const knowledgeBases = await storage.getKnowledgeBasesByCreator(userId);
      res.json(knowledgeBases);
    } catch (error) {
      res.status(500).json({ message: "Error fetching knowledge bases", error: (error as Error).message });
    }
  });

  app.post("/api/subscriptions", isAuthenticated, validateRequest(insertSubscriptionSchema), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check if column exists
      const column = await storage.getColumn(req.body.columnId);
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      
      // Check if column is published
      if (!column.isPublished) {
        return res.status(403).json({ message: "Cannot subscribe to unpublished column" });
      }
      
      // Create subscription
      const subscription = await storage.createSubscription({
        userId,
        columnId: req.body.columnId
      });
      
      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Error creating subscription", error: (error as Error).message });
    }
  });

  app.delete("/api/subscriptions/:columnId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const columnId = parseInt(req.params.columnId);
      
      const deleted = await storage.deleteSubscription(userId, columnId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json({ message: "Unsubscribed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting subscription", error: (error as Error).message });
    }
  });

  app.get("/api/subscriptions/check/:columnId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const columnId = parseInt(req.params.columnId);
      
      const isSubscribed = await storage.isSubscribed(userId, columnId);
      
      res.json({ isSubscribed });
    } catch (error) {
      res.status(500).json({ message: "Error checking subscription", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
