module.exports = {
  // TypeScript/React files
  'src/**/*.{ts,tsx}': [
    'eslint --fix', // Auto-fix what can be fixed
    'prettier --write',
  ],
  
  // JSON files
  '*.json': ['prettier --write'],
  
  // Markdown files
  '*.md': ['prettier --write'],
  
  // CSS/SCSS files (if you use them)
  'src/**/*.{css,scss}': ['prettier --write'],
};
