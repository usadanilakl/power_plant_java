export interface PowerAutomateRequest<T> {
  actionType: 'save' | 'saveJha' | 'revoke' | 'revokeJha' | 'delete' | 'authenticate' | 'getAll' | 'create';
  url?: string;
  workForm?: T;
  jhaForm?: T;
  user?: T;
  confinedSpace?: T;
  id?: string;
  email?: string;
  password?: string;
}