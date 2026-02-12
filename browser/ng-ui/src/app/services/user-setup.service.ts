import { Injectable } from '@angular/core';

export interface PwaUserData {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  signature?: string;
  createdAt: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserSetupService {
  private readonly storageKey = 'pwaUserData';

  hasUserData(): boolean {
    return !!localStorage.getItem(this.storageKey);
  }

  getUserData(): PwaUserData | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      const parsed = JSON.parse(data);
      parsed.createdAt = new Date(parsed.createdAt);
      if (parsed.updatedAt) {
        parsed.updatedAt = new Date(parsed.updatedAt);
      }
      return parsed;
    } catch (e) {
      console.error('Error reading user data:', e);
      return null;
    }
  }

  saveUserData(data: Omit<PwaUserData, 'uuid' | 'createdAt' | 'updatedAt'>): PwaUserData {
    const existing = this.getUserData();
    const userData: PwaUserData = {
      ...data,
      uuid: existing?.uuid ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: existing ? new Date() : undefined
    };
    localStorage.setItem(this.storageKey, JSON.stringify(userData));
    return userData;
  }

  clearUserData(): void {
    localStorage.removeItem(this.storageKey);
  }

  isValid(): boolean {
    const data = this.getUserData();
    if (!data) return false;
    return !!(data.name && data.email && data.phone && data.company);
  }
}
