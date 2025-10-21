export interface PowerAutomateRequest<T> {
  actionType: 'save' | 'saveJha' | 'revoke' | 'revokeJha' | 'delete';
  url?: string;
  workForm?: T;
  jhaForm?: T;
  id?: string;
}