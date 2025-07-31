# Changelog

All notable changes to the FireMongo Bridge Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2025-07-31
### Changed
- Updated extension version to 1.0.5
- Update extension


## [1.0.4] - 2025-07-25
### Changed
- Updated extension version to 1.0.4
- Add extiension icon

## [1.0.3] - 2025-07-08
### Changed
- Updated extension version to 1.0.3
- Updated author URL to point to the correct repository
- Updated Firebase extension etag after deployment

## [1.0.2] - 2024-07-06
### 🎉 First Stable Release
- **Stable Release**: First production-ready version of FireMongo Bridge
- **Build Fixes**: Resolved TypeScript compilation issues for production builds
- **Pricing Update**: Corrected to Firebase pay-per-use model (removed fixed $8/month cost)
- **Documentation**: Complete user guides and API documentation
- **Testing**: Comprehensive test suite with MongoDB integration tests
- **Security**: Proper credential management and input validation
- **Performance**: Optimized connection pooling and batch processing

### Technical Improvements
- Fixed TypeScript build configuration to exclude test files
- Added MongoDB URI validation and sanitization
- Improved error handling and logging
- Enhanced CORS support for management APIs
- Added comprehensive monitoring and status endpoints

## [1.0.1] - 2024-07-06
### Changed
- Updated extension version to 1.0.1.
- Fixed parameter type for `PRESERVE_INDEXES` to use `select` instead of `boolean` for Firebase Extensions compatibility.
- Restored Apache 2.0 license.
- Improved MongoDB URI validation and documentation.

## [1.0.0] - 2024-07-05

### Added
- Initial release of FireMongo Bridge Extension
- Real-time synchronization of Firestore documents to MongoDB
- Batch processing for initial data migration
- Comprehensive data transformation for Firestore-specific types:
  - Timestamps → MongoDB Date objects
  - References → Structured objects with metadata
  - GeoPoints → GeoJSON Point format
  - Arrays and nested objects with recursive transformation
- Collection mapping support for custom MongoDB collection names
- Management API for sync status monitoring and manual operations
- Automatic index creation for performance optimization
- Connection pooling for efficient MongoDB connectivity
- CORS support for web-accessible management endpoints
- Comprehensive error handling with retry logic
- Detailed logging and monitoring capabilities
- Support for both real-time and batch-only sync modes
- Configurable batch sizes for large collections
- Metadata fields for tracking sync status and Firestore references

### Features
- **Real-time Sync Function**: Automatically syncs Firestore document changes
- **Initial Sync Function**: Batch processes existing documents
- **Management Function**: Provides sync status and manual operations
- **Data Transformation**: Handles all Firestore data types
- **Index Management**: Creates performance indexes automatically
- **Error Recovery**: Automatic retry for transient failures
- **Monitoring**: Comprehensive logging and status APIs

### Configuration Options
- `MONGODB_URI`: MongoDB connection string (required)
- `MONGODB_DATABASE`: Target database name (required)
- `COLLECTION_MAPPING`: JSON mapping for collection names (optional)
- `SYNC_MODE`: Real-time or batch synchronization
- `PRESERVE_INDEXES`: Enable/disable automatic index creation
- `BATCH_SIZE`: Documents per batch (default: 100)
- `LOCATION`: Cloud Functions deployment region

### Technical Specifications
- **Runtime**: Node.js 20
- **Memory**: 512MB (real-time), 1GB (batch)
- **Timeout**: 540 seconds
- **Concurrency**: 1000 (real-time), 10 (batch)
- **Dependencies**: Firebase Admin SDK, MongoDB Node.js Driver

### Security Features
- MongoDB credentials stored as Firebase secrets
- Input validation for all parameters
- CORS configuration for management endpoints
- Secure error messages without sensitive data exposure
- Connection pooling with secure defaults

### Performance Optimizations
- Efficient bulk operations for batch processing
- Connection pooling for MongoDB
- Configurable batch sizes
- Minimal cold start impact
- Optimized memory usage

### Documentation
- Comprehensive README with usage examples
- Pre-installation guide with pricing and requirements
- Post-installation guide with setup instructions
- Troubleshooting section with common issues
- Performance optimization guidelines
- Security best practices

### Support
- Community support through Firebase and MongoDB communities
- Professional support for enterprise users
- Comprehensive documentation and examples
- Error handling with actionable messages

---

## [Unreleased]

### Planned Features
- Webhook notifications for sync events
- Document filtering based on field values
- Data compression for large documents
- Sync metrics export to Firebase Analytics
- Multi-region deployment support
- Custom transformation rules
- Sync conflict resolution
- Backup and restore functionality
- Real-time sync status dashboard
- Advanced monitoring and alerting
- Support for subcollections
- Incremental sync with change tracking
- Data validation and schema enforcement
- Performance analytics and optimization recommendations

### Planned Improvements
- Enhanced error recovery mechanisms
- More granular sync controls
- Advanced collection mapping options
- Improved performance for large datasets
- Better memory management
- Enhanced logging and debugging tools
- Support for MongoDB transactions
- Real-time sync performance optimization
- Advanced security features
- Integration with Firebase Monitoring

---

## Version History

### Version 1.0.0 (Current)
- **Release Date**: January 15, 2024
- **Status**: Stable
- **Compatibility**: Firebase Extensions v1.0.0+
- **Node.js**: 20.x
- **MongoDB**: 4.4+

### Version 0.9.0 (Beta)
- **Release Date**: December 1, 2023
- **Status**: Beta
- **Features**: Core sync functionality, basic transformation
- **Limitations**: Limited error handling, no management API

### Version 0.8.0 (Alpha)
- **Release Date**: November 15, 2023
- **Status**: Alpha
- **Features**: Basic Firestore to MongoDB sync
- **Limitations**: No data transformation, basic error handling

---

## Migration Guide

### From Beta to 1.0.0
- No breaking changes
- Enhanced error handling and logging
- New management API for monitoring
- Improved performance and reliability
- Additional configuration options

### From Alpha to 1.0.0
- Complete rewrite with enhanced features
- New configuration parameters
- Improved data transformation
- Management API addition
- Performance optimizations

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

## Support

For support and questions:
- **Community**: [Firebase Community](https://firebase.google.com/community)
- **Documentation**: [Firebase Extensions Docs](https://firebase.google.com/docs/extensions)
- **Issues**: [GitHub Issues](https://github.com/firebase/extensions/issues)
- **Professional Support**: [Firebase Support](https://firebase.google.com/support)

---

**Note**: This changelog follows the [Keep a Changelog](https://keepachangelog.com/) format and [Semantic Versioning](https://semver.org/) principles. 