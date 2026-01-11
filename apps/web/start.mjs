#!/usr/bin/env node
/**
 * Start script with PORT environment variable support
 * Works on both Windows and Unix systems
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

console.log(`Starting Next.js server on ${host}:${port}...`);

// Use npx to run next from node_modules
const child = spawn('npx', ['next', 'start', '-H', host, '-p', port.toString()], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=1024'
  }
});

child.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
