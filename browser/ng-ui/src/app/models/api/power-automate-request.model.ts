export interface PowerAutomateRequest<T> {
  actionType: 'save' | 'revoke' | 'delete';
  url?: string;
  workForm?: T;
  id?: string;
}