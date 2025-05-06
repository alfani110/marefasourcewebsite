import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "@db";
import { users, messages, chatSessions, documents, insertUserSchema, insertMessageSchema, insertChatSessionSchema, insertDocumentSchema } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import multer from "multer";
import OpenAI from "openai";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { fromZodError } from "zod-validation-error";
import pgSimple from "connect-pg-simple";

// Setup OpenAI client
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Setup Stripe client
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// File upload configuration
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow PDFs, Word docs, and text files
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.') as any, false);
    }
  }
});

// System prompts for different chat modes
const buildSystemPrompt = (category: string): string => {
  switch (category) {
    case 'ahkam':
      return `You are Ahkam 101, an AI assistant from Mārefa Source dedicated to providing accurate information about Islamic rulings and practices.
      
      Guidelines for your responses:
      1. Base your answers on authentic Islamic sources, primarily the Quran and Hadith
      2. When relevant, mention different scholarly opinions across major schools of thought (Hanafi, Maliki, Shafi'i, Hanbali)
      3. Provide evidence for your answers when possible
      4. Be respectful and educational in tone
      5. Clarify when matters are disputed among scholars
      6. If a question is beyond your knowledge or contains misconceptions, politely explain
      7. Start responses with "As-Salaam-Alaykum" if beginning a conversation
      8. Do not make up information or references
      
      Your aim is to provide educational insights about Islamic rulings, not to give personal religious verdicts (fatwas).`;
      
    case 'sukoon':
      return `You are Sukoon, an Islamic therapeutic AI assistant from Mārefa Source designed to provide emotional and mental wellbeing support within an Islamic framework.
      
      Guidelines for your responses:
      1. Provide compassionate, empathetic responses grounded in Islamic teachings
      2. Incorporate relevant Quranic verses, hadiths, and wisdom from Islamic tradition when appropriate
      3. Focus on hope, resilience, and spiritual growth
      4. Suggest practical coping strategies that align with Islamic values
      5. Acknowledge the importance of professional help when appropriate
      6. Be respectful of the person's emotional state and struggles
      7. Start responses with "As-Salaam-Alaykum" if beginning a conversation
      8. Never claim to replace professional mental health services
      
      Your aim is to provide comfort, perspective, and spiritual support while encouraging seeking professional help when needed.`;
      
    case 'research':
      return `You are in Research Mode for Mārefa Source, an advanced Islamic knowledge research assistant with access to a scholarly database.
      
      Guidelines for your responses:
      1. Provide detailed, academic-level responses to questions about Islamic history, theology, jurisprudence, and civilization
      2. Include relevant citations and references from the Islamic scholarly tradition
      3. Present multiple viewpoints and scholarly opinions when appropriate
      4. Maintain academic rigor while keeping explanations accessible
      5. When analyzing primary texts, consider historical context and scholarly interpretations
      6. Highlight key debates and developments in Islamic intellectual history
      7. Start responses with "As-Salaam-Alaykum" if beginning a conversation
      8. When referencing available documents in the database, provide proper citations
      
      Your aim is to provide substantive, well-researched information that reflects the depth and sophistication of Islamic intellectual tradition.`;
      
    default:
      return "You are an AI assistant from Mārefa Source. Provide helpful, accurate information about Islamic topics. Start responses with 'As-Salaam-Alaykum' if beginning a conversation.";
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure PostgreSQL session store
  const PgStore = pgSimple(session);
  
  // Configure session middleware
  app.use(
    session({
      store: new PgStore({
        conObject: {
          connectionString: process.env.DATABASE_URL,
        },
      }),
      secret: process.env.SESSION_SECRET || 'marefasource-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  // Initialize passport and session
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
          }
          
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          
          // Remove password before serializing
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        return done(null, false);
      }
      
      // Remove password before sending to client
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };

  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && (req.user as any).role === 'admin') {
      return next();
    }
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  };

  // === Auth Routes ===
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Remove password before sending to client
      const { password: _, ...userWithoutPassword } = newUser;
      
      // Log in the user automatically
      req.login(userWithoutPassword, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error during login after registration' });
        }
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json(req.user);
  });

  // === Chat Routes ===
  app.get('/api/chats', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const chats = await storage.getChatsByUserId(userId);
      res.json(chats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ message: 'Error fetching chats' });
    }
  });

  app.post('/api/chats', async (req, res) => {
    try {
      const { category = 'ahkam' } = req.body;
      const userId = req.user ? (req.user as any).id : null;
      
      // Validate category
      if (!['ahkam', 'sukoon', 'research'].includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      
      // If user is trying to use research mode without proper subscription
      if (category === 'research' && userId) {
        const user = await storage.getUserById(userId);
        if (user && (user.subscriptionTier === 'free' || user.subscriptionTier === 'basic')) {
          return res.status(403).json({ message: 'Research mode requires a Research subscription' });
        }
      }
      
      const newChat = await storage.createChat({
        userId,
        category,
      });
      
      res.status(201).json(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({ message: 'Error creating chat' });
    }
  });

  app.get('/api/chats/:id', async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChatById(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      // Check if user is authorized to access this chat
      if (chat.userId && req.user && (req.user as any).id !== chat.userId) {
        return res.status(403).json({ message: 'Unauthorized to access this chat' });
      }
      
      res.json(chat);
    } catch (error) {
      console.error('Error fetching chat:', error);
      res.status(500).json({ message: 'Error fetching chat' });
    }
  });

  app.patch('/api/chats/:id', async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const { title, category } = req.body;
      
      const chat = await storage.getChatById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      // Check if user is authorized to update this chat
      if (chat.userId && req.user && (req.user as any).id !== chat.userId) {
        return res.status(403).json({ message: 'Unauthorized to update this chat' });
      }
      
      const updatedChat = await storage.updateChat(chatId, { title, category });
      res.json(updatedChat);
    } catch (error) {
      console.error('Error updating chat:', error);
      res.status(500).json({ message: 'Error updating chat' });
    }
  });

  app.delete('/api/chats/:id', isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      const chat = await storage.getChatById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      // Check if user is authorized to delete this chat
      if (chat.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to delete this chat' });
      }
      
      await storage.deleteChat(chatId);
      res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ message: 'Error deleting chat' });
    }
  });

  app.get('/api/chats/:id/messages', async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      
      const chat = await storage.getChatById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      // Check if user is authorized to access this chat's messages
      if (chat.userId && req.user && (req.user as any).id !== chat.userId) {
        return res.status(403).json({ message: 'Unauthorized to access these messages' });
      }
      
      const messages = await storage.getMessagesByChatId(chatId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });

  app.post('/api/chats/:id/messages', async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const { content, category } = req.body;
      const userId = req.user ? (req.user as any).id : null;
      
      if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      // Get the chat to verify permissions and get category
      const chat = await storage.getChatById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      // If this is an authenticated user's chat, check permissions
      if (chat.userId && req.user && (req.user as any).id !== chat.userId) {
        return res.status(403).json({ message: 'Unauthorized to post in this chat' });
      }
      
      // If user is authenticated, check message limits for free tier
      if (userId) {
        const user = await storage.getUserById(userId);
        if (user && user.subscriptionTier === 'free' && user.messageCount >= 50) {
          return res.status(403).json({ message: 'Free tier message limit reached. Please upgrade your plan.' });
        }
      } else {
        // For unauthenticated users, fetch chat history to count messages
        const chatMessages = await storage.getMessagesByChatId(chatId);
        const userMessages = chatMessages.filter(msg => msg.sender === 'user');
        if (userMessages.length >= 5) {
          return res.status(403).json({ message: 'Guest message limit reached. Please sign up to continue.' });
        }
      }
      
      // Create user message
      const userMessage = await storage.createMessage({
        chatId,
        content,
        sender: 'user',
      });
      
      // Increment user message count if authenticated
      if (userId) {
        await storage.incrementUserMessageCount(userId);
      }
      
      // Get chat history for context
      const chatHistory = await storage.getMessagesByChatId(chatId);
      
      // Format messages for OpenAI
      const formattedMessages = [
        { role: "system", content: buildSystemPrompt(chat.category) },
        ...chatHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      ];
      
      // Generate AI response
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o", // newest model
        messages: formattedMessages as any,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      const aiMessageContent = aiResponse.choices[0].message.content || "I apologize, but I'm having trouble generating a response right now.";
      
      // Save AI response to database
      const aiMessage = await storage.createMessage({
        chatId,
        content: aiMessageContent,
        sender: 'ai',
      });
      
      res.json(aiMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Error sending message' });
    }
  });

  // === Admin Routes ===
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  app.patch('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { subscriptionTier, role } = req.body;
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.updateUser(userId, { subscriptionTier, role });
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user' });
    }
  });

  app.get('/api/admin/chats', isAdmin, async (req, res) => {
    try {
      const chats = await storage.getAllChats();
      res.json(chats);
    } catch (error) {
      console.error('Error fetching all chats:', error);
      res.status(500).json({ message: 'Error fetching all chats' });
    }
  });

  app.get('/api/admin/documents', isAdmin, async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Error fetching documents' });
    }
  });

  app.post('/api/admin/documents', isAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { title, author, category, description } = req.body;
      const uploadedById = (req.user as any).id;
      
      // Validate document data
      const documentData = {
        title,
        author,
        category,
        description: description || '',
        fileUrl: req.file.path,
        fileType: req.file.mimetype,
        uploadedById,
      };
      
      const validatedData = insertDocumentSchema.parse(documentData);
      
      // Create document record
      const newDocument = await storage.createDocument(validatedData);
      res.status(201).json(newDocument);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error('Error uploading document:', error);
      res.status(500).json({ message: 'Error uploading document' });
    }
  });

  app.delete('/api/admin/documents/:id', isAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      const document = await storage.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Delete file from filesystem
      if (document.fileUrl && fs.existsSync(document.fileUrl)) {
        fs.unlinkSync(document.fileUrl);
      }
      
      // Delete document record
      await storage.deleteDocument(documentId);
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  });

  // === Stripe Payment Routes ===
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById((req.user as any).id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { plan = 'basic' } = req.body;
      
      // Map plan to price ID
      const priceMap: Record<string, string> = {
        basic: process.env.STRIPE_PRICE_BASIC || 'price_basic',
        research: process.env.STRIPE_PRICE_RESEARCH || 'price_research',
        teams: process.env.STRIPE_PRICE_TEAMS || 'price_teams',
      };
      
      const priceId = priceMap[plan];
      if (!priceId) {
        return res.status(400).json({ message: 'Invalid subscription plan' });
      }
      
      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        // Retrieve current subscription
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        // If subscription is active and they want to change plans
        if (subscription.status === 'active') {
          // Update existing subscription with new plan
          await stripe.subscriptions.update(user.stripeSubscriptionId, {
            items: [{
              id: subscription.items.data[0].id,
              price: priceId,
            }],
          });
          
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
          });
        }
        
        // For expired subscriptions, create a new one
      }
      
      // Create or update customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        
        customerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update user with subscription info
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscription.id,
      });
      
      // Map plan name to subscription tier
      const tierMap: Record<string, string> = {
        basic: 'basic',
        research: 'research',
        teams: 'teams',
      };
      
      // Update user subscription tier
      await storage.updateUser(user.id, {
        subscriptionTier: tierMap[plan],
      });
      
      return res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      return res.status(400).json({ message: 'Error creating subscription' });
    }
  });

  // Webhook to handle subscription status updates
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: 'Missing Stripe signature or webhook secret' });
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        // Update user subscription status
        const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
        if (user) {
          if (subscription.status === 'active') {
            // Map Stripe product to your subscription tier
            const productId = subscription.items.data[0].price.product;
            
            // Get product to determine subscription level
            const product = await stripe.products.retrieve(productId as string);
            
            // Update user subscription tier based on product metadata or name
            const tierMap: Record<string, string> = {
              'Basic Plan': 'basic',
              'Research Plan': 'research',
              'Teams Plan': 'teams',
            };
            
            const tier = tierMap[product.name] || 'basic';
            
            await storage.updateUser(user.id, {
              subscriptionTier: tier,
            });
          } else if (subscription.status === 'canceled') {
            // Downgrade to free tier when subscription is canceled
            await storage.updateUser(user.id, {
              subscriptionTier: 'free',
            });
          }
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
