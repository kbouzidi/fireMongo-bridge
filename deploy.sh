#!/bin/bash

# FireMongo Bridge Extension - Deployment Script
# This script helps deploy the extension to Firebase

set -e

echo "🚀 Deploying FireMongo Bridge Extension..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Please log in to Firebase first:"
    echo "firebase login"
    exit 1
fi

# Build the functions
echo "📦 Building functions..."
cd functions
npm install
npm run build
cd ..

# Deploy the extension
echo "🚀 Deploying extension..."
firebase deploy --only extensions

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your extension parameters in the Firebase Console"
echo "2. Set up your MongoDB connection string"
echo "3. Run the initial sync:"
echo "   curl -X POST https://your-project.cloudfunctions.net/initialSyncFunction"
echo "4. Check sync status:"
echo "   curl https://your-project.cloudfunctions.net/managementFunction"
echo ""
echo "📚 For more information, see the README.md file" 