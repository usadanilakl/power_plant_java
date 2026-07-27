import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserSetupService, PwaUserData } from '../../services/user-setup.service';
import { ServerApiService } from '../../services/server-api.service';
import { AuthService } from '../../auth/auth.service';
import { ServerStatusService } from '../../services/server-status.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { SignatureInputComponent } from '../../shared/input-fields/signature-input/signature-input.component';

@Component({
  selector: 'app-user-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MainLayoutComponent, RouterMenuComponent, SignatureInputComponent],
  templateUrl: './user-profile-page.component.html',
  styleUrl: './user-profile-page.component.css'
})
export class UserProfilePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userSetupService = inject(UserSetupService);
  private serverApi = inject(ServerApiService);
  authService = inject(AuthService);
  serverStatus = inject(ServerStatusService);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  registerForm!: FormGroup;

  userData: PwaUserData | null = null;
  isLoggedIn = false;
  permissionLevel = 'NONE';

  profileSaveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  profileSaveMessage = '';

  passwordStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  passwordMessage = '';

  registerStatus: 'idle' | 'saving' | 'success' | 'offline' | 'error' = 'idle';
  registerMessage = '';

  showPasswordForm = false;

  ngOnInit(): void {
    this.userData = this.userSetupService.getUserData();
    this.isLoggedIn = this.authService.isLoggedIn();
    const currentUser = this.authService.getAuthData()?.user;
    this.permissionLevel = currentUser?.permissionLevel ?? 'NONE';

    this.profileForm = this.fb.group({
      name: [this.userData?.name ?? '', [Validators.required, Validators.minLength(2)]],
      email: [this.userData?.email ?? '', [Validators.required, Validators.email]],
      phone: [this.userData?.phone ?? '', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]+$/)]],
      company: [this.userData?.company ?? '', [Validators.required, Validators.minLength(2)]],
      signature: [this.userData?.signature ?? null]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });

    this.registerForm = this.fb.group({
      registerPassword: ['', [Validators.required, Validators.minLength(8)]]
    });

    // Load signature from server if logged in
    if (this.isLoggedIn && this.serverStatus.isOnline()) {
      this.serverApi.getSignature().subscribe({
        next: (res) => {
          if (res.hasSignature && res.signature) {
            this.profileForm.patchValue({ signature: res.signature });
          }
        }
      });
    }
  }

  get needsRegistration(): boolean {
    return !!this.userData && !this.userData.registeredOnServer;
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.value;

    // Save locally
    this.userSetupService.saveUserData({
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      company: formValue.company,
      signature: formValue.signature ?? this.userData?.signature,
      registeredOnServer: this.userData?.registeredOnServer ?? false
    });
    this.userData = this.userSetupService.getUserData();

    // Attempt a server push when we can plausibly reach a store: the hub is up, OR this is a
    // Supabase-issued session and we have internet (updateProfileDual will fall over to Supabase).
    // A hub-only session with the hub down stays local (no password to acquire a Supabase token).
    const canReachAStore = this.serverStatus.isOnline()
      || (navigator.onLine && this.authService.hasSupabaseFallback());
    if (this.isLoggedIn && canReachAStore) {
      this.profileSaveStatus = 'saving';
      // Dual-authority: hub first, Supabase fallback when the hub is unreachable.
      this.authService.updateProfileDual({ name: formValue.name, email: formValue.email, phone: formValue.phone, company: formValue.company }).subscribe({
        next: () => {
          this.profileSaveStatus = 'success';
          this.profileSaveMessage = 'Profile updated.';
          this.clearStatusAfterDelay('profile');
        },
        error: (err) => {
          this.profileSaveStatus = 'error';
          this.profileSaveMessage = err?.message ?? 'Failed to update server profile.';
        }
      });
      // Upload signature file separately if changed
      const sig = formValue.signature;
      if (sig) {
        this.serverApi.uploadSignature(sig).subscribe({
          error: (err) => console.error('[Profile] Signature upload failed:', err)
        });
      }
    } else {
      this.profileSaveStatus = 'success';
      this.profileSaveMessage = 'Saved locally.' + (this.isLoggedIn ? '' : ' Log in to sync with server.');
      this.clearStatusAfterDelay('profile');
    }
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.passwordStatus = 'error';
      this.passwordMessage = 'New passwords do not match.';
      return;
    }

    // Gate on real connectivity, NOT hub reachability: changePasswordDual falls the hub over to
    // Supabase (re-authenticating with the current password if needed), so a hub outage must not block it.
    if (!navigator.onLine) {
      this.passwordStatus = 'error';
      this.passwordMessage = 'You appear to be offline. Cannot change password.';
      return;
    }

    this.passwordStatus = 'saving';
    // Dual-authority: hub first, Supabase fallback when the hub is unreachable.
    this.authService.changePasswordDual(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordStatus = 'success';
        this.passwordMessage = 'Password changed successfully.';
        this.passwordForm.reset();
        this.showPasswordForm = false;
        this.clearStatusAfterDelay('password');
      },
      error: (err) => {
        this.passwordStatus = 'error';
        this.passwordMessage = err?.message ?? 'Failed to change password.';
      }
    });
  }

  registerOnServer(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (!this.userData) return;

    if (!navigator.onLine) {
      this.registerStatus = 'offline';
      this.registerMessage = 'No connection. Try again when you\'re online.';
      return;
    }

    const password = this.registerForm.get('registerPassword')!.value;
    const email = this.userData.email;
    this.registerStatus = 'saving';

    // Dual-path: hub first, Supabase fallback when the hub is unreachable — so a deferred user can
    // finish signing up (and get a working account) even during a hub outage.
    this.authService.signUpDual({
      pwaUserUuid: this.userData.uuid,
      name: this.userData.name,
      email: email,
      phone: this.userData.phone,
      company: this.userData.company,
      password: password
    }).subscribe({
      next: (outcome) => {
        if (outcome.ok) {
          this.userSetupService.markRegistered();
          this.userData = this.userSetupService.getUserData();
          this.registerStatus = 'success';
          this.registerMessage = outcome.viaSupabase
            ? 'Account created (hub offline). Awaiting admin approval when the hub reconnects.'
            : 'Registered! Awaiting admin approval. You can log in once approved.';
          this.registerForm.reset();
          // Establish a live session now (hub-down → Supabase) so the user isn't forced to re-auth.
          this.authService.authenticate(email, password).subscribe({ error: () => {} });
        } else {
          this.registerStatus = 'error';
          this.registerMessage = outcome.message;
        }
      },
      error: (err) => {
        this.registerStatus = 'error';
        this.registerMessage = err?.message ?? 'Registration failed.';
      }
    });
  }

  getError(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';
    if (control.errors['required']) return 'Required';
    if (control.errors['email']) return 'Invalid email';
    if (control.errors['minlength']) return `Min ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['pattern']) return 'Invalid format';
    return '';
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  getPermissionLabel(level: string): string {
    const labels: Record<string, string> = {
      'NONE': 'Not approved',
      'BASIC': 'Basic',
      'OPERATOR': 'Operator'
    };
    return labels[level] ?? level;
  }

  private clearStatusAfterDelay(type: 'profile' | 'password'): void {
    setTimeout(() => {
      if (type === 'profile') this.profileSaveStatus = 'idle';
      else this.passwordStatus = 'idle';
    }, 3000);
  }
}
