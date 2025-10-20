@echo off
echo.
echo ========================================
echo   Creating .env.local for Localhost
echo ========================================
echo.

REM Create .env.local file with localhost configuration
(
echo # Local Development Environment
echo # For development with localhost API
echo.
echo # iOS Simulator / Physical Device on same network
echo EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
echo.
echo # For Android Emulator, uncomment this instead:
echo # EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
echo.
echo # For Physical Device, replace with your computer's IP:
echo # EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000
echo.
echo # Production URL (uncomment when testing with production^)
echo # EXPO_PUBLIC_API_BASE_URL=https://speedy-van.co.uk
) > .env.local

echo.
echo ✅ .env.local file created successfully!
echo.
echo Configuration:
echo   API URL: http://localhost:3000
echo.
echo Next steps:
echo   1. Make sure backend is running: npm run dev
echo   2. Restart Expo: npx expo start --clear
echo   3. Try logging in again
echo.
echo ========================================
echo.
pause

