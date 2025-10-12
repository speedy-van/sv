
console.log('📊 Production Monitoring Active');
console.log('🔍 Health check available at: /api/health');
console.log('📈 System monitoring started');

setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  console.log(`📊 [${new Date().toISOString()}] Memory: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB, Uptime: ${Math.round(uptime)}s`);
}, 60000); // Every minute
