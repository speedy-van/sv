#!/bin/bash

echo ""
echo "========================================"
echo "  Creating .env.local for Localhost"
echo "========================================"
echo ""

# Create .env.local file with localhost configuration
cat > .env.local << 'EOF'
# Local Development Environment
# For development with localhost API

# iOS Simulator / Physical Device on same network
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# For Android Emulator, uncomment this instead:
# EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000

# For Physical Device, replace with your computer's IP:
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000

# Production URL (uncomment when testing with production)
# EXPO_PUBLIC_API_BASE_URL=https://speedy-van.co.uk
EOF

echo ""
echo "✅ .env.local file created successfully!"
echo ""
echo "Configuration:"
echo "  API URL: http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Make sure backend is running: npm run dev"
echo "  2. Restart Expo: npx expo start --clear"
echo "  3. Try logging in again"
echo ""
echo "========================================"
echo ""

