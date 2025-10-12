// Quick verification script to check if the dataset validation fix is applied
// Run this in browser console on the booking-luxury page

console.log('🔍 Checking Dataset Validation Fix v2...\n');

// Check 1: Look for version comment in source
fetch('/booking-luxury')
  .then(response => response.text())
  .then(html => {
    const hasVersionComment = html.includes('Dataset Validation Fix v2');
    console.log(`✅ Version comment check: ${hasVersionComment ? 'FOUND' : 'NOT FOUND'}`);
    if (!hasVersionComment) {
      console.warn('⚠️ Version comment not found - may need cache clear or rebuild');
    }
  })
  .catch(err => console.error('❌ Failed to check version:', err));

// Check 2: Monitor console for new log patterns
const originalLog = console.log;
const originalWarn = console.warn;
let foundNewLogs = false;

console.log = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('Starting image validation') || 
      msg.includes('Image coverage check') ||
      msg.includes('Mapped') && msg.includes('items')) {
    foundNewLogs = true;
    console.info('✅ Found new debug logs - fix is active!');
  }
  originalLog.apply(console, args);
};

console.warn = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('Low image coverage') && msg.includes('Using fallback')) {
    console.info('✅ Found new warning format - fix is active!');
    foundNewLogs = true;
  }
  originalWarn.apply(console, args);
};

// Check 3: Look for old error pattern
const originalError = console.error;
let foundOldError = false;

console.error = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('Dataset image coverage insufficient')) {
    foundOldError = true;
    console.warn('⚠️ ALERT: Old error pattern detected! Cache may need clearing.');
  }
  originalError.apply(console, args);
};

// Summary after 5 seconds
setTimeout(() => {
  console.log('\n📊 Verification Summary:');
  console.log(`   New logs detected: ${foundNewLogs ? '✅ YES' : '⚠️ NO'}`);
  console.log(`   Old error detected: ${foundOldError ? '❌ YES (clear cache!)' : '✅ NO'}`);
  
  if (foundNewLogs && !foundOldError) {
    console.log('\n🎉 Fix is working correctly!');
  } else if (foundOldError) {
    console.log('\n⚠️ Old code still running - try:');
    console.log('   1. Hard reload (Ctrl+Shift+R)');
    console.log('   2. Clear cache + reload');
    console.log('   3. Restart dev server');
  } else {
    console.log('\n⏳ Dataset may not have loaded yet - wait and check logs');
  }
}, 5000);

console.log('\n⏳ Monitoring for 5 seconds...\n');
