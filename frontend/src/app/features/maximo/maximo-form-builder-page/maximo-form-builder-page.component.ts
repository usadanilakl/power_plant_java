import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoFormApiService } from '../../../services/maximo/maximo-form-api.service';
import { MaximoFieldType, MaximoFormFieldDef, MaximoFormTemplate, MaximoWriteTarget } from '../../../models/maximo/maximo-form.models';

/** In-editor shape: the template plus its parsed field list. */
interface EditModel {
  id?: number;
  formKey: string;
  formName: string;
  description: string;
  matchPmnum: string;
  matchDescriptionContains: string;
  completeWoStatus: string;
  active: boolean;
  fields: MaximoFormFieldDef[];
}

/**
 * Admin form-builder: author data-driven electronic task-form templates (no code per form). Each field is a
 * row (name/label/type/required/options/unit/section); the JSON is what the fill page renders via SmartForm.
 */
@Component({
  selector: 'app-maximo-form-builder-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './maximo-form-builder-page.component.html',
  styleUrl: './maximo-form-builder-page.component.css'
})
export class MaximoFormBuilderPageComponent implements OnInit {
  private api = inject(MaximoFormApiService);

  readonly fieldTypes: MaximoFieldType[] = ['text', 'textarea', 'number', 'date', 'checkbox', 'select', 'radio-group', 'checkbox-group', 'image'];
  readonly writeTargets: { value: MaximoWriteTarget; label: string }[] = [
    { value: '', label: 'PDF only' },
    { value: 'worklog', label: 'Worklog line' },
    { value: 'laborhours', label: 'Labor hours' },
    { value: 'reading', label: 'Reading' },
  ];

  templates = signal<MaximoFormTemplate[]>([]);
  editing: EditModel | null = null;
  isNew = false;
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true); this.error.set(null);
    try { this.templates.set(await firstValueFrom(this.api.listTemplates())); }
    catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  /** Seed the curated procedure forms (idempotent), then open the first one. */
  async seed() {
    if (this.loading()) return;
    this.loading.set(true); this.error.set(null); this.info.set(null);
    try {
      const seeded = await firstValueFrom(this.api.seedTemplates());
      await this.load();
      this.info.set(`Seeded ${seeded.length} procedure form(s).`);
      if (seeded[0]) this.edit(seeded[0]);
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  newTemplate() {
    this.isNew = true; this.info.set(null); this.error.set(null);
    this.editing = { formKey: '', formName: '', description: '', matchPmnum: '', matchDescriptionContains: '',
      completeWoStatus: '', active: true, fields: [] };
  }

  edit(t: MaximoFormTemplate) {
    this.isNew = false; this.info.set(null); this.error.set(null);
    this.editing = {
      id: t.id, formKey: t.formKey, formName: t.formName ?? '', description: t.description ?? '',
      matchPmnum: t.matchPmnum ?? '', matchDescriptionContains: t.matchDescriptionContains ?? '',
      completeWoStatus: t.completeWoStatus ?? '', active: t.active !== false,
      fields: this.parseFields(t.fieldsJson),
    };
  }

  cancel() { this.editing = null; }

  addField() {
    this.editing?.fields.push({ name: '', label: '', type: 'text', required: false });
  }
  removeField(i: number) { this.editing?.fields.splice(i, 1); }
  moveField(i: number, dir: -1 | 1) {
    const f = this.editing?.fields; if (!f) return;
    const j = i + dir;
    if (j < 0 || j >= f.length) return;
    [f[i], f[j]] = [f[j], f[i]];
  }

  needsOptions(type: MaximoFieldType): boolean {
    return type === 'select' || type === 'radio-group' || type === 'checkbox-group';
  }
  optionsText(f: MaximoFormFieldDef): string { return (f.options ?? []).join(', '); }
  setOptions(f: MaximoFormFieldDef, text: string) {
    f.options = (text ?? '').split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  async save() {
    if (!this.editing || this.saving()) return;
    const e = this.editing;
    if (!e.formKey.trim() || !e.formName.trim()) { this.error.set('Form key and name are required.'); return; }
    if (e.fields.some(f => !f.name.trim() || !f.label.trim())) { this.error.set('Every field needs a name and a label.'); return; }
    const names = e.fields.map(f => f.name.trim());
    if (new Set(names).size !== names.length) { this.error.set('Field names must be unique.'); return; }

    this.saving.set(true); this.error.set(null); this.info.set(null);
    try {
      const dto: MaximoFormTemplate = {
        id: e.id, formKey: e.formKey.trim(), formName: e.formName.trim(), description: e.description,
        matchPmnum: e.matchPmnum, matchDescriptionContains: e.matchDescriptionContains,
        completeWoStatus: e.completeWoStatus, active: e.active,
        fieldsJson: JSON.stringify(e.fields),
      };
      const saved = await firstValueFrom(this.api.saveTemplate(dto));
      this.info.set(`Saved “${saved.formName}”.`);
      await this.load();
      this.editing = { ...e, id: saved.id };
      this.isNew = false;
    } catch (e2: any) { this.error.set(this.msg(e2)); }
    finally { this.saving.set(false); }
  }

  /** Delete the template currently open in the editor. */
  async removeEditing() {
    const id = this.editing?.id;
    if (id == null) return;
    const t = this.templates().find(x => x.id === id);
    if (t) await this.remove(t);
  }

  async remove(t: MaximoFormTemplate) {
    if (t.id == null) return;
    this.error.set(null);
    try {
      await firstValueFrom(this.api.deleteTemplate(t.id));
      if (this.editing?.id === t.id) this.editing = null;
      await this.load();
    } catch (e: any) { this.error.set(this.msg(e)); }
  }

  private parseFields(json?: string): MaximoFormFieldDef[] {
    if (!json) return [];
    try { const arr = JSON.parse(json); return Array.isArray(arr) ? arr : []; }
    catch { return []; }
  }
  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }
}
