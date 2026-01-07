const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ 
    where: { email: 'ahmadalwakai76@gmail.com' } 
  });
  
  if (user) {
    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
  } else {
    console.log('User NOT FOUND');
    
    // List all users
    const users = await prisma.user.findMany({
      take: 10,
      select: { id: true, email: true, role: true, name: true }
    });
    console.log('\nFirst 10 users in database:');
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
