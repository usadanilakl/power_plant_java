import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoAssetLocatorService } from '../../../services/maximo/maximo-asset-locator.service';
import {
  CreateMaximoServiceRequest,
  MaximoAsset,
  MaximoServiceRequest
} from '../../../models/maximo/maximo.models';

interface PendingFile {
  file: File;
  doctype: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface CandidateOption {
  asset: MaximoAsset;
  /** Empty for wildcard tier (whole tag matched), populated for partial tier (per-segment hits). */
  matchedSegments: string[];
}

type AssetMatchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'exact'; asset: MaximoAsset; tier: 'exact' | 'wildcard' | 'partial'; partialTerm?: string }
  | { kind: 'candidates'; options: CandidateOption[]; tier: 'wildcard' | 'partial'; partialTerm?: string }
  | { kind: 'none'; note?: string }
  | { kind: 'error'; message: string };

/**
 * Submit a Maximo service request.
 *
 * Inputs:
 *   - tagNumber: optional. When provided, the component looks up the matching Maximo asset
 *     and prefills assetnum + location. If multiple candidates match, the user picks.
 *
 * Outputs:
 *   - submitted: fires after the SR is created AND all attachments are uploaded.
 *   - cancel: user closed the form without submitting.
 *
 * Self-contained: no plant-map / equipment-detail dependency, so it works equally well
 * embedded on the SR page or inside the future plant-map "Submit SR" wizard.
 */
@Component({
  selector: 'app-maximo-sr-submit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maximo-sr-submit.component.html',
  styleUrl: './maximo-sr-submit.component.css'
})
export class MaximoSrSubmitComponent implements OnChanges {
  private api = inject(MaximoApiService);
  private locator = inject(MaximoAssetLocatorService);

  @Input() tagNumber: string | null = null;
  @Input() defaultSite = 'JG';
  @Output() submitted = new EventEmitter<MaximoServiceRequest>();
  @Output() cancel = new EventEmitter<void>();

  sr: CreateMaximoServiceRequest = this.empty();

  match = signal<AssetMatchState>({ kind: 'idle' });
  pending = signal<PendingFile[]>([]);
  isDragOver = signal(false);

