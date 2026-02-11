export interface IAttachment {
  fileName: string;
  contentType: string;
  base64Content: string;
  thumbnailBase64?: string;
  type: 'photo' | 'signature' | 'document';
}
