const fs = require('fs');
const path = require('path');

console.log('Running postbuild script...');

// Ensure the dist/client directory exists
const distDir = path.join(process.cwd(), 'dist', 'client');
if (!fs.existsSync(distDir)) {
  console.log(`Creating directory: ${distDir}`);
  fs.mkdirSync(distDir, { recursive: true });
}

// Create a basic index.html if it doesn't exist
const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.log('Creating default index.html...');
  const defaultHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GastroManager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;
  
  fs.writeFileSync(indexPath, defaultHtml, 'utf8');
}

console.log('Postbuild script completed successfully!');
