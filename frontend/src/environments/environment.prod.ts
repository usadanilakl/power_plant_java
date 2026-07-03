export const environment = {
    production: true,
    apiUrl: '/ng',
    baseApiUrl: '',
    syncServerUrl: 'http://localhost:8090',
    baseHref: '/app/',
    // Base URL that gets encoded into QR labels. The path segment after this
    // must be `{tagNumber}` — the hub's QrTrafficController redirects
    // /qr/{tagNumber} → /app/qr/equipment/{tagNumber}.
    qrBaseUrl: 'https://jgportal.jpowerusa.com/qr/'
  };