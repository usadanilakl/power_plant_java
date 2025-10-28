export interface PowerAutomateRequest<T> {
  actionType: 'save' | 'saveJha' | 'revoke' | 'revokeJha' | 'delete' | 'authenticate' | 'getAll';
  url?: string;
  workForm?: T;
  jhaForm?: T;
  id?: string;
  email?: string;
  password?: string;
}