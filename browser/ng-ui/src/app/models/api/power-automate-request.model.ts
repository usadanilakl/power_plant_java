export interface PowerAutomateRequest<T> {
  url: string;
  data: T;
  entityKey: string;
  actionType: 'save' | 'update' | 'delete';
}