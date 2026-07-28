import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import {
  SupabaseAdminApiService, SupabaseOrphan, SupabaseLookupResult,
} from '../../../services/supabase-admin-api.service';

/**
 * Admin-only unstick tool for users whose Supabase link never got created. Surfaces the exact
 * reason the scheduled {@code SupabaseReconciliationService} skipped each user, offers a manual
 * override (email + link-existing-uuid), and lets the operator kick the reconciler on demand
 * instead of waiting for the 60 s tick.
 *
 * Chat surfaces the missing link as an HTTP 503 "User X has no supabaseUuid" — this page is where
 * that gets fixed.
 */
@Component({
  selector: 'app-supabase-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './supabase-admin.component.html',
  styleUrl: './supabase-admin.component.css',
})
export class SupabaseAdminComponent implements OnInit {
  private api = inject(SupabaseAdminApiService);

  orphans = signal<SupabaseOrphan[]>([]);
  loading = signal(false);
  loadError = signal<string | null>(null);
  banner = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);
  reconciling = signal(false);

  // Filter (in-memory)
  filterReason = signal<'all' | 'eligible' | 'blocked'>('all');

  // Provision modal state
  showProvisionModal = signal(false);
  provisionTarget = signal<SupabaseOrphan | null>(null);
  provisionEmail = '';
  provisionUuid = '';
  provisionBusy = signal(false);
  provisionError = signal<string | null>(null);
  lookupBusy = signal(false);
  lookupResult = signal<SupabaseLookupResult | null>(null);

  filtered = computed(() => {
    const f = this.filterReason();
    const rows = this.orphans();
    if (f === 'all') return rows;
    if (f === 'eligible') return rows.filter(r => r.eligibleForAutoProvision);
    return rows.filter(r => !r.eligibleForAutoProvision);
  });

  counts = computed(() => {
    const rows = this.orphans();
    const byReason: Record<string, number> = {};
    for (const r of rows) byReason[r.reason] = (byReason[r.reason] || 0) + 1;
    return {
      total: rows.length,
      eligible: rows.filter(r => r.eligibleForAutoProvision).length,
      blocked: rows.filter(r => !r.eligibleForAutoProvision).length,
      byReason,
    };
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.orphans().subscribe({
      next: r => {
        this.orphans.set(r.responseData ?? []);
        this.loading.set(false);
      },
      error: err => {
        this.loadError.set(err?.error?.message ?? err?.message ?? 'Failed to load orphans');
        this.loading.set(false);
      },
    });
  }

  reconcileNow(): void {
    this.reconciling.set(true);
    this.banner.set(null);
    this.api.reconcileNow().subscribe({
      next: () => {
        this.reconciling.set(false);
        this.banner.set({ kind: 'ok', text: 'Reconcile triggered. Reloading orphans in a moment…' });
        setTimeout(() => this.reload(), 1500);
      },
      error: err => {
        this.reconciling.set(false);
        this.banner.set({ kind: 'err', text: err?.error?.message ?? 'Reconcile failed' });
      },
    });
  }

  openProvision(o: SupabaseOrphan): void {
    this.provisionTarget.set(o);
    // Pre-fill with stored email so eligible users can just click Provision.
    this.provisionEmail = o.email ?? '';
    this.provisionUuid = '';
    this.provisionError.set(null);
    this.lookupResult.set(null);
    this.showProvisionModal.set(true);
  }

  closeProvision(): void {
    this.showProvisionModal.set(false);
    this.provisionTarget.set(null);
  }

  lookup(): void {
    const email = this.provisionEmail.trim();
    if (!email) {
      this.provisionError.set('Enter an email to look up');
      return;
    }
    this.lookupBusy.set(true);
    this.lookupResult.set(null);
    this.provisionError.set(null);
    this.api.lookupByEmail(email).subscribe({
      next: r => {
        this.lookupResult.set(r.responseData ?? null);
        this.lookupBusy.set(false);
      },
      error: err => {
        this.provisionError.set(err?.error?.message ?? 'Lookup failed');
        this.lookupBusy.set(false);
      },
    });
  }

  useLookupUuid(): void {
    const uuid = this.lookupResult()?.uuid;
    if (uuid) this.provisionUuid = uuid;
  }

  submitProvision(): void {
    const target = this.provisionTarget();
    if (!target) return;
    const emailOverride = this.provisionEmail.trim();
    const linkExistingUuid = this.provisionUuid.trim();
    this.provisionBusy.set(true);
    this.provisionError.set(null);
    this.api.provision(target.id, {
      emailOverride: emailOverride || undefined,
      linkExistingUuid: linkExistingUuid || undefined,
    }).subscribe({
      next: r => {
        this.provisionBusy.set(false);
        const uuid = r.responseData?.supabaseUuid;
        this.banner.set({ kind: 'ok', text: `Provisioned user ${target.id} (uuid ${uuid?.substring(0, 8)}…)` });
        this.closeProvision();
        this.reload();
      },
      error: err => {
        this.provisionBusy.set(false);
        this.provisionError.set(err?.error?.message ?? 'Provision failed');
      },
    });
  }

  reasonLabel(r: string): string {
    switch (r) {
      case 'eligible': return 'Eligible — waiting on next reconcile tick';
      case 'inactive': return 'User is inactive';
      case 'no-email': return 'No email on User row';
      case 'malformed-email': return 'Email missing @ or user part';
      case 'non-dotted-domain': return 'Email domain has no dot (e.g. user@localhost)';
      default: return r;
    }
  }
}
