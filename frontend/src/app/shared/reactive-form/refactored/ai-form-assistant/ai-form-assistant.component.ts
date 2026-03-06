import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { AgentFormFillService, FieldSpec, FormFillResponse } from '../../../../services/agent/agent-form-fill.service';

@Component({
  selector: 'app-ai-form-assistant',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-form-assistant.component.html',
  styleUrl: './ai-form-assistant.component.css',
})
export class AiFormAssistantComponent {
  private formFillService = inject(AgentFormFillService);

  formType = input.required<string>();
  fields = input<RfFormField[]>([]);
  currentValues = input<Record<string, any>>({});

  fieldValues = output<Record<string, any>>();

  promptText = '';
  isProcessing = signal(false);
  lastMessage = signal('');

  onSubmit(): void {
    const message = this.promptText.trim();
    if (!message || this.isProcessing()) return;

    this.isProcessing.set(true);
    this.lastMessage.set('');

    const fieldSpecs: FieldSpec[] = this.fields()
      .filter(f => f.type !== 'hidden' && f.type !== 'comment' && f.type !== 'equipment-list-manager'
        && f.type !== 'equipment-browser' && f.type !== 'equipment-shape-drawer')
      .map(f => ({
        name: f.name,
        label: f.label,
        type: f.type,
        ...(f.categoryAlias ? { categoryAlias: f.categoryAlias } : {}),
      }));

    this.formFillService.fillForm({
      formType: this.formType(),
      userMessage: message,
      fields: fieldSpecs,
      currentValues: this.currentValues(),
    }).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        const data = res.responseData;
        if (data?.success && data.fieldValues && Object.keys(data.fieldValues).length > 0) {
          this.fieldValues.emit(data.fieldValues);
          this.lastMessage.set(data.message || 'Form filled.');
          this.promptText = '';
        } else {
          this.lastMessage.set(data?.message || 'Could not extract values from your input.');
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.lastMessage.set('Error: ' + (err?.error?.message || err?.message || 'Request failed'));
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }
}
