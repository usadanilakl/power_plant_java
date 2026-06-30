import { Component, Input, forwardRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';

/**
 * Maximo person picker — a typeahead over plant people (GET /ng/maximo/labor-people, cached). Suggests
 * matches as you type but allows FREE TEXT (the value is always the raw input), so a personid that isn't a
 * plant user (e.g. a Maximo-only labor code) still works. Implements ControlValueAccessor → drops into any
 * existing string [(ngModel)] / formControl binding; the value written is the personid string.
 */
@Component({
  selector: 'app-maximo-person-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pp">
      <input type="text" class="pp-input" [placeholder]="placeholder" [disabled]="disabled"
             [(ngModel)]="text" (ngModelChange)="onText($event)"
             (focus)="show.set(true)" (blur)="onBlur()" />
      <div class="pp-list" *ngIf="show() && filtered().length">
        <button type="button" class="pp-opt" *ngFor="let p of filtered()" (mousedown)="pick(p)">
          {{ p.name }} <span class="pp-id">({{ p.personid }})</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pp { position: relative; display: inline-block; width: 100%; }
    .pp-input { width: 100%; box-sizing: border-box; background: #2a2a2a; color: #e6e6e6;
      border: 1px solid #444; border-radius: 3px; padding: 4px 6px; font: inherit; }
    .pp-list { position: absolute; top: 100%; left: 0; right: 0; z-index: 50; margin-top: 2px;
      max-height: 220px; overflow: auto; background: #1f1f1f; border: 1px solid #444; border-radius: 4px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
    .pp-opt { display: block; width: 100%; text-align: left; background: none; border: 0; color: #e6e6e6;
      padding: 5px 8px; font: inherit; cursor: pointer; }
    .pp-opt:hover { background: #2d3b4a; }
    .pp-id { color: #888; }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MaximoPersonPickerComponent), multi: true }]
})
export class MaximoPersonPickerComponent implements ControlValueAccessor {
  private api = inject(MaximoApiService);

  @Input() placeholder = 'person…';

  text = '';
  disabled = false;
  show = signal(false);
  private people = signal<{ name: string; personid: string }[]>([]);
  private query = signal('');

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.people();
    const list = q ? all.filter(p => (p.name + ' ' + p.personid).toLowerCase().includes(q)) : all;
    return list.slice(0, 25);
  });

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    firstValueFrom(this.api.getLaborPeopleCached())
      .then(p => this.people.set(p ?? []))
      .catch(() => { /* picker still works as a plain text input */ });
  }

  onText(v: string) {
    this.query.set(v ?? '');
    this.onChange(v ?? '');
    this.show.set(true);
  }

  pick(p: { personid: string }) {
    this.text = p.personid;
    this.query.set(p.personid);
    this.onChange(p.personid);
    this.show.set(false);
  }

  /** Delay so a suggestion mousedown lands before the list closes. */
  onBlur() {
    this.onTouched();
    setTimeout(() => this.show.set(false), 120);
  }

  writeValue(v: string | null): void { this.text = v ?? ''; this.query.set(this.text); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
