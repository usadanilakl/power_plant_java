import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserSetupService, PwaUserData } from '../../services/user-setup.service';
import { SignatureInputComponent } from '../../shared/input-fields/signature-input/signature-input.component';

@Component({
  selector: 'app-user-setup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SignatureInputComponent],
  templateUrl: './user-setup-page.component.html',
  styleUrl: './user-setup-page.component.css'
})
export class UserSetupPageComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userSetupService = inject(UserSetupService);

  form: FormGroup;
  isUpdate = false;

  constructor() {
    const existingData = this.userSetupService.getUserData();
    this.isUpdate = !!existingData;

    this.form = this.fb.group({
      name: [existingData?.name ?? '', [Validators.required, Validators.minLength(2)]],
      email: [existingData?.email ?? '', [Validators.required, Validators.email]],
      phone: [existingData?.phone ?? '', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]+$/)]],
      company: [existingData?.company ?? '', [Validators.required, Validators.minLength(2)]],
      signature: [existingData?.signature ?? null]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    this.userSetupService.saveUserData({
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      company: formValue.company,
      signature: formValue.signature ?? undefined
    });

    this.router.navigate(['/work-request/form']);
  }

  getError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return `${this.getLabel(fieldName)} is required`;
    if (control.errors['email']) return 'Please enter a valid email address';
    if (control.errors['minlength']) return `${this.getLabel(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['pattern']) return 'Please enter a valid phone number';

    return 'Invalid input';
  }

  private getLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company'
    };
    return labels[fieldName] ?? fieldName;
  }
}
