import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { SmartFormComponent } from '../../../shared/reactive-form/smart-form/smart-form.component';
import { MaximoFormApiService } from '../../../services/maximo/maximo-form-api.service';
import { MaximoFormFieldDef, MaximoFormSubmission, MaximoFormTemplate, ReorderLine, computeReorderLines, isInventoryForm } from '../../../models/maximo/maximo-form.models';
import { FormField } from '../../../models/ui/form-field.model';

/**
 * Fill an electronic task form for a work order. Given a WO (wonum + optional href) and a template, the
 * template's data-driven fields are rendered by SmartFormComponent; on save the values are stored as a
 * draft submission. Completing + pushing to Maximo (PDF/doclink/worklog/status/write-back) is phase 3.
 * Launch with ?wonum=&href=&formKey= (e.g. from the WO dialog), or pick a WO + form here.
 */
@Component({
  selector: 'app-maximo-form-fill-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, SmartFormComponent],
  templateUrl: './maximo-form-fill-page.component.html',
  styleUrl: './maximo-form-fill-page.component.css'
})
export class MaximoFormFillPageComponent implements OnInit {
  private api = inject(MaximoFormApiService);
  private route = inject(ActivatedRoute);
  @ViewChild(SmartFormComponent) smartForm?: SmartFormComponent;

  wonum = '';
  woHref = '';
  templates = signal<MaximoFormTemplate[]>([]);
  selectedTemplate = signal<MaximoFormTemplate | null>(null);
  smartFields = signal<FormField[]>([]);
  formDefs = signal<MaximoFormFieldDef[]>([]);   // raw template defs — for the live reorder summary
  valuesSig = signal<any>({});
  currentValues = signal<any>({});   // latest values from the form (for Complete, which is outside SmartForm's submit)
  existing = signal<MaximoFormSubmission | null>(null);

  /** True when this form is a reorder-capable inventory form (chem-lab inventory). */
  chemInventoryForm = computed(() => isInventoryForm(this.formDefs()));
  /** Live "what will be reordered" preview — shown at the bottom of the form BEFORE submitting. */
  reorderSummary = computed<ReorderLine[]>(() =>
    computeReorderLines(this.formDefs(), { ...(this.valuesSig() ?? {}), ...(this.currentValues() ?? {}) }));

