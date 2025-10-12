const { spawn } = require('child_process');
const path = require('path');

console.log('Starting development server...');

const server = spawn('pnpm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'apps', 'web'),
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Wait for server to start
setTimeout(() => {
  console.log('Server should be running now...');
}, 5000);
