#!/bin/bash

# Production Build Script for Speedy Van Driver App
# This builds a standalone production binary (not a dev client)

set -e

echo "🚀 Starting Production Build Process"
echo "======================================"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the mobile/driver-app directory"
    exit 1
fi

# Verify expo-dev-client is NOT in dependencies
if grep -q '"expo-dev-client"' package.json | grep -v devDependencies; then
    echo "⚠️  Warning: expo-dev-client found in dependencies!"
    echo "It should only be in devDependencies for production builds"
    echo "Please move it to devDependencies"
    exit 1
fi

# Clean install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Show current version
VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo ""
echo "📱 App Version: $VERSION"
echo ""

# Ask for platform
echo "Select platform to build:"
echo "1) iOS"
echo "2) Android"
echo "3) Both"
read -p "Enter choice (1-3): " PLATFORM_CHOICE

case $PLATFORM_CHOICE in
    1)
        PLATFORM="ios"
        ;;
    2)
        PLATFORM="android"
        ;;
    3)
        PLATFORM="all"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Confirm build
echo ""
echo "⚙️  Build Configuration:"
echo "   Platform: $PLATFORM"
echo "   Profile: production"
echo "   Type: Standalone (NO dev client)"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Build cancelled"
    exit 0
fi

# Start build
echo ""
echo "🏗️  Starting EAS Build..."
echo "This will:"
echo "  ✓ Build a standalone production binary"
echo "  ✓ No Metro/dev server dependency"
echo "  ✓ All native modules properly registered"
echo "  ✓ Ready for distribution"
echo ""

npx eas build --platform $PLATFORM --profile production

echo ""
echo "✅ Build submitted to EAS!"
echo ""
echo "Next steps:"
echo "1. Wait for build to complete on EAS dashboard"
echo "2. Download the build artifact (.ipa or .apk)"
echo "3. Install on a physical device"
echo "4. Verify app launches without Metro screen"
echo "5. Test all core functionality"
echo "6. Only then send to client"
echo ""
echo "Monitor build: https://expo.dev/accounts/speedy-van/projects/speedy-van-driver/builds"
