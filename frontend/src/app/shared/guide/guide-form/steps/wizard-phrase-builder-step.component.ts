import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep, StepDataPayload } from '../wizard-stack.types';

interface PhraseSegment {
  type: 'text' | 'placeholder';
  content: string;
  placeholderIndex?: number;
}

@Component({
  selector: 'app-wizard-phrase-builder-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="phrase-builder-step">
      <!-- Phrase text area with toolbar -->
      <div class="builder-toolbar">
        <button
          mat-stroked-button
          color="primary"
          (click)="insertPlaceholder()"
          class="add-placeholder-btn"
        >
          <mat-icon>add</mat-icon>
          Add Tag Placeholder
        </button>
        @if (placeholderCount() > 0) {
          <span class="placeholder-badge">
            {{ placeholderCount() }} placeholder{{ placeholderCount() === 1 ? '' : 's' }}
          </span>
        }
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Verification Phrase</mat-label>
        <textarea
          #phraseInput
          matInput
          [placeholder]="step().phraseBuilderConfig?.placeholder || 'Enter verification phrase... Use the button above to insert equipment tag placeholders'"
          [(ngModel)]="phraseText"
          (ngModelChange)="onTextChange($event)"
          (click)="updateCursorPosition(phraseInput)"
          (keyup)="updateCursorPosition(phraseInput)"
          [maxlength]="step().phraseBuilderConfig?.maxLength || 500"
          rows="4"
        ></textarea>
        @if (step().phraseBuilderConfig?.maxLength) {
          <mat-hint align="end">
            {{ phraseText.length }} / {{ step().phraseBuilderConfig?.maxLength }}
          </mat-hint>
        }
      </mat-form-field>

      <!-- Live preview -->
      @if (segments().length > 0) {
        <div class="phrase-preview">
          <div class="preview-label">
            <mat-icon>visibility</mat-icon>
            Preview
          </div>
          <div class="preview-content">
            @for (segment of segments(); track $index) {
              @if (segment.type === 'text') {
                <span class="segment-text">{{ segment.content }}</span>
              } @else {
                <span class="segment-placeholder" [title]="'Placeholder #' + ((segment.placeholderIndex ?? 0) + 1)">
                  {{ segment.content }}
                </span>
              }
            }
          </div>
        </div>
      }

      <!-- Help text -->
      <div class="phrase-help">
        <mat-icon>info</mat-icon>
        <span>
          Build a phrase with placeholders for equipment tags.
          Example: "Verify that [tag1] is open and [tag2] shows zero pressure"
        </span>
      </div>
    </div>
  `,
  styles: [`
    .phrase-builder-step {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 10px 0;
    }

    .builder-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .add-placeholder-btn mat-icon {
      margin-right: 4px;
    }

    .placeholder-badge {
      font-size: 13px;
      font-weight: 500;
      color: var(--secondary-text, #666);
      padding: 4px 10px;
      background: var(--secondary-background, #f0f2f5);
      border-radius: 12px;
    }

    .full-width {
      width: 100%;
    }

    textarea {
      resize: vertical;
      min-height: 100px;
    }

    .phrase-preview {
      padding: 12px 16px;
      background: var(--secondary-background, #fafafa);
      border-radius: 8px;
      border: 1px solid var(--border-color, #e0e0e0);
    }

    .preview-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text, #666);
      margin-bottom: 8px;
    }

    .preview-label mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .preview-content {
      line-height: 1.8;
      font-size: 14px;
    }

    .segment-text {
      color: var(--primary-text, #333);
    }

    .segment-placeholder {
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      margin: 0 2px;
      background: #e3f2fd;
      color: #1976d2;
      font-family: monospace;
    }

    .phrase-help {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      background: var(--info-background, #e8f4fd);
      border-radius: 6px;
      font-size: 13px;
      color: var(--secondary-text, #555);
      line-height: 1.5;
    }

    .phrase-help mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
      flex-shrink: 0;
      margin-top: 1px;
    }
  `],
})
export class WizardPhraseBuilderStepComponent {
  step = input.required<WizardStep>();
  currentValue = input<string>('');

  valueChange = output<StepDataPayload>();

  phraseText = '';
  private cursorPosition = 0;

  constructor() {
    effect(() => {
      const current = this.currentValue();
      const newValue = current ?? '';
      if (this.phraseText !== newValue) {
        this.phraseText = newValue;
      }
    });
  }

  segments = computed(() => {
    return this.parsePhrase(this.phraseText);
  });

  placeholderCount = computed(() => {
    return this.segments().filter(s => s.type === 'placeholder').length;
  });

  onTextChange(value: string): void {
    this.phraseText = value;
    this.emitValue(value);
  }

  insertPlaceholder(): void {
    const placeholderNum = this.placeholderCount() + 1;
    const placeholder = `[tag${placeholderNum}]`;
    const pos = this.cursorPosition;

    this.phraseText =
      this.phraseText.substring(0, pos) +
      placeholder +
      this.phraseText.substring(pos);

    this.cursorPosition = pos + placeholder.length;
    this.emitValue(this.phraseText);
  }

  updateCursorPosition(textarea: HTMLTextAreaElement): void {
    this.cursorPosition = textarea.selectionStart || 0;
  }

  private emitValue(value: string): void {
    const fieldName = this.step().phraseBuilderConfig?.fieldName || 'alias';
    this.valueChange.emit({
      field: fieldName,
      value,
    });
  }

  private parsePhrase(text: string): PhraseSegment[] {
    if (!text) return [];

    const segments: PhraseSegment[] = [];
    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;
    let placeholderIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      segments.push({ type: 'placeholder', content: match[1], placeholderIndex: placeholderIndex++ });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return segments;
  }
}
