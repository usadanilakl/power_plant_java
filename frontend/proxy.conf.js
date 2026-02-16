const fs = require('fs');
const path = require('path');

// Try to read the actual backend port from the file written by Spring Boot
function getBackendPort() {
  const portFilePath = path.join(__dirname, '..', 'backend-port.txt');

  try {
    if (fs.existsSync(portFilePath)) {
      const port = fs.readFileSync(portFilePath, 'utf8').trim();
      console.log(`[Proxy] Using backend port ${port} from ${portFilePath}`);
      return port;
    }
  } catch (err) {
    console.warn(`[Proxy] Could not read backend port file: ${err.message}`);
  }

  // Fallback to environment variable or default
  const fallbackPort = process.env.BACKEND_PORT || '8082';
  console.log(`[Proxy] Using fallback backend port ${fallbackPort}`);
  return fallbackPort;
}

const BACKEND_PORT = getBackendPort();
const target = `http://localhost:${BACKEND_PORT}`;

const config = {};
const paths = [
  '/api', '/ng', '/work-requests-api', '/jha-api',
  '/images-api', '/uploads', '/power-automate',
  '/actuator', '/browser', '/print', '/server'
];

paths.forEach(path => {
  config[path] = { target, secure: false, changeOrigin: true };
});

module.exports = config;
