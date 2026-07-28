import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
 * PWA Personnel section — Schedule (day-picker with full shift breakdown), Contacts, and Chat.
 *
 * Schedule tab: shows any single day's full roster (Day / Night / OCM / PTO / Training /
 * Unscheduled). Defaults to today with prev/next-day navigation. "On shift NOW" is a highlighted
 * chip row above the breakdown when viewing today. Data fetches from the hub; on failure the API
 * service transparently falls back to the Supabase mirror.
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

  // Schedule day-picker state — ISO yyyy-MM-dd, defaults to today.
  selectedDate = signal<string>(this.todayIso());
  selectedDay = signal<ShiftDay | null>(null);
  onShiftNow = signal<ShiftEntry[]>([]);
  scheduleLoading = signal(false);
  scheduleError = signal<string | null>(null);

  contacts = signal<PersonnelContact[]>([]);
  contactsLoading = signal(false);
  contactsError = signal<string | null>(null);
  contactsSearch = signal('');

  isViewingToday = computed(() => this.selectedDate() === this.todayIso());
  selectedDateLabel = computed(() => {
    const s = this.selectedDate();
    const today = this.todayIso();
    if (s === today) return 'Today';
    // yesterday
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (s === this.isoOf(y)) return 'Yesterday';
    // tomorrow
    const t = new Date(); t.setDate(t.getDate() + 1);
    if (s === this.isoOf(t)) return 'Tomorrow';
    // Otherwise day of week ("Wednesday")
    return new Date(s + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });
  });

  ngOnInit(): void {
    // Cache-first render on Schedule (the default tab).
    const cachedToday = this.cache.readScheduleToday();
    if (cachedToday) this.selectedDay.set(cachedToday.data);
    this.refreshSelectedDate();
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

  // ── Schedule day-picker ───────────────────────────────────────────────

  shiftDay(deltaDays: number): void {
    const cur = new Date(this.selectedDate() + 'T12:00:00');
    cur.setDate(cur.getDate() + deltaDays);
    this.selectedDate.set(this.isoOf(cur));
    this.refreshSelectedDate();
  }

  jumpToToday(): void {
    this.selectedDate.set(this.todayIso());
    this.refreshSelectedDate();
  }

  refreshSelectedDate(): void {
    const date = this.selectedDate();
    this.scheduleLoading.set(true);
    this.scheduleError.set(null);

    if (date === this.todayIso()) {
      // Today: use the dedicated /today endpoint (also feeds the "on shift NOW" chip row).
      this.api.getScheduleToday().subscribe({
        next: dto => {
          this.selectedDay.set(dto);
          if (dto) this.cache.writeScheduleToday(dto);
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
    } else {
      // Other days: hit the range endpoint with from=to=date.
      this.onShiftNow.set([]); // "on shift NOW" is only meaningful for today
      this.api.getScheduleRange(date, date).subscribe({
        next: rows => {
          this.selectedDay.set(rows[0] ?? null);
          this.scheduleLoading.set(false);
        },
        error: err => {
          this.selectedDay.set(null);
          this.scheduleError.set(err?.error?.error ?? 'Could not reach server');
          this.scheduleLoading.set(false);
        },
      });
    }
  }

  // ── Contacts ──────────────────────────────────────────────────────────

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

  // ── Date helpers ──────────────────────────────────────────────────────

  private todayIso(): string { return this.isoOf(new Date()); }
  private isoOf(d: Date): string {
    // Use local date, not UTC — the plant's schedule day is local-plant time.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
}
