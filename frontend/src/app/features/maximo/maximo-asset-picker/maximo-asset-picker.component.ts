import { Component, EventEmitter, Input, Output, forwardRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoAsset } from '../../../models/maximo/maximo.models';

/**
 * Maximo asset picker — debounced search (word-bucket over assetnum + description) with a results
 * dropdown. Implements ControlValueAccessor; the value written is the exact assetnum.
 *
 * Default (filters / exact-match fields): the value commits ONLY on pick — uncommitted typing is
 * discarded on blur. Set {@link freeText}=true (create/edit forms) to also commit raw typed text. The
 * {@link picked} output carries the full asset, so a host can auto-fill location (asset.location).
 */
@Component({
  selector: 'app-maximo-asset-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mp">
      <input type="text" class="mp-input" [placeholder]="placeholder" [disabled]="disabled"
             [(ngModel)]="text" (ngModelChange)="onInput($event)" (focus)="show.set(true)" (blur)="onBlur()"
             autocomplete="off" />
      <span *ngIf="searching()" class="mp-status">…</span>
      <div class="mp-list" *ngIf="show() && results().length">
        <button type="button" class="mp-opt" *ngFor="let a of results()" (mousedown)="pick(a)">
          <strong>{{ a.assetnum }}</strong> {{ a.description }}
          <span class="mp-loc" *ngIf="a.location"> · {{ a.location }}</span>
        </button>
        <div class="mp-more" *ngIf="results().length >= limit">Showing first {{ limit }} — add words to narrow.</div>
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
    .mp-loc { color: #888; }
    .mp-more { padding: 5px 8px; color: #888; font-size: 11px; font-style: italic; border-top: 1px solid #333; }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MaximoAssetPickerComponent), multi: true }]
})
export class MaximoAssetPickerComponent implements ControlValueAccessor {
  private api = inject(MaximoApiService);

  @Input() placeholder = 'search tag / description…';
  @Input() freeText = false;
  @Input() siteid?: string;
  @Output() picked = new EventEmitter<MaximoAsset>();

  readonly limit = 50;

  text = '';
  disabled = false;
  show = signal(false);
  searching = signal(false);
  results = signal<MaximoAsset[]>([]);
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
    try { this.results.set(await firstValueFrom(this.api.searchAssets({ tag: q, siteid: this.siteid, pageSize: this.limit }))); }
    catch { this.results.set([]); }
    finally { this.searching.set(false); }
  }

  pick(a: MaximoAsset) {
    this.value = a.assetnum;
    this.text = a.assetnum;
    this.onChange(a.assetnum);
    this.picked.emit(a);
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
