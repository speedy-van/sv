#!/bin/bash

# Quick Test Runner for Multiple Drops Route System
# مشغل الاختبارات السريع لنظام الطرق متعددة التوصيل

echo "🚀 Multiple Drops Route System - Quick Test Runner"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if test files exist
if [ ! -f "test-multiple-drops.js" ]; then
    echo "❌ test-multiple-drops.js not found. Please run from the project root."
    exit 1
fi

# Create temp directory if it doesn't exist
mkdir -p __tests__/temp

# Function to run specific test
run_test() {
    local test_type=$1
    echo "🧪 Running $test_type test..."
    node test-multiple-drops.js --test-type $test_type
}

# Function to run all tests
run_all_tests() {
    echo "🔄 Running all tests..."
    node test-multiple-drops.js
}

# Function to show help
show_help() {
    echo "📖 Help - Multiple Drops Route System Test Suite"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  smoke     - Quick smoke test (1 minute)"
    echo "  basic     - Basic functionality test (5 minutes)"
    echo "  advanced  - Advanced features test (10 minutes)"
    echo "  complex   - Complex scenarios test (15 minutes)"
    echo "  load      - Load and stress test (10 minutes)"
    echo "  full      - Complete test suite (30 minutes)"
    echo "  all       - Run all tests"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 smoke      # Run smoke test only"
    echo "  $0 load       # Run load test only"
    echo "  $0 all        # Run all tests"
    echo "  $0 help       # Show this help"
}

# Parse command line arguments
case "${1:-all}" in
    "smoke")
        run_test "smoke"
        ;;
    "basic")
        run_test "basic"
        ;;
    "advanced")
        run_test "advanced"
        ;;
    "complex")
        run_test "complex"
        ;;
    "load")
        run_test "load"
        ;;
    "full")
        run_test "full"
        ;;
    "all")
        run_all_tests
        ;;
    "help")
        show_help
        ;;
    *)
        echo "❌ Unknown option: $1"
        echo "Use '$0 help' for available options"
        exit 1
        ;;
esac

echo ""
echo "✅ Test execution completed!"
echo "📁 Results saved to __tests__/temp/ directory"
