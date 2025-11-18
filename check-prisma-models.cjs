const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const models = Object.keys(prisma).filter(
  k => k[0] === k[0].toLowerCase() && !k.startsWith('$') && !k.startsWith('_')
).sort();

console.log('Total models:', models.length);
console.log('Models:', models.join(', '));
console.log('\nChecking specific models:');
console.log('- user:', typeof prisma.user);
console.log('- staff:', typeof prisma.staff);
console.log('- adminNotification:', typeof prisma.adminNotification);

prisma.$disconnect();
