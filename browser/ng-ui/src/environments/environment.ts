export const environment = {
  production: false,
  // serverUrl: 'http://192.168.12.146:8085',
  serverUrl: 'http://localhost:8085',
  // Supabase secondary auth authority. Leave blank to run hub-only (no fallback).
  // Fill from Dashboard → Project Settings → API. anonKey is public (safe in the bundle).
  supabase: {
    url: 'https://xvrtgccxtsjjwznqkznv.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2cnRnY2N4dHNqand6bnFrem52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjY2NzUsImV4cCI6MjA3NTU0MjY3NX0.NHdnsZll17e88i8pDSj1N2CLx4kCKzV8TfA0jKaaaGM',
  },
  // Optional PA "auth gateway": when set, ALL Power Automate submissions go through this single
  // JWT-verifying flow instead of directly to paFlowUrls, so the real flow URLs can leave this bundle.
  // Blank = current behavior (direct to paFlowUrls). See project/architecture/supabase/pa-gateway.md.
  paGatewayUrl: '',
  powerAutomateUrl: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms',
  paFlowUrls: {
    workRequest: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0b5c62d6db654dffb887e4f6b81f1cf3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=UG09p5mlwthFNeQ_tndR4esVZctOfH0WHrIhYyl_lRM',
    jha: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f5fd7de804c1461e82a22c274a4f4dac/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=M6uJ_xAu7gvpHYzxqmRRJvKZHpQvGNlMOY4jBY3O8kc',
    confinedSpace: '',
    instrumentLog: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/832a87fa6bd042459fbb042c2163f25a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CskQMxLQfynMFCI7AxUQtQWVIzVmkTydg9dxDN1-1M4',
    instrument: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/832a87fa6bd042459fbb042c2163f25a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CskQMxLQfynMFCI7AxUQtQWVIzVmkTydg9dxDN1-1M4',
    fieldList: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e0bad99434cc416eb14e7f1e6049b18f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=lpx4Wm2gB8rap8XYk3MwAD97LaZg52oTuDKjwHoEw5k',
    inventory: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms',
    sds: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/609426ab3c174235af5ade023ffee19c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vzhAO-xxW7xXdWZ0CuolI5zRNzcUKV0uSXd9Rjn8dZU',
    qualifications: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/18/workflows/fa8c206fc2d14bb49ee427ddceb4761e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Kcgp5jGtyk9ov8pee-Y96x9WfvHytldvg8QDKYQOO4w'
  },
  emailRecipient: 'jgportal@jpowerusa.com',
  emailCcRecipients: 'jgportal@jpowerusa.com',
  retryAttempts: 3,
  retryDelayMs: 2000,
};
