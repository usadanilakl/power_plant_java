import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserSetupService, PwaUserData } from '../../services/user-setup.service';
import { ServerApiService } from '../../services/server-api.service';
import { ServerStatusService } from '../../services/server-status.service';
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
  router = inject(Router);
  private userSetupService = inject(UserSetupService);
  private serverApi = inject(ServerApiService);
  private serverStatus = inject(ServerStatusService);

  form: FormGroup;
  isUpdate = false;
  /** True when user has local data but isn't registered on server yet */
  needsServerRegistration = false;
  registrationStatus: 'idle' | 'registering' | 'success' | 'offline' | 'error' = 'idle';
  registrationMessage = '';

  constructor() {
    const existingData = this.userSetupService.getUserData();
    this.isUpdate = !!existingData;
    this.needsServerRegistration = !!existingData && !existingData.registeredOnServer;

    this.form = this.fb.group({
      name: [existingData?.name ?? '', [Validators.required, Validators.minLength(2)]],
      email: [existingData?.email ?? '', [Validators.required, Validators.email]],
      phone: [existingData?.phone ?? '', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]+$/)]],
      company: [existingData?.company ?? '', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      signature: [existingData?.signature ?? null]
    });

    // If updating and already registered on server, password is not required
    if (this.isUpdate && existingData?.registeredOnServer) {
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  get showPasswordField(): boolean {
    const data = this.userSetupService.getUserData();
    // Show password: on initial setup, or if returning and not yet registered
    return !this.isUpdate || !data?.registeredOnServer;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    // Save locally first (without password)
    const savedData = this.userSetupService.saveUserData({
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      company: formValue.company,
      signature: formValue.signature ?? undefined,
      registeredOnServer: this.userSetupService.getUserData()?.registeredOnServer ?? false
    });

    // If password provided, attempt server registration
    if (formValue.password) {
      this.attemptServerRegistration(savedData, formValue.password);
    }

    // Navigate immediately — don't block on server response
    if (!this.needsServerRegistration) {
      this.router.navigate(['/work-request/form']);
    }
  }

  /** Complete server registration for returning users */
  completeRegistration(): void {
    const password = this.form.get('password')?.value;
    if (!password || password.length < 8) {
      this.form.get('password')?.markAsTouched();
      return;
    }
    const userData = this.userSetupService.getUserData();
    if (userData) {
      this.attemptServerRegistration(userData, password);
    }
  }

  private attemptServerRegistration(userData: PwaUserData, password: string): void {
    if (!this.serverStatus.isOnline()) {
      this.registrationStatus = 'offline';
      this.registrationMessage = 'Server is offline. Will register automatically when server becomes available.';
      // Store password in memory for auto-retry
      this.serverStatus.setPendingPassword(password);
      if (this.needsServerRegistration) {
        setTimeout(() => this.router.navigate(['/work-request/form']), 2000);
      }
      return;
    }

    this.registrationStatus = 'registering';
    this.serverApi.registerUser({
      pwaUserUuid: userData.uuid,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      company: userData.company,
      password: password
    }).subscribe({
      next: (result) => {
        if (result.success) {
          this.userSetupService.markRegistered();
          this.serverStatus.clearPendingPassword();
          this.registrationStatus = 'success';
          this.registrationMessage = result.status === 'already_exists'
            ? 'Account already registered on server.'
            : 'Account registered! Awaiting admin approval.';
          // Upload signature file if present
          if (userData.signature) {
            this.serverApi.uploadSignatureByUuid(userData.uuid, userData.signature).subscribe({
              error: (err) => console.error('[UserSetup] Signature upload failed:', err)
            });
          }
          if (this.needsServerRegistration) {
            setTimeout(() => this.router.navigate(['/work-request/form']), 2000);
          }
        } else {
          this.registrationStatus = 'error';
          this.registrationMessage = result.message;
        }
      },
      error: (err) => {
        this.registrationStatus = 'error';
        this.registrationMessage = 'Registration failed. Please try again later.';
        // Store password for retry
        this.serverStatus.setPendingPassword(password);
        console.error('[UserSetup] Registration error:', err);
      }
    });
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
      company: 'Company',
      password: 'Password'
    };
    return labels[fieldName] ?? fieldName;
  }
}
