import { Injectable } from "@angular/core";
import { IJha } from "../../models/permits/jha.model";
import { LocalStorageService } from "../../services/local-storage.service";

@Injectable({
  providedIn: 'root'
})
export class JhaLocalStorageService {
  private readonly DRAFT_KEY = 'jha-draft';

  constructor(
    private localStorageService: LocalStorageService
  ) { }

  // --- Methods for draft storage using LocalStorage ---
  saveDraft(draft: Partial<IJha>): void {
    this.localStorageService.setItem(this.DRAFT_KEY, draft);
  }

  loadDraft(): Partial<IJha> | null {
    return this.localStorageService.getItem<Partial<IJha>>(this.DRAFT_KEY);
  }

  clearDraft(): void {
    this.localStorageService.removeItem(this.DRAFT_KEY);
  }
}