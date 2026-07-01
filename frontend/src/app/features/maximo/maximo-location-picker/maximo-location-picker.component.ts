import { Component, EventEmitter, Input, Output, forwardRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoLocation } from '../../../models/maximo/maximo.models';

/**
 * Maximo operating-location picker — debounced search (word-bucket over code + description) with a
 * results dropdown. Implements ControlValueAccessor; the value written is the exact location code.
 *
 * Default (filters / exact-match fields): the value commits ONLY when an option is picked — uncommitted
 * typing is discarded on blur, so a typo never becomes a silent exact-match miss. Set {@link freeText}=true
 * (e.g. on a create/edit form) to also commit raw typed text. The {@link picked} output carries the full
 * location (e.g. to read its description/type).
 */
@Component({
  selector: 'app-maximo-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mp">
      <input type="text" class="mp-input" [placeholder]="placeholder" [disabled]="disabled"
             [(ngModel)]="text" (ngModelChange)="onInput($event)" (focus)="show.set(true)" (blur)="onBlur()"
             autocomplete="off" />
      <span *ngIf="searching()" class="mp-status">…</span>
      <div class="mp-list" *ngIf="show() && results().length">
        <button type="button" class="mp-opt" *ngFor="let l of results()" (mousedown)="pick(l)">
          <strong>{{ l.location }}</strong> {{ l.description }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .mp { position: relative; display: inline-block; width: 100%; }
    .mp-input { width: 100%; box-sizing: border-box; background: #2a2a2a; color: #e6e6e6;
      border: 1px solid #444; border-radius: 3px; padding: 4px 6px; font: inherit; }
    .mp-status { position: absolute; right: 6px; top: 5px; color: #888; font-size: 11px; }
    .mp-list { position: absolute; top: 100%; left: 0; right: 0; z-index: 60; margin-top: 2px;
      max-height: 240px; overflow: auto; background: #1f1f1f; border: 1px solid #444; border-radius: 4px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
    .mp-opt { display: block; width: 100%; text-align: left; background: none; border: 0; color: #e6e6e6;
      padding: 6px 8px; font: inherit; font-size: 12px; cursor: pointer; border-bottom: 1px solid #2a2a2a; }
    .mp-opt:hover { background: #2d3b4a; }
    .mp-opt strong { color: #7cc6ff; margin-right: 4px; }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MaximoLocationPickerComponent), multi: true }]
})
export class MaximoLocationPickerComponent implements ControlValueAccessor {
  private api = inject(MaximoApiService);

  @Input() placeholder = 'search location…';
  @Input() freeText = false;
  @Output() picked = new EventEmitter<MaximoLocation>();

  text = '';
  disabled = false;
  show = signal(false);
  searching = signal(false);
  results = signal<MaximoLocation[]>([]);
  private value = '';
  private timer: ReturnType<typeof setTimeout> | null = null;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(q: string) {
    this.text = q;
    if (this.freeText) { this.value = q; this.onChange(q); }
    this.show.set(true);
    if (this.timer) clearTimeout(this.timer);
    if (!q || q.trim().length < 2) { this.results.set([]); return; }
    this.timer = setTimeout(() => this.run(q.trim()), 300);
  }

  private async run(q: string) {
    this.searching.set(true);
    try { this.results.set(await firstValueFrom(this.api.searchLocations(q, 25))); }
    catch { this.results.set([]); }
    finally { this.searching.set(false); }
  }

  pick(loc: MaximoLocation) {
    this.value = loc.location;
    this.text = loc.location;
    this.onChange(loc.location);
    this.picked.emit(loc);
    this.results.set([]);
    this.show.set(false);
  }

  onBlur() {
    this.onTouched();
    setTimeout(() => {
      if (!this.freeText && this.text !== this.value) this.text = this.value; // discard uncommitted typing
      this.show.set(false);
    }, 150);
  }

  writeValue(v: string | null): void { this.value = v ?? ''; this.text = this.value; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
