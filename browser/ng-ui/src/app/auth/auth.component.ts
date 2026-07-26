import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ServerApiService } from '../services/server-api.service';
import { UserSetupService } from '../services/user-setup.service';
import { ServerStatusService } from '../services/server-status.service';
import { CommonModule } from '@angular/common';
import { SignatureInputComponent } from '../shared/input-fields/signature-input/signature-input.component';
import { switchMap } from 'rxjs';

type AuthStep = 'identify' | 'signin' | 'register' | 'pending_approval';

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
  private route = inject(ActivatedRoute);

  step: AuthStep = 'identify';
  identifyForm!: FormGroup;
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  lookedUpEmail = '';
  lookedUpName = '';
  private returnUrl = '/home';

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      // Logged in — ensure local user data exists before navigating
      if (!this.userSetupService.isValid()) {
        this.authService.syncLocalUserData().subscribe(() => {
          this.router.navigate(['/home']);
        });
      } else {
        this.router.navigate(['/home']);
      }
      return;
    }

    const localData = this.userSetupService.getUserData();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    if (this.route.snapshot.queryParams['reason'] === 'login_required') {
      this.errorMessage = 'Please sign in to access this feature.';
    }

    this.identifyForm = this.fb.group({
      credential: [localData?.email ?? '', [Validators.required]]
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    this.signupForm = this.fb.group({
      name: [localData?.name ?? '', [Validators.required, Validators.minLength(2)]],
      email: [localData?.email ?? '', [Validators.required, Validators.email]],
      phone: [localData?.phone ?? '', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]+$/)]],
      company: [localData?.company ?? '', [Validators.required, Validators.minLength(2)]],
      // Password is required only when submitting online (see canSubmitSignup / onSignUp).
      // Offline signup captures basic info only; the password is set later when finishing online.
      password: ['', [Validators.minLength(8)]],
      signature: [localData?.signature ?? null]
    });

    // "Finish signing up" entry: a user who set up basic info offline (registeredOnServer=false)
    // lands straight on the register step (pre-filled) to set a password and complete registration.
    if (this.route.snapshot.queryParams['complete'] === '1' && localData && !localData.registeredOnServer) {
      this.step = 'register';
    }
  }

  onLookup(): void {
    if (this.identifyForm.invalid) return;

    const credential = this.identifyForm.value.credential.trim();
    if (!credential) return;

    this.isLoading = true;
    this.errorMessage = null;

    this.serverApi.lookupUser(credential).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.status === 'FOUND') {
          this.lookedUpEmail = result.email || credential;
          this.lookedUpName = result.name || '';
          this.loginForm.patchValue({ email: this.lookedUpEmail });
          if (result.isActive) {
            this.step = 'signin';
          } else {
            this.step = 'pending_approval';
          }
        } else {
          this.signupForm.patchValue({ email: credential });
          this.step = 'register';
        }
      },
      error: () => {
        this.isLoading = false;
        // Server unreachable — fall back to signin with what they typed
        this.lookedUpEmail = credential;
        this.loginForm.patchValue({ email: credential });
        this.step = 'signin';
      }
    });
  }

  onSignIn(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;
    const { email, password } = this.loginForm.value;

    this.authService.authenticate(email, password).pipe(
      switchMap(() => this.authService.syncLocalUserData())
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.message || '';
        if (msg.includes('Timeout') || msg.includes('unreachable')) {
          this.errorMessage = 'Server is slow or unreachable. Please try again.';
        } else if (msg.includes('Bad credentials') || msg.includes('INVALID_CREDENTIALS')) {
          this.errorMessage = 'Invalid email or password.';
        } else {
          this.errorMessage = 'Sign in failed. Please try again.';
        }
      }
    });
  }

  /** Offline: basic info is enough (password is set later, online). Online: password required. */
  get canSubmitSignup(): boolean {
    const f = this.signupForm;
    const basicValid = !!f.get('name')?.valid && !!f.get('email')?.valid
      && !!f.get('phone')?.valid && !!f.get('company')?.valid;
    if (!basicValid) return false;
    if (this.serverStatus.isOnline()) {
      const pw = f.get('password')?.value;
      return !!pw && pw.length >= 8;
    }
    return true;
  }

  onSignUp(): void {
    if (!this.canSubmitSignup) { this.signupForm.markAllAsTouched(); return; }

    this.isLoading = true;
    this.errorMessage = null;
    const { name, email, phone, company, password, signature } = this.signupForm.value;
    const existingData = this.userSetupService.getUserData();
    const pwaUserUuid = existingData?.uuid ?? crypto.randomUUID();

    this.userSetupService.saveUserData({ name, email, phone, company, signature: signature ?? undefined, registeredOnServer: false });

    if (!this.serverStatus.isOnline()) {
      // Offline: keep basic info on the device; the user finishes signing up (sets a password)
      // when the server is back. Survives app restarts — nothing sensitive is stored locally.
      this.isLoading = false;
      this.successMessage = 'Saved. You can use the app now — finish signing up to set a password when you\'re back online.';
      setTimeout(() => this.router.navigate([this.returnUrl]), 1500);
      return;
    }

    // Dual-authority sign-up: hub first, Supabase fallback when the hub is unreachable.
    this.authService.signUpDual({ pwaUserUuid, name, email, phone, company, password }).subscribe({
      next: (outcome) => {
        if (outcome.viaSupabase) {
          // Hub was down — account created in Supabase, pending hub admin approval on reconnect.
          this.userSetupService.saveUserData({ name, email, phone, company, signature: signature ?? undefined, registeredOnServer: true });
          this.isLoading = false;
          this.step = 'pending_approval';
          this.successMessage = outcome.message;
          return;
        }
        if (!outcome.ok) {
          this.isLoading = false;
          this.errorMessage = outcome.message || 'Registration failed. Please try again.';
          return;
        }
        // Hub success — mark registered, upload signature, then sign in + sync + navigate.
        this.userSetupService.saveUserData({ name, email, phone, company, signature: signature ?? undefined, registeredOnServer: true });
        if (signature) {
          this.serverApi.uploadSignatureByUuid(pwaUserUuid, signature).subscribe({
            error: (err: any) => console.error('[Auth] Signature upload failed:', err)
          });
        }
        this.authService.authenticate(email, password).pipe(
          switchMap(() => this.authService.syncLocalUserData())
        ).subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate([this.returnUrl]);
          },
          error: (err) => {
            this.isLoading = false;
            if (err?.message?.includes('not yet approved')) {
              this.step = 'pending_approval';
              this.errorMessage = null;
            } else {
              this.errorMessage = err?.message || 'Registration failed. Please try again.';
            }
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        if (err?.message?.includes('not yet approved')) {
          this.step = 'pending_approval';
          this.errorMessage = null;
        } else {
          this.errorMessage = err?.message || 'Registration failed. Please try again.';
        }
      }
    });
  }

  onForgotPassword(): void {
    const email = this.lookedUpEmail || this.loginForm.value.email;
    if (!email) {
      this.errorMessage = 'No email to send reset link to.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.serverApi.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = 'A sign-in link has been sent to your email. Check your inbox.';
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to send reset link. Please try again.';
      }
    });
  }

  goBack(): void {
    this.step = 'identify';
    this.errorMessage = null;
    this.successMessage = null;
  }
}
