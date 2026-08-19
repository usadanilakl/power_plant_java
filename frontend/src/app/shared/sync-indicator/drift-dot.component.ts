import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DriftService, RowDrift } from '../../services/drift.service';

/**
 * Per-row drift badge for views that are NOT a {@code TableComponent} — list panels, dropdown pickers,
 * left menus, form headers. The table and the forms grew their own copies of this markup; this is the
 * one to reuse everywhere else instead of adding a fourth.
 *
 * <p>Reads the SHARED per-type drift map that {@link DriftService} already keeps warm for the table
 * badges, so dropping this into a list costs one cached GET per type, not one per row. Click opens the
 * Drift Center filtered to that type.
 *
 * <pre>&lt;app-drift-dot [entityType]="'LotoStandard'" [entityId]="std.id" /&gt;</pre>
 */
@Component({
  selector: 'app-drift-dot',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (badge(); as b) {
      <span class="dd" [class.sp]="b === 'SP'" [class.ok]="b === '✓'"
            [title]="tooltip()" (click)="open($event)">{{ b }}</span>
    }
  `,
  styles: [`
    .dd { display:inline-flex; align-items:center; justify-content:center; min-width:15px; height:15px;
      padding:0 3px; margin-left:5px; border-radius:8px; font-size:9px; font-weight:700; line-height:1;
      color:#fff; background:#e67e22; cursor:pointer; vertical-align:middle; }
    .dd.sp { background:#2980b9; }
    .dd.ok { background:#2e7d32; }
    .dd:hover { filter:brightness(1.15); }
  `],
})
export class DriftDotComponent {
  entityType = input.required<string>();
  entityId = input<number | string | null | undefined>(undefined);
  /** Show a green "verified in sync" tick on clean rows. Off by default — in a dense list a tick per
   *  row is noise; the drift badge is the signal that matters. */
  showClean = input(false);

  private drift = inject(DriftService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private map = signal<Map<number, RowDrift>>(new Map());

  private loadEffect = effect(() => {
    const type = this.entityType();
    if (!type) return;
    // statusForTypeShared, NOT statusForType: a list renders one dot per row and they must share a single
    // request. takeUntilDestroyed needs the explicit destroyRef — an effect body is not an injection context.
    this.drift.statusForTypeShared(type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((m) => this.map.set(m));
  });

  private row = computed<RowDrift | undefined>(() => {
    const id = this.entityId();
    return id == null ? undefined : this.map().get(Number(id));
  });

  badge = computed<string | null>(() => {
    const r = this.row();
    if (r?.hub) return 'H';
    if (r?.sp) return 'SP';
    return this.showClean() && this.drift.isScanned(this.entityType()) ? '✓' : null;
  });

  tooltip = computed(() => {
    const r = this.row();
    if (r?.hub) {
      return r.hub.kind === 'DIFFERING' ? 'Differs from the hub — click to review'
        : r.hub.kind === 'MISSING_LOCALLY' ? 'On the hub, not here — click to review'
        : 'Here, not on the hub — click to review';
    }
    if (r?.sp) return 'Missing on SharePoint — click to review';
    return 'Verified in sync';
  });

  open(ev: MouseEvent): void {
    ev.stopPropagation();
    const id = this.entityId();
    // Land on the focused local-vs-hub side-by-side for THIS row when we know which row it is; only fall
    // back to the whole-type Drift Center when the dot was rendered without an id (rare — e.g. a header).
    if (id != null && id !== '') {
      this.router.navigate(['/sync/compare'], { queryParams: { type: this.entityType(), id } });
    } else {
      this.router.navigate(['/sync/drift'], { queryParams: { type: this.entityType() } });
    }
  }
}
