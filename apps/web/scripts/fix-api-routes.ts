import fs from 'fs';
import path from 'path';

const apiRoutes = [
  'src/app/api/driver/shifts/route.ts',
  'src/app/api/driver/onboarding/route.ts',
  'src/app/api/driver/notifications/read/route.ts',
  'src/app/api/driver/location/route.ts',
  'src/app/api/driver/jobs/[id]/route.ts',
  'src/app/api/driver/jobs/[id]/route/route.ts',
  'src/app/api/driver/jobs/[id]/progress/route.ts',
  'src/app/api/driver/jobs/active/route.ts',
  'src/app/api/driver/jobs/[id]/media/route.ts',
  'src/app/api/driver/jobs/[id]/decline/route.ts',
  'src/app/api/driver/incidents/route.ts',
  'src/app/api/driver/jobs/[id]/claim/route.ts',
  'src/app/api/driver/jobs/[id]/accept/route.ts',
  'src/app/api/driver/documents/route.ts',
  'src/app/api/driver/dashboard/route.ts',
  'src/app/api/driver/availability/windows/route.ts',
  'src/app/api/driver/availability/route.ts',
  'src/app/api/driver/session/route.ts',
  'src/app/api/driver/jobs/available/route.ts',
  'src/app/api/driver/schedule/route.ts',
  'src/app/api/driver/performance/route.ts',
  'src/app/api/driver/schedule/export/route.ts',
  'src/app/api/driver/push-subscription/route.ts',
];

apiRoutes.forEach(routePath => {
  try {
    const fullPath = path.join(process.cwd(), routePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Check if dynamic export already exists
      if (!content.includes('export const dynamic')) {
        // Add dynamic export after the first import statement
        const lines = content.split('\n');
        let insertIndex = 0;

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            insertIndex = i + 1;
          } else if (lines[i].trim() === '') {
            continue;
          } else {
            break;
          }
        }

        lines.splice(
          insertIndex,
          0,
          '',
          "export const dynamic = 'force-dynamic';"
        );
        content = lines.join('\n');

        fs.writeFileSync(fullPath, content);
        console.log(`✅ Added dynamic export to ${routePath}`);
      } else {
        console.log(`⏭️  Dynamic export already exists in ${routePath}`);
      }
    } else {
      console.log(`❌ File not found: ${routePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${routePath}:`, error);
  }
});

console.log('🎉 API routes fix completed!');
