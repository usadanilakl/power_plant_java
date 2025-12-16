
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private platformId = inject(PLATFORM_ID);

  private get isLocalStorageAvailable(): boolean {
    return isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined';
  }

  /**
   * Sets an item in localStorage.
   * @param key The key for the storage item.
   * @param value The value to store. Will be JSON stringified.
   */
  setItem<T>(key: string, value: T): void {
    if (!this.isLocalStorageAvailable) {
      console.warn('localStorage is not available in this environment');
      return;
    }
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
    if (!this.isLocalStorageAvailable) {
      return null;
    }
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }
      // Reviver function to convert ISO date strings back to Date objects
      const dateReviver = (reviverKey: string, value: any) => {
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        if (typeof value === 'string' && isoDateRegex.test(value)) {
          return new Date(value);
        }
        return value;
      };
      return JSON.parse(item, dateReviver);
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
    if (!this.isLocalStorageAvailable) {
      return;
    }
    localStorage.removeItem(key);
  }

  /**
   * Clears all items from localStorage.
   */
  clear(): void {
    if (!this.isLocalStorageAvailable) {
      return;
    }
    localStorage.clear();
  }

  /**
   * Checks if a key exists in localStorage.
   * @param key The key to check.
   * @returns True if the key exists, false otherwise.
   */
  hasItem(key: string): boolean {
    if (!this.isLocalStorageAvailable) {
      return false;
    }
    return localStorage.getItem(key) !== null;
  }

  /**
   * Gets all keys from localStorage.
   * @returns Array of all keys in localStorage.
   */
  getAllKeys(): string[] {
    if (!this.isLocalStorageAvailable) {
      return [];
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }
}