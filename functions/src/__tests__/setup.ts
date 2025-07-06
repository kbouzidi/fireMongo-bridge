// Test setup file for Jest
// import * as admin from "firebase-admin";

// Mock Firebase Admin
jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    listCollections: jest.fn(),
    collection: jest.fn(),
  })),
}));

// Mock environment variables
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.MONGODB_DATABASE = "test";
process.env.COLLECTION_MAPPING = "{}";
process.env.PRESERVE_INDEXES = "true";
process.env.BATCH_SIZE = "100";
process.env.SYNC_MODE = "realtime";

// Global test setup
beforeAll(() => {
  // Initialize any global test setup here
});

afterAll(() => {
  // Clean up any global test resources here
}); 