import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormComponent } from '../../../shared/reactive-form/reactive-form.component';
import { InstrumentDto } from '../../../models/instrumentation/instrument.model';
import { InstrumentApiService } from '../../../services/instrumentation/instrument-api.service';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';

@Component({
  selector: 'app-instrument-form',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, ReactiveFormComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="form-container">
          <div class="form-header">
            <h2>Add New Instrument</h2>
            <button class="action-btn" (click)="goBack()">Back to Instruments</button>
          </div>
          <app-reactive-form
            [fields]="fields"
            [values]="{}"
            [title]="''"
            (formSubmit)="onSubmit($event)"
          ></app-reactive-form>
          @if (message()) {
            <div class="status" [class.error]="isError()" [class.success]="!isError()">{{ message() }}</div>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .form-container {
      max-width: 700px;
    }
    .form-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .form-header h2 {
      margin: 0;
      color: var(--primary-text);
      font-size: 1.1rem;
    }
    .action-btn {
      padding: 0.3rem 0.75rem;
      background: var(--accent-color);
      color: var(--primary-text);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .action-btn:hover { opacity: 0.8; }
    .status {
      padding: 0.5rem 0.75rem;
      margin-top: 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    .status.error { color: var(--status-attention); }
    .status.success { color: var(--status-complete); }
  `]
})
export class InstrumentFormComponent {
  private api = inject(InstrumentApiService);
  private router = inject(Router);

  fields = InstrumentDto.toFormFields();
  message = signal('');
  isError = signal(false);

  onSubmit(values: any) {
    const dto = new InstrumentDto(values);
    this.message.set('Creating instrument...');
    this.isError.set(false);

    this.api.create(dto).subscribe({
      next: () => {
        this.message.set('Instrument created successfully');
        this.isError.set(false);
        setTimeout(() => this.router.navigate(['/instrumentation']), 1500);
      },
      error: err => {
        this.message.set('Failed: ' + (err.error?.message || err.message));
        this.isError.set(true);
      }
    });
  }

  goBack() {
    this.router.navigate(['/instrumentation']);
  }
}