  loading = signal(false);
  saving = signal(false);
  completing = signal(false);
  previewing = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);

  async ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    this.wonum = q.get('wonum') ?? '';
    this.woHref = q.get('href') ?? '';
    await this.loadTemplates();
    const formKey = q.get('formKey');
    if (formKey) {
      const t = this.templates().find(x => x.formKey === formKey);
      if (t) await this.selectTemplate(t);
    }
  }

  private async loadTemplates() {
    this.loading.set(true); this.error.set(null);
    try { this.templates.set((await firstValueFrom(this.api.listTemplates())).filter(t => t.active !== false)); }
    catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  async onPickTemplate(formKey: string) {
    const t = this.templates().find(x => x.formKey === formKey) ?? null;
    if (t) await this.selectTemplate(t); else this.selectedTemplate.set(null);
  }

  private async selectTemplate(t: MaximoFormTemplate) {
    this.selectedTemplate.set(t);
    this.info.set(null); this.error.set(null);
    const defs = this.parseFields(t.fieldsJson);
    this.formDefs.set(defs);
    this.smartFields.set(this.toSmartFields(defs));
    // Prefill from an existing submission for this WO+form, if any.
    let values: any = {};
    this.existing.set(null);
    if (this.wonum.trim()) {
      try {
        const subs = await firstValueFrom(this.api.submissionsForWo(this.wonum.trim()));
        const match = subs.find(s => s.templateFormKey === t.formKey) ?? null;
        this.existing.set(match);
        if (match?.valuesJson) values = this.parseValues(match.valuesJson);
      } catch { /* prefill is best-effort */ }
    }
    this.valuesSig.set(values);
    this.currentValues.set(values);
  }

  /** SmartForm's own submit button → save a draft (no Maximo push). */
  async onSubmit(values: any) {
    this.currentValues.set(values);
    await this.persist(values, false);
  }

  /** Complete: render the PDF, attach to the WO, worklog + write-back + status. */
  async complete() {
    const t = this.selectedTemplate();
    if (!t) return;
    if (!this.wonum.trim()) { this.error.set('Enter the work order number first.'); return; }
    if (this.existing()?.status === 'COMPLETED') { this.info.set('This form is already completed for this work order.'); return; }
    // Read the LIVE form value — SmartForm's change output is debounced (1s), so don't push a stale/partial
    // value to Maximo. Also block on missing required fields.
    const form = this.smartForm?.form;
    if (form && form.invalid) { form.markAllAsTouched(); this.error.set('Please fill all required fields before completing.'); return; }
    const live = this.smartForm?.getCurrentFormValues() ?? this.currentValues();
    const values = { ...(this.valuesSig() ?? {}), ...(live ?? {}) };
    if (!window.confirm(`Attach the completed “${t.formName}” PDF to WO ${this.wonum.trim()} and write back to Maximo?`)) return;
    await this.persist(values, true);
  }

  /**
   * Preview the PDF exactly as it would attach to Maximo (same server render path), without shipping it.
   * Opens the rendered PDF in a new tab. Uses the live form values; a work order number is optional here.
   */
  async preview() {
    const t = this.selectedTemplate();
    if (!t || this.previewing()) return;
    // Read the LIVE value (SmartForm's change output is debounced) and merge with any prefilled values.
    const live = this.smartForm?.getCurrentFormValues() ?? this.currentValues();
    const values = { ...(this.valuesSig() ?? {}), ...(live ?? {}) };
    this.previewing.set(true); this.error.set(null); this.info.set(null);
    try {
      const dto: MaximoFormSubmission = {
        templateFormKey: t.formKey,
        templateName: t.formName,
        wonum: this.wonum.trim(),          // optional for a preview — blank just renders "—" in the header
        woHref: this.woHref || undefined,
        valuesJson: JSON.stringify(values ?? {}),
      };
      const blob = await firstValueFrom(this.api.previewPdf(dto));
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) this.info.set('Preview generated — allow pop-ups to view it, or check your downloads.');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) {
      this.error.set('Preview failed. ' + this.msg(e));
    } finally {
      this.previewing.set(false);
    }
  }

  private async persist(values: any, complete: boolean) {
    const t = this.selectedTemplate();
    if (!t) return;
    const busy = complete ? this.completing : this.saving;
    if (busy()) return;
    busy.set(true); this.error.set(null); this.info.set(null);
    try {
      const dto: MaximoFormSubmission = {
        templateFormKey: t.formKey,
        templateName: t.formName,
        wonum: this.wonum.trim(),
        woHref: this.woHref || undefined,
        valuesJson: JSON.stringify(values ?? {}),
      };
      const saved = await firstValueFrom(complete ? this.api.complete(dto) : this.api.saveDraft(dto));
      this.existing.set(saved);
      this.info.set(complete ? `Completed. ${saved.writeBackNote ?? ''}` : 'Draft saved.');
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { busy.set(false); }
  }

  // ── mapping ─────────────────────────────────────────────────────────────────

  /** Map a data-driven field def onto a SmartFormComponent FormField. */
  private toSmartFields(defs: MaximoFormFieldDef[]): FormField[] {
    return defs.map(d => {
      const opts = (d.options ?? []).map(o => ({ value: o, label: o }));
      const label = d.type === 'number' && d.unit ? `${d.label} (${d.unit})` : d.label;
      const base: any = { name: d.name, label, validators: d.required ? [Validators.required] : [] };
      if (d.section) base.group = { label: d.section };
      switch (d.type) {
        case 'select': return { ...base, type: 'select', options: opts };
        case 'radio-group': return { ...base, type: 'radio-group', options: opts };
        case 'checkbox-group': return { ...base, type: 'checkbox-group', options: opts };
        case 'checkbox': return { ...base, type: 'checkbox' };
        case 'image': return { ...base, type: 'image', imageSrc: d.imageSrc };   // read-only reference photo
        default: return { ...base, type: d.type };   // text / textarea / number / date → app-form-input
      }
    });
  }

  private parseFields(json?: string): MaximoFormFieldDef[] {
    if (!json) return [];
    try { const a = JSON.parse(json); return Array.isArray(a) ? a : []; } catch { return []; }
  }
  private parseValues(json?: string): any {
    if (!json) return {};
    try { return JSON.parse(json) ?? {}; } catch { return {}; }
  }
  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }
}
