export interface QaContent {
  text?: string;
  images?: string[];
  videoUrl?: string;
  files?: string[];
}

// Backward compatibility — existing code uses Question with { type, content, files }
export type Question = QaContent;
