# FireMongo Bridge Extension - Post-Installation Guide

## 🎉 Installation Complete!

Your Firestore to MongoDB Sync extension has been successfully installed. Follow this guide to complete the setup and start syncing your data.

## 🔧 Step-by-Step Setup

### 1. Verify Configuration

First, verify that your extension parameters are correctly configured:

```bash
# Check your extension configuration
firebase ext:info firemongo-bridge
```

Ensure the following parameters are set:
- ✅ `MONGODB_URI`: Your MongoDB connection string
- ✅ `MONGODB_DATABASE`: Target database name
- ✅ `COLLECTION_MAPPING`: Collection mapping (if configured)
- ✅ `SYNC_MODE`: Real-time or batch mode
- ✅ `PRESERVE_INDEXES`: Index creation setting
- ✅ `BATCH_SIZE`: Documents per batch
- ✅ `LOCATION`: Cloud Functions region

### 2. Test MongoDB Connectivity

Test your MongoDB connection before proceeding:

```bash
# Get your function URLs
firebase functions:list
```

Look for these functions:
- `initialSyncFunction`
- `managementFunction`
- `syncFunction` (if in real-time mode)

### 3. Run Initial Sync

Trigger the initial sync to migrate existing Firestore data:

```bash
# Get your project's function URL
PROJECT_ID=$(firebase use --json | jq -r '.current')
REGION=$(firebase ext:info firemongo-bridge --json | jq -r '.params[] | select(.param=="LOCATION") | .value')

# Trigger initial sync
curl -X POST "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/initialSyncFunction"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Initial sync completed successfully",
  "stats": {
    "totalDocuments": 1250,
    "processedDocuments": 1250,
    "failedDocuments": 0,
    "collections": {
      "users": {
        "count": 500,
        "lastSync": "2024-01-15T10:30:00.000Z"
      },
      "products": {
        "count": 750,
        "lastSync": "2024-01-15T10:35:00.000Z"
      }
    }
  },
  "timestamp": "2024-01-15T10:40:00.000Z"
}
```

### 4. Verify Sync Status

Check the sync status of all collections:

```bash
# Check sync status
curl "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/managementFunction"
```

**Expected Response:**
```json
{
  "success": true,
  "status": {
    "users": {
      "firestoreCount": 500,
      "mongoCount": 500,
      "lastSync": "2024-01-15T10:30:00.000Z",
      "inSync": true,
      "mongoCollection": "users"
    },
    "products": {
      "firestoreCount": 750,
      "mongoCount": 750,
      "lastSync": "2024-01-15T10:35:00.000Z",
      "inSync": true,
      "mongoCollection": "products"
    }
  },
  "config": {
    "syncMode": "realtime",
    "preserveIndexes": true,
    "batchSize": 100
  },
  "timestamp": "2024-01-15T10:45:00.000Z"
}
```

### 5. Test Real-time Sync (if enabled)

If you're using real-time sync mode, test it by creating a document in Firestore:

```bash
# Create a test document
firebase firestore:add users --data '{"name":"Test User","email":"test@example.com","createdAt":"2024-01-15T10:50:00.000Z"}'
```

Then check if it appears in MongoDB within a few seconds.

## 🧪 Testing Your Setup

### Test 1: Basic Connectivity

```bash
# Test management function
curl "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/managementFunction"
```

### Test 2: Manual Collection Sync

```bash
# Sync a specific collection
curl -X POST "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/managementFunction" \
  -H "Content-Type: application/json" \
  -d '{"collectionName": "users"}'
```

### Test 3: Data Transformation

Create a document with Firestore-specific data types:

```javascript
// In your Firebase Console or app
const testDoc = {
  name: "John Doe",
  email: "john@example.com",
  createdAt: firebase.firestore.Timestamp.now(),
  location: new firebase.firestore.GeoPoint(37.7749, -122.4194),
  reference: firebase.firestore().doc('categories/tech'),
  tags: ["user", "active"],
  metadata: {
    lastLogin: firebase.firestore.Timestamp.now(),
    preferences: {
      theme: "dark",
      notifications: true
    }
  }
};

firebase.firestore().collection('users').add(testDoc);
```

Verify the transformation in MongoDB:

```javascript
// In MongoDB
db.users.findOne({name: "John Doe"})
```

Expected MongoDB document:
```json
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": ISODate("2024-01-15T10:55:00.000Z"),
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "reference": {
    "_type": "reference",
    "_path": "categories/tech",
    "_id": "tech"
  },
  "tags": ["user", "active"],
  "metadata": {
    "lastLogin": ISODate("2024-01-15T10:55:00.000Z"),
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  },
  "_firestore_id": "...",
  "_firestore_collection": "users",
  "_firestore_path": "users/...",
  "_synced_at": ISODate("2024-01-15T10:55:00.000Z")
}
```

