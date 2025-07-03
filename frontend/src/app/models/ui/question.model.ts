export interface Question{
    type: 'text' | 'file' | 'video';
    content: string;
}