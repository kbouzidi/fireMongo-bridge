import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { MongoClient, Db, Collection, Document, BulkWriteResult } from 'mongodb';

// Initialize Firebase Admin
admin.initializeApp();

// MongoDB connection and configuration
interface MongoConfig {
  uri: string;
  database: string;
  collectionMapping: Record<string, string>;
  preserveIndexes: boolean;
  batchSize: number;
}

interface SyncMetadata {
  _firestore_id: string;
  _firestore_collection: string;
  _synced_at: Date;
  _firestore_path: string;
}

interface SyncStats {
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  collections: Record<string, {
    count: number;
    lastSync: Date | null;
  }>;
}

// Global MongoDB client for connection pooling
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

/**
 * Get MongoDB configuration from environment variables
 */
function getMongoConfig(): MongoConfig {
  const uri = process.env.MONGODB_URI;
  const database = process.env.MONGODB_DATABASE;
  const collectionMappingStr = process.env.COLLECTION_MAPPING || '{}';
  const preserveIndexes = process.env.PRESERVE_INDEXES === 'true';
  const batchSize = parseInt(process.env.BATCH_SIZE || '100', 10);

  if (!uri || !database) {
    throw new Error('MONGODB_URI and MONGODB_DATABASE environment variables are required');
  }

  let collectionMapping: Record<string, string> = {};
  try {
    collectionMapping = JSON.parse(collectionMappingStr);
  } catch (error) {
    functions.logger.warn('Invalid COLLECTION_MAPPING JSON, using default mapping');
  }

  return {
    uri,
    database,
    collectionMapping,
    preserveIndexes,
    batchSize,
  };
}

/**
 * Get MongoDB connection with connection pooling
 */
async function getMongoConnection(): Promise<{ client: MongoClient; db: Db }> {
  if (!mongoClient || !mongoDb) {
    const config = getMongoConfig();
    mongoClient = new MongoClient(config.uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await mongoClient.connect();
    mongoDb = mongoClient.db(config.database);
    
    functions.logger.info('MongoDB connection established');
  }

  return { client: mongoClient, db: mongoDb };
}

/**
 * Transform Firestore data types to MongoDB-compatible formats
 */
function transformFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Firestore Timestamps
  if (data instanceof admin.firestore.Timestamp) {
    return data.toDate();
  }

  // Handle Firestore References
  if (data instanceof admin.firestore.DocumentReference) {
    return {
      _type: 'reference',
      _path: data.path,
      _id: data.id,
    };
  }

  // Handle Firestore GeoPoints
  if (data instanceof admin.firestore.GeoPoint) {
    return {
      type: 'Point',
      coordinates: [data.longitude, data.latitude],
    };
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(transformFirestoreData);
  }

  // Handle Objects
  if (typeof data === 'object') {
    const transformed: any = {};
    for (const [key, value] of Object.entries(data)) {
      transformed[key] = transformFirestoreData(value);
    }
    return transformed;
  }

  // Return primitives as-is
  return data;
}

/**
 * Get MongoDB collection name based on mapping
 */
function getMongoCollectionName(firestoreCollection: string, config: MongoConfig): string {
  return config.collectionMapping[firestoreCollection] || firestoreCollection;
}

/**
 * Create indexes for MongoDB collection
 */
async function createIndexes(collection: Collection, config: MongoConfig): Promise<void> {
  if (!config.preserveIndexes) {
    return;
  }

  try {
    await collection.createIndex({ _firestore_id: 1 }, { unique: true });
    await collection.createIndex({ _synced_at: 1 });
    await collection.createIndex({ _firestore_collection: 1 });
    functions.logger.info(`Indexes created for collection: ${collection.collectionName}`);
  } catch (error) {
    functions.logger.error(`Failed to create indexes for collection ${collection.collectionName}:`, error);
  }
}

/**
 * Sync a single document to MongoDB
 */
