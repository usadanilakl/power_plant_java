export interface PowerAutomateRequest<T> {
  actionType: 'save' | 'saveJha' | 'revoke' | 'revokeJha' | 'delete' | 'authenticate' | 'getAll' | 'create' | 'newTest';
  url?: string;
  workForm?: T;
  jhaForm?: T;
  user?: T;
  space?: T;
  spaceTestResult?: T;
  id?: number | string;
  email?: string;
  password?: string;
}