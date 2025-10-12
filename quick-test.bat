@echo off
REM Quick Test Runner for Multiple Drops Route System
REM مشغل الاختبارات السريع لنظام الطرق متعددة التوصيل

echo 🚀 Multiple Drops Route System - Quick Test Runner
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if test files exist
if not exist "test-multiple-drops.js" (
    echo ❌ test-multiple-drops.js not found. Please run from the project root.
    exit /b 1
)

REM Create temp directory if it doesn't exist
if not exist "__tests__\temp" mkdir "__tests__\temp"

REM Function to run specific test
if "%1"=="smoke" (
    echo 🧪 Running smoke test...
    node test-multiple-drops.js --test-type smoke
    goto :end
)

if "%1"=="basic" (
    echo 🧪 Running basic test...
    node test-multiple-drops.js --test-type basic
    goto :end
)

if "%1"=="advanced" (
    echo 🧪 Running advanced test...
    node test-multiple-drops.js --test-type advanced
    goto :end
)

if "%1"=="complex" (
    echo 🧪 Running complex test...
    node test-multiple-drops.js --test-type complex
    goto :end
)

if "%1"=="load" (
    echo 🧪 Running load test...
    node test-multiple-drops.js --test-type load
    goto :end
)

if "%1"=="full" (
    echo 🧪 Running full test...
    node test-multiple-drops.js --test-type full
    goto :end
)

if "%1"=="help" (
    echo 📖 Help - Multiple Drops Route System Test Suite
    echo.
    echo Usage: %0 [options]
    echo.
    echo Options:
    echo   smoke     - Quick smoke test (1 minute)
    echo   basic     - Basic functionality test (5 minutes)
    echo   advanced  - Advanced features test (10 minutes)
    echo   complex   - Complex scenarios test (15 minutes)
    echo   load      - Load and stress test (10 minutes)
    echo   full      - Complete test suite (30 minutes)
    echo   all       - Run all tests
    echo   help      - Show this help message
    echo.
    echo Examples:
    echo   %0 smoke      # Run smoke test only
    echo   %0 load       # Run load test only
    echo   %0 all        # Run all tests
    echo   %0 help       # Show this help
    goto :end
)

if "%1"=="all" (
    echo 🔄 Running all tests...
    node test-multiple-drops.js
    goto :end
)

if "%1"=="" (
    echo 🔄 Running all tests...
    node test-multiple-drops.js
    goto :end
)

echo ❌ Unknown option: %1
echo Use '%0 help' for available options
exit /b 1

:end
echo.
echo ✅ Test execution completed!
echo 📁 Results saved to __tests__\temp\ directory
