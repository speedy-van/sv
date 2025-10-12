import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // عدّل الأسماء لتطابق الموديلات الحقيقية عندك في Prisma schema
  // افترض DriverApplication و Employee
  const driverApplicants = await prisma.driverApplication.findMany();
  const employees = await prisma.user.findMany({ where: { role: 'admin' } }); // افترض User مع role

  const payload = {
    meta: {
      exportedAt: new Date().toISOString(),
      counts: {
        driverApplicants: driverApplicants.length,
        employees: employees.length,
      },
    },
    driverApplicants,
    employees,
  };

  const dir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `critical_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log('Wrote', file);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });