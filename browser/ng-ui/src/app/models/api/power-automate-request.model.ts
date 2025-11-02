export interface PowerAutomateRequest<T> {
  actionType: 'save' | 'saveJha' | 'revoke' | 'revokeJha' | 'delete' | 'authenticate' | 'getAll' | 'create' | 'newTest' |
  'addInstrumentationLog';
  url?: string;
  workForm?: T;
  jhaForm?: T;
  user?: T;
  instrumentationLog?: T;
  space?: T;
  spaceTestResult?: T;
  id?: number | string;
  email?: string;
  password?: string;
}