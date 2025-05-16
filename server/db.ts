import 'dotenv/config';
import { MongoClient, Db } from "mongodb";
import * as schema from "@shared/schema";

let db: Db | null = null;
let mongoClient: MongoClient | null = null;

async function connectToMongo() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not set");
  }
  if (mongoClient && db) {
    // Already connected
    return db;
  }
  mongoClient = new MongoClient(process.env.MONGO_URI);
  await mongoClient.connect();
  db = mongoClient.db();
  console.log("Connected to MongoDB");
  return db;
}

async function initializeDb() {
  try {
    await connectToMongo();
    console.log("Successfully connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

function getDb(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDb() first.");
  }
  return db;
}

// Graceful shutdown
process.on("SIGINT", async () => {
  if (mongoClient) {
    await mongoClient.close();
    console.log("MongoDB connection closed");
  }
  process.exit(0);
});

export { getDb, initializeDb };