async function syncDocument(
  collectionName: string,
  documentId: string,
  documentData: any,
  config: MongoConfig,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  const { db } = await getMongoConnection();
  const mongoCollectionName = getMongoCollectionName(collectionName, config);
  const collection = db.collection(mongoCollectionName);

  try {
    if (operation === 'delete') {
      // Delete document from MongoDB
      await collection.deleteOne({ _firestore_id: documentId });
      functions.logger.info(`Deleted document ${documentId} from collection ${mongoCollectionName}`);
    } else {
      // Transform and prepare document data
      const transformedData = transformFirestoreData(documentData);
      
      const documentToInsert: Document & SyncMetadata = {
        ...transformedData,
        _firestore_id: documentId,
        _firestore_collection: collectionName,
        _firestore_path: `${collectionName}/${documentId}`,
        _synced_at: new Date(),
      };

      // Use replaceOne with upsert for both create and update operations
      await collection.replaceOne(
        { _firestore_id: documentId },
        documentToInsert,
        { upsert: true }
      );

      functions.logger.info(
        `${operation === 'create' ? 'Created' : 'Updated'} document ${documentId} in collection ${mongoCollectionName}`
      );
    }
  } catch (error) {
    functions.logger.error(
      `Failed to sync document ${documentId} in collection ${mongoCollectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Real-time sync function triggered by Firestore document changes
 */
export const syncFunction = functions.firestore
  .document('{collectionId}/{docId}')
  .onWrite(async (change, context) => {
    const { collectionId, docId } = context.params;
    const config = getMongoConfig();

    // Skip if sync mode is batch only
    if (process.env.SYNC_MODE === 'batch') {
      functions.logger.info(`Skipping real-time sync for ${collectionId}/${docId} (batch mode only)`);
      return;
    }

    try {
      if (!change.after.exists) {
        // Document was deleted
        await syncDocument(collectionId, docId, null, config, 'delete');
      } else if (!change.before.exists) {
        // Document was created
        await syncDocument(collectionId, docId, change.after.data(), config, 'create');
      } else {
        // Document was updated
        await syncDocument(collectionId, docId, change.after.data(), config, 'update');
      }
    } catch (error) {
      functions.logger.error(`Error in syncFunction for ${collectionId}/${docId}:`, error);
      throw error;
    }
  });

/**
 * Initial sync function for batch processing existing documents
 */
export const initialSyncFunction = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed. Use POST to trigger initial sync.');
    return;
  }

  try {
    const config = getMongoConfig();
    const { db } = await getMongoConnection();
    const firestore = admin.firestore();
    
    const stats: SyncStats = {
      totalDocuments: 0,
      processedDocuments: 0,
      failedDocuments: 0,
      collections: {},
    };

    // Get all collections from Firestore
    const collections = await firestore.listCollections();
    functions.logger.info(`Found ${collections.length} collections to sync`);

    for (const collectionRef of collections) {
      const collectionName = collectionRef.id;
      const mongoCollectionName = getMongoCollectionName(collectionName, config);
      const mongoCollection = db.collection(mongoCollectionName);

      // Create indexes if enabled
      await createIndexes(mongoCollection, config);

      // Get collection stats
      const snapshot = await collectionRef.get();
      const documentCount = snapshot.size;
      stats.collections[collectionName] = {
        count: documentCount,
        lastSync: null,
      };
      stats.totalDocuments += documentCount;

      functions.logger.info(`Starting sync for collection: ${collectionName} (${documentCount} documents)`);

      // Process documents in batches
      let processed = 0;
      let failed = 0;
      let lastDoc: admin.firestore.QueryDocumentSnapshot | null = null;

      while (processed < documentCount) {
        let query = collectionRef.orderBy(admin.firestore.FieldPath.documentId()).limit(config.batchSize);
        
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const batchSnapshot = await query.get();
        
        if (batchSnapshot.empty) {
          break;
        }

        const bulkOps: any[] = [];
        const documents: any[] = [];

        batchSnapshot.forEach((doc) => {
          try {
            const transformedData = transformFirestoreData(doc.data());
            const documentToInsert: Document & SyncMetadata = {
              ...transformedData,
              _firestore_id: doc.id,
              _firestore_collection: collectionName,
              _firestore_path: `${collectionName}/${doc.id}`,
              _synced_at: new Date(),
            };

            bulkOps.push({
              replaceOne: {
                filter: { _firestore_id: doc.id },
                replacement: documentToInsert,
                upsert: true,
              },
            });

            documents.push(doc);
          } catch (error) {
            functions.logger.error(`Failed to transform document ${doc.id}:`, error);
            failed++;
          }
        });

        if (bulkOps.length > 0) {
          try {
            const result: BulkWriteResult = await mongoCollection.bulkWrite(bulkOps);
            processed += result.upsertedCount + result.modifiedCount;
            functions.logger.info(
              `Batch processed for ${collectionName}: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`
            );
          } catch (error) {
            functions.logger.error(`Bulk write failed for collection ${collectionName}:`, error);
            failed += bulkOps.length;
          }
        }

        lastDoc = documents[documents.length - 1];
      }

      stats.processedDocuments += processed;
      stats.failedDocuments += failed;
      stats.collections[collectionName].lastSync = new Date();

      functions.logger.info(
        `Completed sync for collection ${collectionName}: ${processed} processed, ${failed} failed`
      );
    }

    res.status(200).json({
      success: true,
      message: 'Initial sync completed successfully',
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    functions.logger.error('Error in initialSyncFunction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during initial sync',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Management function for sync status and manual operations
 */
export const managementFunction = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const config = getMongoConfig();
    const { db } = await getMongoConnection();
    const firestore = admin.firestore();

    if (req.method === 'GET') {
      // Return sync status for all collections
      const collections = await firestore.listCollections();
      const status: Record<string, any> = {};

      for (const collectionRef of collections) {
        const collectionName = collectionRef.id;
        const mongoCollectionName = getMongoCollectionName(collectionName, config);
        const mongoCollection = db.collection(mongoCollectionName);

        try {
          // Get document counts
          const firestoreCount = (await collectionRef.get()).size;
          const mongoCount = await mongoCollection.countDocuments();

          // Get last sync timestamp
          const lastSyncDoc = await mongoCollection
            .find({ _firestore_collection: collectionName })
            .sort({ _synced_at: -1 })
            .limit(1)
            .next();

          status[collectionName] = {
            firestoreCount,
            mongoCount,
            lastSync: lastSyncDoc?._synced_at || null,
            inSync: firestoreCount === mongoCount,
            mongoCollection: mongoCollectionName,
          };
        } catch (error) {
          functions.logger.error(`Error getting status for collection ${collectionName}:`, error);
          status[collectionName] = {
            error: 'Failed to get status',
            firestoreCount: 0,
            mongoCount: 0,
            lastSync: null,
            inSync: false,
          };
        }
      }

      res.status(200).json({
        success: true,
        status,
        config: {
          syncMode: process.env.SYNC_MODE,
          preserveIndexes: config.preserveIndexes,
          batchSize: config.batchSize,
        },
        timestamp: new Date().toISOString(),
      });

    } else if (req.method === 'POST') {
      // Manual sync for specific collection
      const { collectionName } = req.body;

      if (!collectionName) {
        res.status(400).json({
          success: false,
          error: 'collectionName is required in request body',
        });
        return;
      }

      const collectionRef = firestore.collection(collectionName);
      const mongoCollectionName = getMongoCollectionName(collectionName, config);
      const mongoCollection = db.collection(mongoCollectionName);

      // Create indexes if enabled
      await createIndexes(mongoCollection, config);

      // Get all documents from the collection
      const snapshot = await collectionRef.get();
      let processed = 0;
      let failed = 0;

      const bulkOps: any[] = [];
      snapshot.forEach((doc) => {
        try {
          const transformedData = transformFirestoreData(doc.data());
          const documentToInsert: Document & SyncMetadata = {
            ...transformedData,
            _firestore_id: doc.id,
            _firestore_collection: collectionName,
            _firestore_path: `${collectionName}/${doc.id}`,
            _synced_at: new Date(),
          };

          bulkOps.push({
            replaceOne: {
              filter: { _firestore_id: doc.id },
              replacement: documentToInsert,
              upsert: true,
            },
          });
        } catch (error) {
          functions.logger.error(`Failed to transform document ${doc.id}:`, error);
          failed++;
        }
      });

      if (bulkOps.length > 0) {
        try {
          const result: BulkWriteResult = await mongoCollection.bulkWrite(bulkOps);
          processed = result.upsertedCount + result.modifiedCount;
        } catch (error) {
          functions.logger.error(`Bulk write failed for collection ${collectionName}:`, error);
          failed = bulkOps.length;
        }
      }

      res.status(200).json({
        success: true,
        message: `Manual sync completed for collection: ${collectionName}`,
        stats: {
          totalDocuments: snapshot.size,
          processedDocuments: processed,
          failedDocuments: failed,
        },
        timestamp: new Date().toISOString(),
      });

    } else {
      res.status(405).send('Method not allowed. Use GET for status or POST for manual sync.');
    }

  } catch (error) {
    functions.logger.error('Error in managementFunction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}); 