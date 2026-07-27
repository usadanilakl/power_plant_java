import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import {
  PersonnelApiService, PersonnelContact, ShiftDay, ShiftEntry,
} from '../../services/personnel-api.service';
import { PersonnelCacheService } from '../../services/personnel-cache.service';
import { PwaChatPanelComponent } from './pwa-chat-panel.component';

/**
 * PWA Personnel section — currently exposes Schedule and Contacts sub-tabs. A Chat sub-tab is
 * planned as Stage 3 of the Plant Chat feature (see
 * {@code project/features/users/communication/plant-chat.md}).
 *
 * Both tabs render cached data instantly on load and refresh from the server in the background,
 * so opening the section is snappy even on a poor connection. On outright network failure the
 * cache stands in until the next successful fetch.
 */
@Component({
  selector: 'app-personnel-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, PwaChatPanelComponent],
  templateUrl: './personnel-page.component.html',
  styleUrl: './personnel-page.component.css',
})
export class PersonnelPageComponent implements OnInit {
  private api = inject(PersonnelApiService);
  private cache = inject(PersonnelCacheService);

  activeTab = signal<'schedule' | 'contacts' | 'chat'>('schedule');

  onShiftNow = signal<ShiftEntry[]>([]);
  scheduleToday = signal<ShiftDay | null>(null);
  scheduleLoading = signal(false);
  scheduleError = signal<string | null>(null);

  contacts = signal<PersonnelContact[]>([]);
  contactsLoading = signal(false);
  contactsError = signal<string | null>(null);
  contactsSearch = signal('');

  ngOnInit(): void {
    // Cache-first render on Schedule (the default tab). Contacts lazy-loaded on tab switch.
    const cachedToday = this.cache.readScheduleToday();
    if (cachedToday) this.scheduleToday.set(cachedToday.data);
    this.refreshSchedule();
  }

  selectTab(tab: 'schedule' | 'contacts' | 'chat'): void {
    this.activeTab.set(tab);
    if (tab === 'contacts' && this.contacts().length === 0) {
      const cached = this.cache.readContacts();
      if (cached) this.contacts.set(cached.data);
      this.refreshContacts();
    }
    // 'chat' has no lazy load here — the PwaChatPanelComponent manages its own lifecycle.
  }

  refreshSchedule(): void {
    this.scheduleLoading.set(true);
    this.scheduleError.set(null);
    this.api.getScheduleToday().subscribe({
      next: dto => {
        this.scheduleToday.set(dto);
        this.cache.writeScheduleToday(dto);
        this.scheduleLoading.set(false);
      },
      error: err => {
        this.scheduleError.set(err?.error?.error ?? 'Could not reach server (showing cached data)');
        this.scheduleLoading.set(false);
      },
    });
    this.api.getOnShiftNow().subscribe({
      next: entries => this.onShiftNow.set(entries),
      error: () => { /* covered by scheduleError */ },
    });
  }

  refreshContacts(): void {
    this.contactsLoading.set(true);
    this.contactsError.set(null);
    this.api.getContacts().subscribe({
      next: rows => {
        this.contacts.set(rows);
        this.cache.writeContacts(rows);
        this.contactsLoading.set(false);
      },
      error: err => {
        this.contactsError.set(err?.error?.error ?? 'Could not reach server (showing cached data)');
        this.contactsLoading.set(false);
      },
    });
  }

  filteredContacts(): PersonnelContact[] {
    const q = this.contactsSearch().trim().toLowerCase();
    if (!q) return this.contacts();
    return this.contacts().filter(c =>
      (c.name && c.name.toLowerCase().includes(q))
      || (c.title && c.title.toLowerCase().includes(q))
      || (c.phone && c.phone.toLowerCase().includes(q))
      || (c.company && c.company.toLowerCase().includes(q))
      || (c.emergencyContact && c.emergencyContact.toLowerCase().includes(q))
    );
  }
}
