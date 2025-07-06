// Integration tests for FireMongo Bridge Extension
import { MongoClient, Db } from "mongodb";

// Helper function to check if MongoDB is available
async function isMongoDBAvailable(uri: string): Promise<boolean> {
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    await client.close();
    return true;
  } catch {
    return false;
  }
}

describe("FireMongo Bridge Integration Tests", () => {
  let mongoClient: MongoClient | null = null;
  let db: Db | null = null;
  const testDbName = "firemongo_test";
  let mongoAvailable = false;
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";

  beforeAll(async () => {
    mongoAvailable = await isMongoDBAvailable(mongoUri);
    if (mongoAvailable) {
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      db = mongoClient.db(testDbName);
    }
  });

  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  beforeEach(async () => {
    if (db) {
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        await db.collection(collection.name).deleteMany({});
      }
    }
  });

  const skipIfNoMongo = (fn: () => Promise<void>) => async () => {
    if (!mongoAvailable || !db) {
      console.warn("Skipping test: MongoDB not available");
      return;
    }
    await fn();
  };

  it(
    "should connect to MongoDB and perform basic operations",
    skipIfNoMongo(async () => {
      expect(mongoClient).toBeDefined();
      expect(db).toBeDefined();
      const testCollection = db!.collection("test_connection");
      await testCollection.insertOne({ test: "data" });
      const result = await testCollection.findOne({ test: "data" });
      expect(result).toEqual({ _id: expect.any(Object), test: "data" });
    })
  );

  it(
    "should handle bulk operations",
    skipIfNoMongo(async () => {
      const collection = db!.collection("bulk_test");
      const documents: any[] = [];
      for (let i = 0; i < 10; i++) {
        documents.push({
          _id: `doc${i}`,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          _firestore_id: `doc${i}`,
          _firestore_collection: "bulk_test",
          _firestore_path: `bulk_test/doc${i}`,
          _synced_at: new Date(),
        });
      }
      const result = await collection.insertMany(documents);
      expect(result.insertedCount).toBe(10);
      const count = await collection.countDocuments();
      expect(count).toBe(10);
    })
  );

  it(
    "should create indexes when specified",
    skipIfNoMongo(async () => {
      const collection = db!.collection("indexed_test");
      await collection.createIndex({ _firestore_id: 1 }, { unique: true });
      await collection.createIndex({ _synced_at: 1 });
      await collection.createIndex({ _firestore_collection: 1 });
      await collection.insertOne({
        _firestore_id: "test123",
        _firestore_collection: "indexed_test",
        _synced_at: new Date(),
        data: "test",
      });
      const indexes = await collection.indexes();
      const indexNames = indexes.map(idx => idx.name);
      expect(indexNames).toContain("_firestore_id_1");
      expect(indexNames).toContain("_synced_at_1");
      expect(indexNames).toContain("_firestore_collection_1");
    })
  );

  it(
    "should handle duplicate key errors",
    skipIfNoMongo(async () => {
      const collection = db!.collection("duplicate_test");
      await collection.createIndex({ _firestore_id: 1 }, { unique: true });
      await collection.insertOne({
        _firestore_id: "duplicate123",
        data: "first",
      });
      await expect(
        collection.insertOne({
          _firestore_id: "duplicate123",
          data: "second",
        })
      ).rejects.toThrow();
    })
  );

  it(
    "should handle large documents efficiently",
    skipIfNoMongo(async () => {
      const collection = db!.collection("large_docs");
      const largeData = {
        _firestore_id: "large123",
        content: "x".repeat(500000),
        metadata: {
          size: "large",
          timestamp: new Date(),
        },
      };
      const startTime = Date.now();
      await collection.insertOne(largeData);
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000);
      const result = await collection.findOne({ _firestore_id: "large123" });
      expect(result?.content.length).toBe(500000);
    })
  );
}); 