# Dual Provider Address Autocomplete Troubleshooting Guide

## 🚨 Current Issue: 400 Bad Request Error

You're seeing `GET http://localhost:3000/api/address/autocomplete?query=g21 400 (Bad Request)` errors. Here's how to debug and fix this issue.

## 🔍 Step 1: Check Debug Endpoint

First, visit the debug endpoint to check system configuration:

```
http://localhost:3000/api/address/debug
```

This will show you:
- Environment variable status
- Import status of all modules
- Postcode validation tests
- Service health status

## 🔧 Step 2: Check Environment Variables

Make sure your `.env.local` file contains:

```bash
# Google Places API Key (Optional - will use Mapbox if not set)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_places_api_key_here

# Mapbox API Key (Required - fallback provider)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg
```

## 🧪 Step 3: Test the System

Visit the test endpoint to verify basic functionality:

```
http://localhost:3000/api/address/test?query=G21
```

## 📊 Step 4: Check Browser Console

Open your browser's developer console and look for:

1. **Configuration logs**: Should see `DualProviderService config:` with provider status
2. **Request logs**: Should see `DualProviderService: Searching for query:` messages
3. **API request logs**: Should see `Mapbox API request:` with the full URL
4. **Response logs**: Should see `Mapbox API response:` with the API response

## 🐛 Common Issues & Solutions

### Issue 1: Validation Schema Error
**Error**: `Invalid parameters` or `Invalid query parameters`

**Solution**: The API route validation has been fixed. Make sure you're using the latest code.

### Issue 2: Google API Key Missing
**Error**: Google Places API not configured

**Solution**: 
- Either add a Google API key to `.env.local`
- Or the system will automatically use Mapbox as primary provider

### Issue 3: Mapbox API Issues
**Error**: `Mapbox API error: 401` or `Mapbox API error: 403`

**Solution**: 
- Check if the Mapbox token is valid
- Verify the token has geocoding permissions
- Check if you've exceeded API limits

### Issue 4: Network Issues
**Error**: `Network error occurred`

**Solution**:
- Check your internet connection
- Verify the API endpoints are accessible
- Check for CORS issues

### Issue 5: Import Errors
**Error**: Module not found or import errors

**Solution**:
- Restart your development server
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `pnpm install`

## 🔄 Step 5: Restart Development Server

After making changes, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
pnpm dev
```

## 📝 Step 6: Check the Health Endpoint

Visit the health endpoint to see provider status:

```
http://localhost:3000/api/address/health
```

## 🎯 Expected Behavior

When working correctly, you should see:

1. **Console logs** showing provider configuration
2. **API requests** to Mapbox geocoding API
3. **Successful responses** with address suggestions
4. **No 400 errors** in the browser console

## 🚀 Quick Fix Commands

If you're still having issues, try these commands:

```bash
# 1. Clear Next.js cache
rm -rf .next

# 2. Reinstall dependencies
pnpm install

# 3. Restart development server
pnpm dev
```

## 📞 Debug Information to Collect

If the issue persists, collect this information:

1. **Debug endpoint output**: `http://localhost:3000/api/address/debug`
2. **Browser console logs**: Copy all console output
3. **Network tab**: Check the actual API request/response
4. **Environment variables**: Verify `.env.local` contents

## 🔧 Manual API Test

You can manually test the API using curl:

```bash
# Test with a simple query
curl "http://localhost:3000/api/address/autocomplete?query=ML3"

# Test with a full postcode
curl "http://localhost:3000/api/address/autocomplete?query=ML3%200DG"
```

## 🎉 Success Indicators

The system is working correctly when you see:

- ✅ Debug endpoint shows all imports successful
- ✅ Test endpoint returns successful results
- ✅ Browser console shows provider configuration
- ✅ Address input shows suggestions dropdown
- ✅ No 400 errors in console

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the debug endpoint** first
2. **Verify environment variables** are set correctly
3. **Restart the development server**
4. **Check browser console** for detailed error messages
5. **Test with curl** to isolate frontend vs backend issues

The system is designed to be robust and should work with just Mapbox if Google isn't configured. The 400 error suggests a validation issue that should now be resolved with the updated API route.
