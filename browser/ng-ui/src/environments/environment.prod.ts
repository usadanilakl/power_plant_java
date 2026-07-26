export const environment = {
  production: true,
  serverUrl: 'https://jgportal.jpowerusa.com',
  // Supabase secondary auth authority. Leave blank to run hub-only (no fallback).
  // Fill from Dashboard → Project Settings → API. anonKey is public (safe in the bundle).
  supabase: {
    url: 'https://xvrtgccxtsjjwznqkznv.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2cnRnY2N4dHNqand6bnFrem52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjY2NzUsImV4cCI6MjA3NTU0MjY3NX0.NHdnsZll17e88i8pDSj1N2CLx4kCKzV8TfA0jKaaaGM',
  },
  // Optional PA "auth gateway": when set, ALL Power Automate submissions go through this single
  // JWT-verifying flow instead of directly to paFlowUrls, so the real flow URLs can leave this bundle.
  // Blank = current behavior (direct to paFlowUrls). See project/architecture/supabase/pa-gateway.md.
  paGatewayUrl: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/09/workflows/af10c7ab37e14c74a7856e2cb91bb554/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=UN51rtymZs8JpY8lKXvvo-9Xx8XB0gwOtKSWXmVnGLo',
  // PA flow URLs removed from the client bundle — all Power Automate traffic goes through paGatewayUrl
  // (the JWT-verifying gateway). Kept as empty strings so the now-unused direct-branch code compiles.
  powerAutomateUrl: '',
  paFlowUrls: {
    workRequest: '',
    jha: '',
    confinedSpace: '',
    instrument: '',
    fieldList: '',
    inventory: '',
    sds: '',
    qualifications: ''
  },
  emailRecipient: 'jgportal@jpowerusa.com',
  emailCcRecipients: 'jgportal@jpowerusa.com',
  retryAttempts: 3,
  retryDelayMs: 2000,
};
