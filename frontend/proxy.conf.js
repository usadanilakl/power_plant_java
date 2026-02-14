const BACKEND_PORT = process.env.BACKEND_PORT || '8082';
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