  submitting = signal(false);
  submitError = signal<string | null>(null);
  attachmentProgress = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tagNumber'] && this.tagNumber) {
      this.lookupAsset(this.tagNumber);
    }
  }

  // ---- asset/location matching ------------------------------------------------

  async lookupAsset(tag: string) {
    this.match.set({ kind: 'loading' });
    const r = await this.locator.locate(tag);
    if (r.tier === 'error') {
      this.match.set({ kind: 'error', message: r.errorMessage ?? 'lookup failed' });
      return;
    }
    if (r.tier === 'none') {
      this.match.set({ kind: 'none', note: r.note });
      return;
    }
    if (r.asset) {
      this.applyAsset(r.asset);
      this.match.set({ kind: 'exact', asset: r.asset, tier: r.tier as 'exact' | 'wildcard' | 'partial', partialTerm: r.partialTerm });
      return;
    }
    if (r.candidates && r.candidates.length > 0) {
      // Align per-candidate matched segments by assetnum so the picker can show
      // "matched on HHS906" next to each option.
      const scoreMap = new Map((r.candidateScores ?? []).map(s => [s.assetnum, s.matchedSegments]));
      const options: CandidateOption[] = r.candidates.map(asset => ({
        asset,
        matchedSegments: scoreMap.get(asset.assetnum) ?? []
      }));
      this.match.set({
        kind: 'candidates', options,
        tier: r.tier as 'wildcard' | 'partial',
        partialTerm: r.partialTerm
      });
    }
  }

  pickCandidate(a: MaximoAsset) {
    this.applyAsset(a);
    this.match.set({ kind: 'exact', asset: a, tier: 'exact' });
  }

  private applyAsset(a: MaximoAsset) {
    this.sr.assetnum = a.assetnum ?? '';
    this.sr.location = a.location ?? '';
    if (!this.sr.siteid) this.sr.siteid = a.siteid ?? this.defaultSite;
  }

  // ---- attachment dropzone ----------------------------------------------------

  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave() { this.isDragOver.set(false); }

  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.isDragOver.set(false);
    if (ev.dataTransfer?.files) this.addFiles(Array.from(ev.dataTransfer.files));
  }

  onFilePick(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = '';
  }

  addFiles(files: File[]) {
    const next = files.map(f => ({ file: f, doctype: 'Attachments', status: 'pending' as const }));
    this.pending.update(list => [...list, ...next]);
  }

  removeFile(idx: number) {
    this.pending.update(list => list.filter((_, i) => i !== idx));
  }

  // ---- submit -----------------------------------------------------------------

  async submit() {
    if (!this.sr.description || !this.sr.description.trim()) {
      this.submitError.set('Description is required.');
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    this.attachmentProgress.set(null);

    let created: MaximoServiceRequest;
    try {
      created = await firstValueFrom(this.api.createServiceRequest({
        ...this.sr,
        siteid: this.sr.siteid || this.defaultSite
      }));
    } catch (e: any) {
      this.submitError.set('SR submission failed: ' + (e?.error?.message ?? e?.message ?? String(e)));
      this.submitting.set(false);
      return;
    }

    // SR created — chain attachment uploads. Don't fail the whole submit if one upload errors;
    // the SR exists, surface per-file errors and let the user retry.
    const files = this.pending();
    if (files.length > 0 && created.href) {
      this.attachmentProgress.set(`Uploading 0 of ${files.length}…`);
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        this.pending.update(list => list.map((it, idx) => idx === i ? { ...it, status: 'uploading' } : it));
        try {
          await firstValueFrom(this.api.uploadAttachment('sr', created.href, item.file, item.doctype));
          this.pending.update(list => list.map((it, idx) => idx === i ? { ...it, status: 'success' } : it));
        } catch (e: any) {
          this.pending.update(list => list.map((it, idx) =>
            idx === i ? { ...it, status: 'error', error: e?.error?.message ?? e?.message ?? String(e) } : it));
        }
        this.attachmentProgress.set(`Uploading ${i + 1} of ${files.length}…`);
      }
      this.attachmentProgress.set(null);
    }

    this.submitting.set(false);
    this.submitted.emit(created);
    this.reset();
  }

  onCancel() { this.reset(); this.cancel.emit(); }

  private reset() {
    this.sr = this.empty();
    this.pending.set([]);
    this.match.set({ kind: 'idle' });
    this.submitError.set(null);
    if (this.tagNumber) this.lookupAsset(this.tagNumber);
  }

  private empty(): CreateMaximoServiceRequest {
    return {
      description: '',
      longDescription: '',
      assetnum: '',
      location: '',
      siteid: this.defaultSite,
      priority: '3',
      reportedby: ''
    };
  }

  // ---- template helpers -------------------------------------------------------

  // Typed narrowing accessors for the discriminated `match` signal — Angular templates
  // can't narrow union types via *ngSwitch, so each state gets its own typed getter.
  matchExact(): { asset: MaximoAsset; tier: string; partialTerm?: string } | null {
    const m = this.match();
    return m.kind === 'exact' ? { asset: m.asset, tier: m.tier, partialTerm: m.partialTerm } : null;
  }
  matchCandidates(): { options: CandidateOption[]; tier: string; partialTerm?: string } | null {
    const m = this.match();
    return m.kind === 'candidates' ? { options: m.options, tier: m.tier, partialTerm: m.partialTerm } : null;
  }
  matchErrorMsg(): string | null {
    const m = this.match();
    return m.kind === 'error' ? m.message : null;
  }
  matchKind(): string { return this.match().kind; }

  /** Human-readable label for the tier the match came from. */
  tierLabel(tier: string, partialTerm?: string): string {
    switch (tier) {
      case 'exact':    return 'exact match';
      case 'wildcard': return 'wildcard match';
      case 'partial':  return `partial match on "${partialTerm}"`;
      default:         return tier;
    }
  }

  fmtSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
