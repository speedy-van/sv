/**
 * 🔍 Quick Version Check Script
 * Run this in browser console to verify the fix is loaded
 */

console.clear();
console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 Dataset Validation Fix v3 - Version Check');
console.log('═══════════════════════════════════════════════════════════\n');

// Check for version log
setTimeout(() => {
  console.log('\n📋 Expected to see:');
  console.log('   🚀 WhereAndWhatStep loaded - Dataset Validation Fix v3 (2025-10-07T01:00:00Z)');
  console.log('\n📋 Should NOT see:');
  console.log('   ❌ [DATASET] Failed to load official dataset');
  console.log('   ❌ Dataset image coverage insufficient');
  console.log('\n⏳ Refresh the page (Ctrl+Shift+R) and watch console...\n');
  console.log('═══════════════════════════════════════════════════════════');
}, 1000);
