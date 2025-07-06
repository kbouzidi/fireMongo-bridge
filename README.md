# FireMongo Bridge Extension

A comprehensive Firebase Extension that synchronizes Firestore collections to MongoDB in real-time with advanced data transformation, management APIs, and robust error handling.

## 🚀 Features

- **Real-time Synchronization**: Automatically sync Firestore document changes to MongoDB
- **Batch Processing**: Initial sync for existing documents with configurable batch sizes
- **Data Transformation**: Handle Firestore-specific data types (Timestamps, References, GeoPoints)
- **Collection Mapping**: Custom mapping between Firestore and MongoDB collection names
- **Management APIs**: Monitor sync status and trigger manual operations
- **Index Management**: Automatic creation of performance indexes
- **Error Handling**: Comprehensive error handling with retry logic
- **Connection Pooling**: Efficient MongoDB connection management
- **CORS Support**: Web-accessible management endpoints

## 📋 Prerequisites

- Firebase project with billing enabled
- MongoDB database (Atlas or self-hosted)
- Firebase CLI installed and configured
- Node.js 20+ for local development

## 🛠️ Installation

### Option 1: Firebase Console (Recommended)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Extensions** in the left sidebar
4. Click **Browse the catalog**
5. Search for "FireMongo Bridge"
6. Click **Install**
7. Configure the extension parameters:
   - **MongoDB Connection String**: Your MongoDB connection URI
   - **MongoDB Database Name**: Target database name
   - **Collection Mapping** (Optional): JSON mapping for collection names
   - **Sync Mode**: Choose between real-time or batch only
   - **Create Indexes**: Enable/disable automatic index creation
   - **Batch Size**: Documents per batch (default: 100)
   - **Location**: Cloud Functions region

### Option 2: Firebase CLI

```bash
# Install the extension
firebase ext:install firemongo-bridge

# Deploy the extension
firebase deploy --only extensions
```

## ⚙️ Configuration Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `MONGODB_URI` | string | Yes | MongoDB connection string |
| `MONGODB_DATABASE` | string | Yes | Target database name |
| `COLLECTION_MAPPING` | string | No | JSON mapping for collection names |
| `SYNC_MODE` | select | No | "realtime" or "batch" |
| `PRESERVE_INDEXES` | boolean | No | Create MongoDB indexes |
| `BATCH_SIZE` | string | No | Documents per batch (default: 100) |
| `LOCATION` | select | No | Cloud Functions region |

### Collection Mapping Example

```json
{
  "users": "firestore_users",
  "products": "firestore_products",
  "orders": "firestore_orders"
}
```

## 🔧 Usage

### Initial Sync

After installation, trigger the initial sync to migrate existing data:

```bash
# Get your function URL from Firebase Console
curl -X POST https://your-project.cloudfunctions.net/initialSyncFunction
```

### Check Sync Status

```bash
# Get sync status for all collections
curl https://your-project.cloudfunctions.net/managementFunction
```

### Manual Sync for Specific Collection

```bash
# Sync a specific collection
curl -X POST https://your-project.cloudfunctions.net/managementFunction \
  -H "Content-Type: application/json" \
  -d '{"collectionName": "users"}'
```

## 📊 Data Transformation

The extension automatically transforms Firestore data types to MongoDB-compatible formats:

### Timestamps
```javascript
// Firestore Timestamp
firestore.Timestamp.now()

// MongoDB Date
new Date("2024-01-15T10:30:00.000Z")
```

### References
```javascript
// Firestore Reference
firestore.doc('users/123')

// MongoDB Object
{
  "_type": "reference",
  "_path": "users/123",
  "_id": "123"
}
```

### GeoPoints
```javascript
// Firestore GeoPoint
new firestore.GeoPoint(37.7749, -122.4194)

// MongoDB GeoJSON
{
  "type": "Point",
  "coordinates": [-122.4194, 37.7749]
}
```

### Metadata Fields

Each synced document includes metadata fields:

```javascript
{
  // Original document data
  "name": "John Doe",
  "email": "john@example.com",
  
  // Sync metadata
  "_firestore_id": "user123",
  "_firestore_collection": "users",
  "_firestore_path": "users/user123",
  "_synced_at": "2024-01-15T10:30:00.000Z"
}
```

## 🔍 Monitoring and Logs

### View Function Logs

```bash
# View real-time logs
firebase functions:log --only syncFunction

# View initial sync logs
firebase functions:log --only initialSyncFunction

# View management function logs
firebase functions:log --only managementFunction
```

### Sync Status Response

```json
{
  "success": true,
  "status": {
    "users": {
      "firestoreCount": 150,
      "mongoCount": 150,
      "lastSync": "2024-01-15T10:30:00.000Z",
      "inSync": true,
      "mongoCollection": "users"
    },
    "products": {
      "firestoreCount": 75,
      "mongoCount": 75,
      "lastSync": "2024-01-15T10:25:00.000Z",
      "inSync": true,
      "mongoCollection": "products"
    }
  },
  "config": {
    "syncMode": "realtime",
    "preserveIndexes": true,
    "batchSize": 100
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```
Error: MongoDB connection failed
```
**Solution**: Verify your MongoDB URI and network connectivity

#### 2. Permission Denied
```
Error: Permission denied for collection
```
**Solution**: Check MongoDB user permissions and database access

#### 3. Function Timeout
```
Error: Function execution timeout
```
**Solution**: Increase batch size or split large collections

#### 4. Memory Exceeded
```
Error: Memory limit exceeded
```
**Solution**: Reduce batch size or increase function memory

### Performance Optimization

1. **Batch Size**: Adjust based on document size and memory limits
2. **Indexes**: Enable for better query performance
3. **Connection Pooling**: Already optimized in the extension
4. **Collection Mapping**: Use to organize data efficiently

### Error Recovery

The extension includes automatic retry logic for:
- Network connectivity issues
- MongoDB connection failures
- Transient errors

Failed operations are logged with detailed error information for manual recovery.

## 💰 Pricing

- **Extension Cost**: $8/month
- **Cloud Functions**: Pay per invocation and compute time
- **Firestore**: Standard read/write costs
- **MongoDB**: Your MongoDB provider costs

### Cost Breakdown

| Component | Cost |
|-----------|------|
| Extension License | $8/month |
| Cloud Functions | ~$0.40/million invocations |
| Firestore Reads | ~$0.06/100K reads |
| Firestore Writes | ~$0.18/100K writes |

## 🔒 Security

- MongoDB credentials stored as Firebase secrets
- CORS configured for management endpoints
- Input validation for all parameters
- Error messages don't expose sensitive data
- Connection pooling with secure defaults

## 🆘 Support

### Documentation
- [Firebase Extensions Documentation](https://firebase.google.com/docs/extensions)
- [MongoDB Node.js Driver](https://docs.mongodb.com/drivers/node/)

### Community Support
- [Firebase Community](https://firebase.google.com/community)
- [MongoDB Community](https://community.mongodb.com/)

### Professional Support
For enterprise support, contact:
- Email: support@firebase.google.com
- [Firebase Support](https://firebase.google.com/support)

## 📝 License

This extension is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📈 Roadmap

- [ ] Webhook notifications for sync events
- [ ] Document filtering based on field values
- [ ] Data compression for large documents
- [ ] Sync metrics export to Firebase Analytics
- [ ] Multi-region deployment support
- [ ] Custom transformation rules
- [ ] Sync conflict resolution
- [ ] Backup and restore functionality

---

**Note**: This extension is designed for production use with comprehensive error handling and monitoring. For development and testing, consider using the Firebase Emulator Suite. 