## 📊 Monitoring and Troubleshooting

### View Function Logs

```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only syncFunction
firebase functions:log --only initialSyncFunction
firebase functions:log --only managementFunction
```

### Common Issues and Solutions

#### Issue 1: MongoDB Connection Failed
```
Error: MongoDB connection failed
```

**Solutions:**
1. Verify MongoDB URI format
2. Check network connectivity
3. Ensure MongoDB user has proper permissions
4. Verify MongoDB is accessible from Google Cloud

#### Issue 2: Function Timeout
```
Error: Function execution timeout
```

**Solutions:**
1. Reduce batch size in configuration
2. Split large collections
3. Increase function timeout (if possible)
4. Use batch mode for large datasets

#### Issue 3: Memory Exceeded
```
Error: Memory limit exceeded
```

**Solutions:**
1. Reduce batch size
2. Increase function memory allocation
3. Process smaller collections first
4. Optimize document size

#### Issue 4: Sync Status Shows Out of Sync
```
"inSync": false
```

**Solutions:**
1. Check function logs for errors
2. Verify MongoDB permissions
3. Run manual sync for the collection
4. Check for data transformation issues

### Performance Monitoring

Monitor these metrics:
- **Function Invocations**: Should match your Firestore write operations
- **Function Duration**: Should be under 30 seconds for real-time sync
- **Memory Usage**: Should stay under 80% of allocated memory
- **Error Rate**: Should be close to 0%

## 🔒 Security Best Practices

### 1. MongoDB Security
- Use MongoDB Atlas for managed security
- Enable network access lists
- Use strong authentication
- Enable encryption at rest

### 2. Firebase Security
- MongoDB credentials are stored as secrets
- No sensitive data in function logs
- CORS is configured for management APIs
- Input validation on all parameters

### 3. Network Security
- MongoDB must be accessible from Google Cloud
- Consider VPC peering for private networks
- Use SSL/TLS for all connections

## 📈 Performance Optimization

### Recommended Settings by Use Case

#### Small Applications (< 10K documents)
- Batch Size: 100
- Memory: 512MB
- Sync Mode: Real-time
- Indexes: Enabled

#### Medium Applications (10K - 100K documents)
- Batch Size: 250
- Memory: 1GB
- Sync Mode: Real-time
- Indexes: Enabled

#### Large Applications (> 100K documents)
- Batch Size: 500
- Memory: 1GB
- Sync Mode: Batch (for initial sync)
- Indexes: Enabled

### Optimization Tips

1. **Batch Size**: Adjust based on document size and memory limits
2. **Collection Mapping**: Use to organize data efficiently
3. **Indexes**: Enable for better query performance
4. **Monitoring**: Watch function logs for performance issues

## 🚨 Important Notes

### Data Consistency
- Real-time sync provides eventual consistency
- Small delays possible during high load
- Use management API to verify sync status

### Error Recovery
- Failed operations are logged with details
- Automatic retry for transient errors
- Manual recovery options available

### Limitations
- Maximum document size: 1MB (MongoDB limit)
- Maximum batch size: 1000 documents
- Function timeout: 540 seconds
- Memory limit: 1GB per function

## 🆘 Support and Resources

### Documentation
- [Firebase Extensions Documentation](https://firebase.google.com/docs/extensions)
- [MongoDB Node.js Driver](https://docs.mongodb.com/drivers/node/)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)

### Community Support
- [Firebase Community](https://firebase.google.com/community)
- [MongoDB Community](https://community.mongodb.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase-extensions)

### Professional Support
For enterprise support, contact:
- Email: support@firebase.google.com
- [Firebase Support](https://firebase.google.com/support)

## ✅ Setup Checklist

After following this guide, verify:

- [ ] Extension parameters configured correctly
- [ ] MongoDB connectivity tested
- [ ] Initial sync completed successfully
- [ ] Sync status shows all collections in sync
- [ ] Real-time sync tested (if enabled)
- [ ] Function logs reviewed
- [ ] Performance monitoring set up
- [ ] Security measures implemented

## 🎯 Next Steps

1. **Monitor Performance**: Watch function logs and sync status
2. **Optimize Settings**: Adjust batch size and memory based on usage
3. **Set Up Alerts**: Configure monitoring for sync failures
4. **Scale Up**: Adjust settings as your data grows
5. **Backup Strategy**: Plan for MongoDB backups and disaster recovery

---

**Congratulations!** Your Firestore to MongoDB sync is now operational. Monitor the sync status regularly and adjust settings as needed for optimal performance. 