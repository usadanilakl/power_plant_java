const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4000;

const getBrowserPath = () => {
  if (process.pkg) {
    // Running as packaged executable - browser folder is OUTSIDE the exe
    const exePath = process.execPath;
    const exeDir = path.dirname(exePath);
    return path.join(exeDir, 'browser');
  } else {
    // Running as Node script - browser folder is in dist
    return path.join(__dirname, 'dist', 'loto-boxes', 'browser');
  }
};

const browserPath = getBrowserPath();

console.log('='.repeat(50));
console.log('Server Configuration:');
console.log('='.repeat(50));
console.log('Running as:', process.pkg ? 'EXECUTABLE' : 'Node script');
console.log('Browser path:', browserPath);
console.log('Path exists:', fs.existsSync(browserPath));

if (fs.existsSync(browserPath)) {
  const files = fs.readdirSync(browserPath);
  console.log('Files in browser folder:', files.slice(0, 5).join(', '), files.length > 5 ? '...' : '');
}

console.log('='.repeat(50));

// Serve static files from the browser folder
app.use(express.static(browserPath, {
  maxAge: '1d',
  etag: false,
  index: 'index.html'
}));

// Fallback to index.html for Angular routing
app.get('*', (req, res) => {
  const indexPath = path.join(browserPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: index.html not found at:', indexPath);
    return res.status(500).send(`
      <h1>Error: Application files not found</h1>
      <p>Expected location: ${indexPath}</p>
      <p>Please ensure the 'browser' folder is in the same directory as start.exe</p>
    `);
  }
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

app.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}`);
  console.log(`✓ Serving files from: ${browserPath}`);
  console.log('\nPress Ctrl+C to stop the server');
});