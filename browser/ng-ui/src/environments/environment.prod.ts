export const environment = {
  production: true,
  serverUrl: 'https://jgportal.jpowerusa.com',
  powerAutomateUrl:
    'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms',
  paFlowUrls: {
    workRequest:
      'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0b5c62d6db654dffb887e4f6b81f1cf3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=UG09p5mlwthFNeQ_tndR4esVZctOfH0WHrIhYyl_lRM',
    jha: 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f5fd7de804c1461e82a22c274a4f4dac/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=M6uJ_xAu7gvpHYzxqmRRJvKZHpQvGNlMOY4jBY3O8kc',
    confinedSpace: '',
  },
  emailRecipient: 'operations@jpowerusa.com',
  emailCcRecipients: 'dklokov@jpowerusa.com;sowens@jpowerusa.com;rgarcia@jpowerusa.com;jnoble@jpowerusa.com;agorelik@jpowerusa.com',
  retryAttempts: 3,
  retryDelayMs: 2000,
};
