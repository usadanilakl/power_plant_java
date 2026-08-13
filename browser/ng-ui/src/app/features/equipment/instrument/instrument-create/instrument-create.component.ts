import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Instrument } from '../../../../models/equipment/instrument.model';
import { InstrumentFormComponent } from '../instrument-form/instrument-form.component';
import { InstrumentCreateOutcome } from '../instrument-state.service';

/**
 * Add an instrument to the register.
 *
 * Reached from a search that came up empty, so it starts pre-filled with what the user typed — and
 * on success it routes straight to that instrument's log screen, because "add it" is never the goal
 * in itself: the goal is to log something against it.
 */
@Component({
  selector: 'app-instrument-create',
  imports: [InstrumentFormComponent],
  templateUrl: './instrument-create.component.html',
  styleUrl: './instrument-create.component.css'
})
export class InstrumentCreateComponent {

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  prefilledTag = computed(() => (this.queryParams()?.get('tag') ?? '').trim().toUpperCase());

  entity = computed(() => new Instrument({ tagNumber: this.prefilledTag() }));

  onSubmitted(outcome: InstrumentCreateOutcome) {
    if ((outcome.status === 'created' || outcome.status === 'merged') && outcome.tagNumber) {
      this.router.navigate(['/instruments', outcome.tagNumber]);
    }
  }

  back() {
    this.router.navigate(['/instruments']);
  }
}
