const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'ahmadalwakai76@gmail.com';
  const password = 'Aa234311Aa@@@';
  const role = 'admin';
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
      name: 'Admin',
      phone: '',
    }
  });
  
  console.log('✅ User created successfully:');
  console.log({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  prisma.$disconnect();
});
