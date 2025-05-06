import { db } from "@db";
import { users, chatSessions, messages, documents, User, ChatSession, Message, Document } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export const storage = {
  // === User Methods ===
  async getAllUsers(): Promise<User[]> {
    return await db.query.users.findMany({
      orderBy: desc(users.createdAt),
    });
  },

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return result;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return result;
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.username, username),
    });
    return result;
  },

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    });
    return result;
  },

  async createUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  async updateUser(userId: number, updates: any): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  },

  async incrementUserMessageCount(userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      await db.update(users)
        .set({
          messageCount: user.messageCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  },

  async updateUserStripeInfo(userId: number, { stripeCustomerId, stripeSubscriptionId }: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  },

  // === Chat Methods ===
  async getAllChats(): Promise<ChatSession[]> {
    return await db.query.chatSessions.findMany({
      orderBy: desc(chatSessions.createdAt),
      with: {
        user: true,
        messages: {
          limit: 1,
          orderBy: desc(messages.createdAt),
        },
      },
    });
  },

  async getChatsByUserId(userId: number): Promise<ChatSession[]> {
    return await db.query.chatSessions.findMany({
      where: eq(chatSessions.userId, userId),
      orderBy: desc(chatSessions.updatedAt),
    });
  },

  async getChatById(chatId: number): Promise<ChatSession | undefined> {
    return await db.query.chatSessions.findFirst({
      where: eq(chatSessions.id, chatId),
    });
  },

  async createChat(chatData: any): Promise<ChatSession> {
    const [chat] = await db.insert(chatSessions).values(chatData).returning();
    return chat;
  },

  async updateChat(chatId: number, updates: any): Promise<ChatSession> {
    const [updatedChat] = await db.update(chatSessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, chatId))
      .returning();
    return updatedChat;
  },

  async deleteChat(chatId: number): Promise<void> {
    // First delete all messages in the chat
    await db.delete(messages).where(eq(messages.chatId, chatId));
    // Then delete the chat itself
    await db.delete(chatSessions).where(eq(chatSessions.id, chatId));
  },

  // === Message Methods ===
  async getMessagesByChatId(chatId: number): Promise<Message[]> {
    return await db.query.messages.findMany({
      where: eq(messages.chatId, chatId),
      orderBy: asc(messages.createdAt),
    });
  },

  async createMessage(messageData: any): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    
    // Update the chat's updatedAt timestamp
    await db.update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, messageData.chatId));
      
    return message;
  },

  // === Document Methods ===
  async getAllDocuments(): Promise<Document[]> {
    return await db.query.documents.findMany({
      orderBy: desc(documents.createdAt),
      with: {
        uploadedBy: true,
      },
    });
  },

  async getDocumentById(documentId: number): Promise<Document | undefined> {
    return await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });
  },

  async createDocument(documentData: any): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  },

  async deleteDocument(documentId: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, documentId));
  },
};
