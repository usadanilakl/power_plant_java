export const environment = {
  production: false,
  apiUrl: '/ng',
  baseApiUrl: '',
  syncServerUrl: 'http://localhost:8090',
  baseHref: '/',
  // Base URL that gets encoded into QR labels. The path segment after this
  // must be `{tagNumber}` — the hub's QrTrafficController redirects
  // /qr/{tagNumber} → /app/qr/equipment/{tagNumber}.
  qrBaseUrl: 'https://jgportal.jpowerusa.com/qr/'
};