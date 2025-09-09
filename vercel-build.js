const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running custom build script...');

// Create dist/client directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist', 'client');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(`Created directory: ${distDir}`);
}

// Run the build
console.log('Running npm run build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
