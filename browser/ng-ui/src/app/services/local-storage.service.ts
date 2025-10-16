import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  /**
   * Sets an item in localStorage.
   * @param key The key for the storage item.
   * @param value The value to store. Will be JSON stringified.
   */
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  /**
   * Gets an item from localStorage.
   * @param key The key of the item to retrieve.
   * @returns The parsed item, or null if not found or on error.
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error getting data from localStorage', e);
      return null;
    }
  }

  /**
   * Removes an item from localStorage.
   * @param key The key of the item to remove.
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clears all items from localStorage.
   */
  clear(): void {
    localStorage.clear();
  }
}