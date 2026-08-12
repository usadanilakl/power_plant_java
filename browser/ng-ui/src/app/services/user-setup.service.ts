import { Injectable } from '@angular/core';

export interface PwaUserData {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  signature?: string;
  registeredOnServer: boolean;
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

  /**
   * @param data pass `uuid` to claim a specific identifier — needed when a second person registers on
   *        a device that already holds someone else's uuid, and when the hub reassigns one. Omit it
   *        and the existing uuid is kept (a fresh one is minted only on first save).
   */
  saveUserData(data: Omit<PwaUserData, 'uuid' | 'createdAt' | 'updatedAt'> & { uuid?: string }): PwaUserData {
    const existing = this.getUserData();
    const userData: PwaUserData = {
      ...data,
      registeredOnServer: data.registeredOnServer ?? existing?.registeredOnServer ?? false,
      uuid: data.uuid ?? existing?.uuid ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: existing ? new Date() : undefined
    };
    localStorage.setItem(this.storageKey, JSON.stringify(userData));
    return userData;
  }

  /** Point this device at a different account identifier (hub reassignment / account switch). */
  setUuid(uuid: string): void {
    const data = this.getUserData();
    if (!data || !uuid || data.uuid === uuid) return;
    data.uuid = uuid;
    data.updatedAt = new Date();
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  markRegistered(): void {
    const data = this.getUserData();
    if (data) {
      data.registeredOnServer = true;
      data.updatedAt = new Date();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
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
