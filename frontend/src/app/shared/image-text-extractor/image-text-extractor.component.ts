import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ImageTextExtractorService } from './image-text-extractor.service';

@Component({
  selector: 'app-image-text-extractor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-text-extractor.component.html',
  styleUrl: './image-text-extractor.component.css',
})
export class ImageTextExtractorComponent {
  private service = inject(ImageTextExtractorService);
  private destroyRef = inject(DestroyRef);

  textSubmitted = output<string>();

  loading = signal(false);
  extractedText = signal('');
  imagePreviewUrl = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.errorMessage.set(null);
    this.extractedText.set('');

    // Show image preview
    const reader = new FileReader();
    reader.onload = () => this.imagePreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);

    // Run OCR
    this.loading.set(true);
    this.service.extractText(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (text) => {
          this.extractedText.set(text);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set('Failed to extract text: ' + (err.error || err.message));
          this.loading.set(false);
        },
      });
  }

  onTextChange(value: string): void {
    this.extractedText.set(value);
  }

  submitText(): void {
    const text = this.extractedText();
    if (text.trim()) {
      this.textSubmitted.emit(text);
    }
  }

  clear(): void {
    this.extractedText.set('');
    this.imagePreviewUrl.set(null);
    this.errorMessage.set(null);
  }
}
