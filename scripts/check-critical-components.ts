#!/usr/bin/env tsx
/**
 * Critical Components Checker
 * Verifies that all critical booking components exist in the codebase
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface CriticalComponent {
  name: string;
  file: string;
  patterns: string[];
  required: boolean;
}

const CRITICAL_COMPONENTS: CriticalComponent[] = [
  {
    name: 'Booking Reference Alert',
    file: 'apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx',
    patterns: [
      'data-testid="booking-reference-alert"',
      'Booking reference (pending payment)',
      'formData.step2.bookingReference',
    ],
    required: true,
  },
  {
    name: 'Price Calendar Cards',
    file: 'apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx',
    patterns: [
      'displayedPriceCalendar',
      'selectedDayKey',
      'SimpleGrid',
    ],
    required: true,
  },
];

function checkComponent(component: CriticalComponent): { success: boolean; missing: string[] } {
  const filePath = join(process.cwd(), component.file);
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const missing: string[] = [];

    for (const pattern of component.patterns) {
      if (!content.includes(pattern)) {
        missing.push(pattern);
      }
    }

    return {
      success: missing.length === 0,
      missing,
    };
  } catch (error) {
    console.error(`❌ Error reading file: ${component.file}`);
    return { success: false, missing: ['FILE_NOT_FOUND'] };
  }
}

function main() {
  console.log('🔍 Checking critical booking components...\n');

  let allPassed = true;
  const results: Array<{ component: CriticalComponent; result: ReturnType<typeof checkComponent> }> = [];

  for (const component of CRITICAL_COMPONENTS) {
    const result = checkComponent(component);
    results.push({ component, result });

    if (!result.success && component.required) {
      allPassed = false;
    }
  }

  // Print results
  console.log('Results:\n');
  for (const { component, result } of results) {
    if (result.success) {
      console.log(`✅ ${component.name}`);
      console.log(`   File: ${component.file}`);
      console.log(`   All patterns found: ${component.patterns.length}/${component.patterns.length}\n`);
    } else {
      console.log(`❌ ${component.name}`);
      console.log(`   File: ${component.file}`);
      console.log(`   Missing patterns (${result.missing.length}):`);
      for (const pattern of result.missing) {
        console.log(`     - ${pattern}`);
      }
      console.log('');
    }
  }

  // Final summary
  console.log('─'.repeat(60));
  if (allPassed) {
    console.log('✅ All critical components verified!\n');
    process.exit(0);
  } else {
    console.log('❌ Some critical components are missing or incomplete!\n');
    console.log('⚠️  This means critical booking functionality may be broken.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check git history:');
    console.log('   git log -p -S "booking-reference-alert" -- "WhoAndPaymentStep_Simple.tsx"');
    console.log('');
    console.log('2. See documentation:');
    console.log('   apps/web/src/app/booking-luxury/CRITICAL_COMPONENTS.md');
    console.log('');
    process.exit(1);
  }
}

main();
