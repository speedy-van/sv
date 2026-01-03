import fs from 'fs';

const schemaPath = 'packages/shared/prisma/schema.prisma';
let content = fs.readFileSync(schemaPath, 'utf8');

// Replace @id with @id @default(cuid())
content = content.replace(/(@id)\s*\n/g, '@id @default(cuid())\n');

// Replace updatedAt DateTime with updatedAt DateTime @updatedAt
content = content.replace(/updatedAt\s+DateTime\s*\n/g, 'updatedAt   DateTime @updatedAt\n');

fs.writeFileSync(schemaPath, content);
console.log('Schema updated successfully!');
