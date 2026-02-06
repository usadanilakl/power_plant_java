/**
 * Represents a single media item (image or video) with optional caption
 */
export interface QaMediaItem {
  type: 'image' | 'video';
  url: string;
  caption?: string;  // HTML content allowed for rich captions
}

export interface QaContent {
  text?: string;           // Introduction/general text
  media?: QaMediaItem[];   // Ordered array of images and videos with captions
  files?: string[];        // Array of file/resource URLs

  // DEPRECATED: Keep for backward compatibility
  /** @deprecated Use media array instead */
  images?: string[];
  /** @deprecated Use media array instead */
  videoUrl?: string;
}

// Backward compatibility — existing code uses Question with { type, content, files }
export type Question = QaContent;
