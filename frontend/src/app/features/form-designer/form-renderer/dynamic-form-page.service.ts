import { Injectable, signal } from '@angular/core';
import { FormContainerDto } from '../../../models/forms/form-container.model';

export interface DynamicPageRequest {
  containerId: string;
  itemIndex: number;
  containers: FormContainerDto[];
}

@Injectable({
  providedIn: 'root'
})
export class DynamicFormPageService {
  private dynamicPages = signal<Map<number, FormContainerDto[]>>(new Map());
  private nextPageNumber = signal<number>(2); // Start from page 2 (page 1 is the template)

  /**
   * Request a new page for overflow items
   */
  requestNewPage(basePageNumber: number, containers: FormContainerDto[]): number {
    const newPageNumber = this.nextPageNumber();
    const currentPages = new Map(this.dynamicPages());
    
    // Clone containers and update their page numbers
    const newContainers = containers.map(container => 
      new FormContainerDto({
        ...container,
        pageNumber: newPageNumber
      })
    );
    
    currentPages.set(newPageNumber, newContainers);
    this.dynamicPages.set(currentPages);
    this.nextPageNumber.set(newPageNumber + 1);
    
    return newPageNumber;
  }

  /**
   * Get all dynamic pages
   */
  getDynamicPages(): Map<number, FormContainerDto[]> {
    return this.dynamicPages();
  }

  /**
   * Clear all dynamic pages
   */
  clearDynamicPages(): void {
    this.dynamicPages.set(new Map());
    this.nextPageNumber.set(2);
  }

  /**
   * Remove a specific page
   */
  removePage(pageNumber: number): void {
    const currentPages = new Map(this.dynamicPages());
    currentPages.delete(pageNumber);
    this.dynamicPages.set(currentPages);
  }

  /**
   * Update containers on a specific page
   */
  updatePageContainers(pageNumber: number, containers: FormContainerDto[]): void {
    const currentPages = new Map(this.dynamicPages());
    currentPages.set(pageNumber, containers);
    this.dynamicPages.set(currentPages);
  }
}