import { Injectable, signal, computed, inject, effect } from '@angular/core';
import {
  ClipboardSection,
  ClipboardModel,
  ClipboardState,
} from './clipboard.model';
import { ClipboardLocalStorageService } from './clibboard-local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private localStorageService = inject(ClipboardLocalStorageService);

  private clipboardState = signal<ClipboardModel>(new ClipboardModel());

  // Expose readonly signals
  sections = computed(() => this.clipboardState().sections);
  activeSection = computed(() => {
    const activeId = this.clipboardState().activeSection;
    return (
      this.clipboardState().sections.find((s) => s.id === activeId) || null
    );
  });
  isClipboardExpanded = computed(() => this.clipboardState().isExpanded);

  constructor() {
    // Load from localStorage on initialization
    const saved = this.localStorageService.loadClipboard();
    if (saved) {
      this.clipboardState.set(saved);
    }

    // Auto-save to localStorage whenever state changes
    effect(() => {
      const state = this.clipboardState();
      state.lastUpdated = new Date();
      this.localStorageService.saveClipboard(state);
    });
  }

  /**
   * Add items to clipboard with automatic section management
   * Creates section if it doesn't exist based on objectType
   */
  addItems(items: any[]): void {
    if (!items || items.length === 0) return;

    // Determine entity type from first item's objectType
    const objectType = items[0].objectType;
    if (!objectType) {
      console.warn('Item missing objectType property:', items[0]);
      return;
    }

    this.clipboardState.update((state) => {
      // Check if section exists for this objectType
      let section = state.sections.find((s) => s.type === objectType);

      if (!section) {
        // Create new section if it doesn't exist
        section = {
          id: this.generateId(),
          name: this.formatSectionName(objectType),
          type: objectType,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.sections.push(section);
      }

      // Add items to section
      const existingIds = new Set(section.items.map((item) => item.id));
      const newItems = items.filter((item) => !existingIds.has(item.id));
      section.items.push(...newItems);

      // Keep only the 15 most recent items
      if (section.items.length > 15) {
        section.items = section.items.slice(-15);
      }
      section.updatedAt = new Date();
      state.activeSection = section.id;

      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: new Date(),
      });
    });
  }

  /**
   * Add single item to clipboard
   */
  addItem(item: any): void {
    this.addItems([item]);
  }

  /**
   * Format objectType to human-readable section name
   */
  private formatSectionName(objectType: string): string {
    // Convert camelCase or PascalCase to Title Case
    return objectType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Create a new section
   */
  createSection(name: string, type: string): void {
    const newSection: ClipboardSection = {
      id: this.generateId(),
      name,
      type,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.clipboardState.update((state) => {
      state.sections.push(newSection);
      state.activeSection = newSection.id;
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: new Date(),
      });
    });
  }

  /**
   * Add items to a specific section
   */
  addItemsToSection(sectionId: string, items: any[]): void {
    this.clipboardState.update((state) => {
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        section.items.push(...items);
        section.updatedAt = new Date();
      }
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: new Date(),
      });
    });
    console.log(`Added items to section "${sectionId}":`, items);
  }

  /**
   * Add item to active section
   */
  addItemToActiveSection(item: any): void {
    const activeId = this.clipboardState().activeSection;
    if (activeId) {
      this.addItemsToSection(activeId, [item]);
    }
  }

  /**
   * Add items to active section
   */
  addItemsToActiveSection(items: any[]): void {
    const activeId = this.clipboardState().activeSection;
    if (activeId) {
      this.addItemsToSection(activeId, items);
    }
  }

  /**
   * Set active section
   */
  setActiveSection(sectionId: string): void {
    this.clipboardState.update((state) => {
      return new ClipboardModel({
        sections: state.sections,
        activeSection: sectionId,
        isExpanded: state.isExpanded,
        lastUpdated: new Date(),
      });
    });
  }

  /**
   * Toggle clipboard expanded state
   */
  toggleExpanded(): void {
    this.clipboardState.update((state) => {
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: !state.isExpanded,
        lastUpdated: new Date(),
      });
    });
  }

  /**
   * Delete a section
   */
  deleteSection(sectionId: string): void {
    this.clipboardState.update((state) => {
      const filtered = state.sections.filter((s) => s.id !== sectionId);
      const newActiveId =
        state.activeSection === sectionId
          ? filtered.length > 0
            ? filtered[0].id
            : null
          : state.activeSection;

      return new ClipboardModel({
        sections: filtered,
        activeSection: newActiveId,
        isExpanded: state.isExpanded,
        lastUpdated: new Date(),
      });
    });
  }

  /**
   * Clear all items from a section
   */
  clearSection(sectionId: string): void {
    this.clipboardState.update((state) => {
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        section.items = [];
        section.updatedAt = new Date();
      }
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: new Date(),
      });
    });
  }

  /**
   * Remove item from section by index
   */
  removeItemFromSection(sectionId: string, itemIndex: number): void {
    this.clipboardState.update((state) => {
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        section.items = section.items.filter((_, i) => i !== itemIndex);
        section.updatedAt = new Date();
      }
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: new Date(),
      });
    });
  }

  /**
   * Get section by ID
   */
  getSection(sectionId: string): ClipboardSection | undefined {
    return this.clipboardState().sections.find((s) => s.id === sectionId);
  }

  /**
   * Get section by type (objectType)
   */
  getSectionByType(type: string): ClipboardSection | undefined {
    return this.clipboardState().sections.find((s) => s.type === type);
  }

  /**
   * Check if section exists by type (objectType)
   */
  sectionExists(type: string): boolean {
    return this.clipboardState().sections.some((s) => s.type === type);
  }

  /**
   * Get entire clipboard state
   */
  getClipboard(): ClipboardModel {
    return this.clipboardState();
  }

  /**
   * Clear entire clipboard
   */
  clearClipboard(): void {
    this.clipboardState.set(new ClipboardModel());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// import { Injectable, signal, computed, inject } from '@angular/core';
// import { ClipboardSection } from './clipboard.model';
// import { ClipboardLocalStorageService } from './clibboard-local-storage.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class ClipboardService {

//   private localStorageService = inject(ClipboardLocalStorageService);

//   private sectionsSubject = signal<ClipboardSection[]>([]);
//   private activeSectionIdSubject = signal<string | null>(null);

//   sections = this.sectionsSubject.asReadonly();
//   activeSection = computed(() => {
//     const activeId = this.activeSectionIdSubject();
//     return this.sectionsSubject().find((s) => s.id === activeId) || null;
//   });
//   isClipboardExpanded = signal<boolean>(false);

//   /**
//    * Add items to clipboard with automatic section management
//    * Creates section if it doesn't exist based on objectType
//    */
//   addItems(items: any[]): void {
//     if (!items || items.length === 0) return;

//     // Determine entity type from first item's objectType
//     const objectType = items[0].objectType;
//     if (!objectType) {
//       console.warn('Item missing objectType property:', items[0]);
//       return;
//     }

//     // Check if section exists for this objectType
//     let section = this.sectionsSubject().find((s) => s.type === objectType);

//     if (!section) {
//       // Create new section if it doesn't exist
//       this.createSection(this.formatSectionName(objectType), objectType);
//       section = this.sectionsSubject().find((s) => s.type === objectType)!;
//     }

//     // Add items to section
//     this.addItemsToSection(section.id, items);

//     // Set as active section
//     this.setActiveSection(section.id);
//   }

//   /**
//    * Add single item to clipboard
//    */
//   addItem(item: any): void {
//     this.addItems([item]);
//   }

//   /**
//    * Format objectType to human-readable section name
//    */
//   private formatSectionName(objectType: string): string {
//     // Convert camelCase or PascalCase to Title Case
//     return objectType
//       .replace(/([A-Z])/g, ' $1')
//       .replace(/^./, (str) => str.toUpperCase())
//       .trim();
//   }

//   /**
//    * Create a new section
//    */
//   createSection(name: string, type: string): void {
//     const newSection: ClipboardSection = {
//       id: this.generateId(),
//       name,
//       type,
//       items: [],
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     this.sectionsSubject.update((sections) => [...sections, newSection]);
//     this.setActiveSection(newSection.id);
//   }

//   /**
//    * Add items to a specific section
//    */
//   addItemsToSection(sectionId: string, items: any[]): void {
//     this.sectionsSubject.update((sections) =>
//       sections.map((section) => {
//         if (section.id === sectionId) {
//           return {
//             ...section,
//             items: [...section.items, ...items],
//             updatedAt: new Date(),
//           };
//         }
//         return section;
//       })
//     );
//     console.log(`Added items to section "${sectionId}":`, items);
//     console.log('Total items in clipboard:', this.sectionsSubject());
//   }

//   /**
//    * Add item to active section
//    */
//   addItemToActiveSection(item: any): void {
//     const activeId = this.activeSectionIdSubject();
//     if (activeId) {
//       this.addItemsToSection(activeId, [item]);
//     }
//   }

//   /**
//    * Add items to active section
//    */
//   addItemsToActiveSection(items: any[]): void {
//     const activeId = this.activeSectionIdSubject();
//     if (activeId) {
//       this.addItemsToSection(activeId, items);
//     }
//   }

//   /**
//    * Set active section
//    */
//   setActiveSection(sectionId: string): void {
//     this.activeSectionIdSubject.set(sectionId);
//   }

//   /**
//    * Delete a section
//    */
//   deleteSection(sectionId: string): void {
//     this.sectionsSubject.update((sections) =>
//       sections.filter((s) => s.id !== sectionId)
//     );

//     // If deleted section was active, set first section as active
//     if (this.activeSectionIdSubject() === sectionId) {
//       const remaining = this.sectionsSubject();
//       this.activeSectionIdSubject.set(
//         remaining.length > 0 ? remaining[0].id : null
//       );
//     }
//   }

//   /**
//    * Clear all items from a section
//    */
//   clearSection(sectionId: string): void {
//     this.sectionsSubject.update((sections) =>
//       sections.map((section) => {
//         if (section.id === sectionId) {
//           return {
//             ...section,
//             items: [],
//             updatedAt: new Date(),
//           };
//         }
//         return section;
//       })
//     );
//   }

//   /**
//    * Remove item from section by index
//    */
//   removeItemFromSection(sectionId: string, itemIndex: number): void {
//     this.sectionsSubject.update((sections) =>
//       sections.map((section) => {
//         if (section.id === sectionId) {
//           return {
//             ...section,
//             items: section.items.filter((_, i) => i !== itemIndex),
//             updatedAt: new Date(),
//           };
//         }
//         return section;
//       })
//     );
//   }

//   /**
//    * Get section by ID
//    */
//   getSection(sectionId: string): ClipboardSection | undefined {
//     return this.sectionsSubject().find((s) => s.id === sectionId);
//   }

//   /**
//    * Get section by type (objectType)
//    */
//   getSectionByType(type: string): ClipboardSection | undefined {
//     return this.sectionsSubject().find((s) => s.type === type);
//   }

//   /**
//    * Check if section exists by type (objectType)
//    */
//   sectionExists(type: string): boolean {
//     return this.sectionsSubject().some((s) => s.type === type);
//   }

//   /**
//    * Generate unique ID
//    */
//   private generateId(): string {
//     return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   }
// }
