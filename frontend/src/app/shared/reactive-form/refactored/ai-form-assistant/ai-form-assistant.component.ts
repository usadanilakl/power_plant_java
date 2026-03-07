import { Component, inject, input, output, signal, effect, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { AgentFormFillService, FieldSpec, FormFillResponse } from '../../../../services/agent/agent-form-fill.service';
import { SpeechService } from '../../../../services/agent/speech.service';

@Component({
  selector: 'app-ai-form-assistant',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-form-assistant.component.html',
  styleUrl: './ai-form-assistant.component.css',
})
export class AiFormAssistantComponent {
  private formFillService = inject(AgentFormFillService);
  speech = inject(SpeechService);
  private destroyRef = inject(DestroyRef);

  formType = input.required<string>();
  fields = input<RfFormField[]>([]);
  currentValues = input<Record<string, any>>({});
  formContext = input<Record<string, string>>({});

  fieldValues = output<Record<string, any>>();

  promptText = '';
  isProcessing = signal(false);
  lastMessage = signal('');
  guidanceItems = signal<string[]>([]);

  // STT: watch transcript buffer and populate promptText
  private userPrefix = '';
  private wasRecording = false;

  private transcriptEffect = effect(() => {
    const recording = this.speech.isRecording();
    const transcript = this.speech.transcriptBuffer();

    if (recording && !this.wasRecording) {
      this.userPrefix = this.promptText;
    }

    if (recording && transcript) {
      const separator = this.userPrefix && !this.userPrefix.endsWith(' ') ? ' ' : '';
      this.promptText = this.userPrefix + separator + transcript;
    }

    if (!recording && this.wasRecording) {
      this.speech.transcriptBuffer.set('');
      this.userPrefix = '';
    }

    this.wasRecording = recording;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.speech.isRecording()) {
        this.speech.stopVoiceInput();
      }
    });
  }

  onSubmit(): void {
    const message = this.promptText.trim();
    if (!message || this.isProcessing()) return;

    if (this.speech.isRecording()) {
      this.speech.stopVoiceInput();
    }

    this.isProcessing.set(true);
    this.lastMessage.set('');
    this.guidanceItems.set([]);

    const fieldSpecs: FieldSpec[] = this.fields()
      .filter(f => f.type !== 'hidden' && f.type !== 'comment' && f.type !== 'equipment-list-manager'
        && f.type !== 'equipment-browser' && f.type !== 'equipment-shape-drawer')
      .map(f => ({
        name: f.name,
        label: f.label,
        type: f.type,
        ...(f.categoryAlias ? { categoryAlias: f.categoryAlias } : {}),
      }));

    const ctx = this.formContext();

    this.formFillService.fillForm({
      formType: this.formType(),
      userMessage: message,
      fields: fieldSpecs,
      currentValues: this.currentValues(),
      ...(Object.keys(ctx).length > 0 ? { formContext: ctx } : {}),
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
        this.guidanceItems.set(data?.guidance ?? []);

        // Auto-speak response
        if (this.speech.autoSpeak() && data?.message) {
          const fullText = [data.message, ...(data.guidance ?? [])].join('. ');
          this.speech.speakText(fullText);
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.lastMessage.set('Error: ' + (err?.error?.message || err?.message || 'Request failed'));
        this.guidanceItems.set([]);
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  toggleMic(): void {
    if (this.speech.isRecording()) {
      this.speech.stopVoiceInput();
    } else {
      this.speech.startVoiceInput();
    }
  }

  speakResponse(): void {
    if (this.speech.isSpeaking()) {
      this.speech.stopSpeaking();
    } else {
      const fullText = [this.lastMessage(), ...this.guidanceItems()].filter(Boolean).join('. ');
      if (fullText) {
        this.speech.speakText(fullText);
      }
    }
  }
}
