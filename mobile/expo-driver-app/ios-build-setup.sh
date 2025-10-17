#!/bin/bash

# iOS Build Setup Script for Speedy Van Driver App
# This script will guide you through the EAS build setup process

echo "================================================"
echo "  Speedy Van Driver - iOS Build Setup"
echo "================================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
    echo "✅ EAS CLI installed successfully"
else
    echo "✅ EAS CLI is already installed"
fi

echo ""
echo "================================================"
echo "Step 1: Login to Expo"
echo "================================================"
echo ""

eas login

echo ""
echo "================================================"
echo "Step 2: Configure EAS Build"
echo "================================================"
echo ""

eas build:configure

echo ""
echo "================================================"
echo "Step 3: Set up Apple Credentials"
echo "================================================"
echo ""
echo "Run the following command to set up your Apple credentials:"
echo "  eas credentials"
echo ""
echo "Then select:"
echo "  1. iOS"
echo "  2. Production"
echo "  3. Set up credentials from scratch (or use existing)"
echo ""

read -p "Press Enter to open credentials setup..."

eas credentials

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Build iOS app: eas build --platform ios --profile production"
echo "  2. Monitor build: https://expo.dev"
echo "  3. Submit to TestFlight: eas submit --platform ios --latest"
echo ""
echo "For detailed instructions, see: IOS_BUILD_SETUP_GUIDE.md"
echo ""











