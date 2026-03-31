import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ServerApiService } from '../services/server-api.service';
import { UserSetupService } from '../services/user-setup.service';
import { ServerStatusService } from '../services/server-status.service';
import { CommonModule } from '@angular/common';
import { SignatureInputComponent } from '../shared/input-fields/signature-input/signature-input.component';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SignatureInputComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private serverApi = inject(ServerApiService);
  private userSetupService = inject(UserSetupService);
  serverStatus = inject(ServerStatusService);
  private router = inject(Router);

  mode: 'signin' | 'signup' = 'signin';
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    // If already logged in, redirect to home
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    const localData = this.userSetupService.getUserData();

    // If user has local data but token expired, default to sign-in
    // If no local data at all, default to sign-up (first visit)
    this.mode = localData ? 'signin' : 'signup';

    this.loginForm = this.fb.group({
      email: [localData?.email ?? '', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.signupForm = this.fb.group({
      name: [localData?.name ?? '', [Validators.required, Validators.minLength(2)]],
      email: [localData?.email ?? '', [Validators.required, Validators.email]],
      phone: [localData?.phone ?? '', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]+$/)]],
      company: [localData?.company ?? '', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      signature: [localData?.signature ?? null]
    });
  }

  switchMode(mode: 'signin' | 'signup'): void {
    this.mode = mode;
    this.errorMessage = null;
    this.successMessage = null;
  }

  onSignIn(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;
    const { email, password } = this.loginForm.value;

    this.authService.authenticate(email, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.authService.syncLocalUserData();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Invalid email or password.';
      }
    });
  }

  onSignUp(): void {
    if (this.signupForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;
    const { name, email, phone, company, password, signature } = this.signupForm.value;
    const existingData = this.userSetupService.getUserData();
    const pwaUserUuid = existingData?.uuid ?? crypto.randomUUID();

    // Save user data locally first
    this.userSetupService.saveUserData({ name, email, phone, company, signature: signature ?? undefined, registeredOnServer: false });

    if (!this.serverStatus.isOnline()) {
      // Server offline — save locally, store password for retry, navigate to home
      this.serverStatus.setPendingPassword(password);
      this.isLoading = false;
      this.successMessage = 'Info saved locally. Server registration will complete automatically when online.';
      setTimeout(() => this.router.navigate(['/home']), 1500);
      return;
    }

    this.serverApi.registerUser({ pwaUserUuid, name, email, phone, company, password }).pipe(
      switchMap(result => {
        if (!result.success && result.status !== 'already_exists') {
          throw new Error(result.message);
        }
        this.userSetupService.saveUserData({ name, email, phone, company, signature: signature ?? undefined, registeredOnServer: true });
        // Upload signature if present
        if (signature) {
          this.serverApi.uploadSignatureByUuid(pwaUserUuid, signature).subscribe({
            error: (err: any) => console.error('[Auth] Signature upload failed:', err)
          });
        }
        return this.authService.authenticate(email, password);
      })
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.authService.syncLocalUserData();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err?.message?.includes('not yet approved')) {
          this.successMessage = 'Account registered! Please wait for admin approval before signing in.';
          this.errorMessage = null;
          this.mode = 'signin';
        } else {
          this.errorMessage = err?.message || 'Registration failed. Please try again.';
        }
      }
    });
  }
}
