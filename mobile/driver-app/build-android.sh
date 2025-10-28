#!/bin/bash

# Speedy Van Driver - Android Build Script v2.0.0
# This script builds the Android app for production

echo "🚀 ======================================"
echo "🚀 Speedy Van Driver v2.0.0 Android Build"
echo "🚀 ======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo -e "${RED}❌ Error: app.json not found. Please run this script from mobile/driver-app directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Build Configuration:${NC}"
echo "  • App Name: Speedy Van Driver"
echo "  • Version: 2.0.0"
echo "  • Version Code: 2"
echo "  • Platform: Android"
echo "  • Build Type: Production (AAB)"
echo "  • Package: com.speedyvan.driver"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI not found${NC}"
    echo -e "${BLUE}📦 Installing EAS CLI...${NC}"
    npm install -g eas-cli
    echo -e "${GREEN}✅ EAS CLI installed${NC}"
    echo ""
fi

# Check EAS login status
echo -e "${BLUE}🔐 Checking EAS login status...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to EAS${NC}"
    echo -e "${BLUE}🔑 Please login to EAS:${NC}"
    eas login
else
    EAS_USER=$(eas whoami)
    echo -e "${GREEN}✅ Logged in as: ${EAS_USER}${NC}"
fi
echo ""

# Prompt for build type
echo -e "${BLUE}📦 Select build type:${NC}"
echo "  1) Production (AAB for Google Play) - Recommended"
echo "  2) Preview (APK for direct install)"
echo "  3) Development (Debug build)"
read -p "Enter choice (1-3): " BUILD_CHOICE
echo ""

case $BUILD_CHOICE in
    1)
        PROFILE="production"
        BUILD_TYPE="AAB"
        echo -e "${GREEN}✅ Building production AAB${NC}"
        ;;
    2)
        PROFILE="preview"
        BUILD_TYPE="APK"
        echo -e "${GREEN}✅ Building preview APK${NC}"
        ;;
    3)
        PROFILE="development"
        BUILD_TYPE="APK"
        echo -e "${GREEN}✅ Building development APK${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Defaulting to production.${NC}"
        PROFILE="production"
        BUILD_TYPE="AAB"
        ;;
esac

echo ""
echo -e "${BLUE}🏗️  Starting build...${NC}"
echo -e "${BLUE}⏱️  This may take 10-20 minutes...${NC}"
echo ""

# Run EAS build
eas build --platform android --profile $PROFILE --non-interactive

# Check build result
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ======================================"
    echo -e "🎉 Build Completed Successfully!"
    echo -e "🎉 ======================================${NC}"
    echo ""
    echo -e "${BLUE}📥 Next Steps:${NC}"
    echo "  1. Download the ${BUILD_TYPE} file from Expo dashboard"
    echo "  2. Visit: https://expo.dev/accounts/[YOUR_ACCOUNT]/projects/speedy-van-driver/builds"
    echo "  3. For production: Upload to Google Play Console (Internal Testing)"
    echo "  4. For preview: Install directly on test devices"
    echo ""
    echo -e "${GREEN}✅ Version 2.0.0 is ready for deployment!${NC}"
else
    echo ""
    echo -e "${RED}❌ ======================================"
    echo -e "❌ Build Failed!"
    echo -e "❌ ======================================${NC}"
    echo ""
    echo -e "${BLUE}🔍 Troubleshooting:${NC}"
    echo "  • Check logs above for specific errors"
    echo "  • Ensure all dependencies are installed: pnpm install"
    echo "  • Try: eas build:list to see build status"
    echo "  • Contact support: https://expo.dev/support"
    echo ""
fi

