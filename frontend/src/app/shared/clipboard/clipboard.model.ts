// export interface ClipboardSection<T = any> {
//   id: string;
//   name: string;
//   description?: string;
//   items: T[];
//   createdAt: Date;
//   updatedAt: Date;
//   type: string; // e.g., 'LotoPoint', 'Equipment', etc.
// }

// export interface ClipboardState<T = any> {
//   sections: ClipboardSection<T>[];
//   activeSection: string | null;
// }

/**
 * Generic clipboard section with typed items
 */
export interface ClipboardSection<T = any> {
  id: string;
  name: string;
  description?: string;
  type: string; // e.g., 'LotoPoint', 'Equipment', etc.
  items: T[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Complete clipboard state including UI state
 */
export interface ClipboardState<T = any> {
  sections: ClipboardSection<T>[];
  activeSection: string | null;
  isExpanded: boolean;
  lastUpdated: Date;
}

/**
 * Clipboard model with serialization support
 */
export class ClipboardModel implements ClipboardState<any> {
  sections: ClipboardSection<any>[] = [];
  activeSection: string | null = null;
  isExpanded: boolean = false;
  lastUpdated: Date = new Date();

  constructor(data: Partial<ClipboardState> = {}) {
    this.sections = data.sections ?? [];
    this.activeSection = data.activeSection ?? null;
    this.isExpanded = data.isExpanded ?? false;
    this.lastUpdated = data.lastUpdated ?? new Date();
  }

  /**
   * Serialize to JSON for localStorage
   */
  toJson(): any {
    return {
      sections: this.sections,
      activeSection: this.activeSection,
      isExpanded: this.isExpanded,
      lastUpdated: this.lastUpdated,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJson(json: any): ClipboardModel {
    return new ClipboardModel({
      sections: json.sections ?? [],
      activeSection: json.activeSection ?? null,
      isExpanded: json.isExpanded ?? false,
      lastUpdated: json.lastUpdated ? new Date(json.lastUpdated) : new Date(),
    });
  }
}

/**
 * Typed clipboard section for specific item types
 * Usage: ClipboardSection<LotoPointDto>
 */
export type TypedClipboardSection<T> = ClipboardSection<T>;
