import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { InstrumentOutboxService } from '../../features/equipment/instrument/instrument-outbox.service';

/**
 * App-wide "this device is holding unsynced work" indicator.
 *
 * Mounted in the shell rather than on any one screen, because the whole point is that a tech who
 * captured something offline and then walked away — to Home, to a work request, to a locked phone —
 * still sees that the plant doesn't have it yet. It appears the moment anything is queued and
 * disappears by itself the moment the queue drains; there is no dismiss, since dismissing would
 * defeat the purpose. Tapping it opens the queue's owning screen and forces a send attempt.
 */
@Component({
  selector: 'app-pending-sync-indicator',
  standalone: true,
  imports: [],
  templateUrl: './pending-sync-indicator.component.html',
  styleUrl: './pending-sync-indicator.component.css'
})
export class PendingSyncIndicatorComponent {

  private instrumentOutbox = inject(InstrumentOutboxService);
  private router = inject(Router);

  /** Aggregate across every queue that can hold offline work. Instruments are the only one today. */
  count = computed(() => this.instrumentOutbox.pendingCount());
  isFlushing = this.instrumentOutbox.isFlushing;

  instrumentCount = this.instrumentOutbox.pendingInstrumentCount;
  logCount = this.instrumentOutbox.pendingLogCount;

  label = computed(() => {
    const instruments = this.instrumentCount();
    const logs = this.logCount();
    const parts: string[] = [];
    if (instruments > 0) parts.push(`${instruments} instrument${instruments === 1 ? '' : 's'}`);
    if (logs > 0) parts.push(`${logs} log${logs === 1 ? '' : 's'}`);
    return parts.join(' · ');
  });

  async onClick() {
    await this.instrumentOutbox.flush();
    // Still queued after the attempt — take them where they can see and retry the items.
    if (this.instrumentOutbox.pendingCount() > 0) {
      void this.router.navigate(['/instruments']);
    }
  }
}
