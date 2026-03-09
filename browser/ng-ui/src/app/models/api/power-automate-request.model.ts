export interface PowerAutomateRequest<T> {
  actionType: 'save' | 'saveJha' | 'revoke' | 'revokeJha' | 'delete' | 'authenticate' | 'getAll' | 'create' | 'newTest' |
  'addInstrumentationLog' | 'getAllInstruments' | 'addInstrument';
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
  localUuid?: string;
  attachments?: { fileName: string; contentType: string; base64Content: string }[];
}