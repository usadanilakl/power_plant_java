
export interface ClipboardSection<T = any> {
  id: string;
  name: string;
  description?: string;
  items: T[];
  createdAt: Date;
  updatedAt: Date;
  type: string; // e.g., 'LotoPoint', 'Equipment', etc.
}

export interface ClipboardState<T = any> {
  sections: ClipboardSection<T>[];
  activeSection: string | null;
}
