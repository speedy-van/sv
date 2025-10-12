/**
 * Environment Variables Check for Address Autocomplete
 * Run this from Next.js app to verify API keys are loaded
 */

console.log('🔍 Checking Environment Variables for Address Autocomplete...\n');

console.log('Google Maps API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 
  `✅ Found: ${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 20)}...` : 
  '❌ Not found');

console.log('Mapbox Token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 
  `✅ Found: ${process.env.NEXT_PUBLIC_MAPBOX_TOKEN.substring(0, 20)}...` : 
  '❌ Not found');

// Test the actual values in the service
const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';

console.log('\n📋 Configuration that will be used:');
console.log('- Google API Key:', googleKey ? `${googleKey.substring(0, 20)}...` : 'MISSING');
console.log('- Mapbox Token:', mapboxToken ? `${mapboxToken.substring(0, 20)}...` : 'MISSING');
console.log('- Google Enabled:', !!googleKey);
console.log('- Mapbox Enabled:', !!mapboxToken);

export {};