import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ServerApiService } from '../services/server-api.service';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { UserSetupService } from '../services/user-setup.service';
import { ServerStatusService } from '../services/server-status.service';
import { CommonModule } from '@angular/common';
import { SignatureInputComponent } from '../shared/input-fields/signature-input/signature-input.component';
import { PasswordToggleDirective } from '../shared/input-fields/password-toggle.directive';
import { switchMap } from 'rxjs';

type AuthStep = 'identify' | 'signin' | 'register' | 'pending_approval';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SignatureInputComponent, PasswordToggleDirective],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private serverApi = inject(ServerApiService);
  private supabaseAuth = inject(SupabaseAuthService);
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
  /** Hub was unreachable at lookup, so we can't tell new-vs-existing — offer both sign-in and register. */
  offlineChoice = false;

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

    // Deep-link from the reset-password screen ("Go to Login" after a reset). The account is already
    // known, so skip the lookup step and land on sign-in pre-filled.
    const prefill = this.route.snapshot.queryParams['email'];
    if (prefill) {
      this.lookedUpEmail = prefill;
      this.identifyForm.patchValue({ credential: prefill });
      this.loginForm.patchValue({ email: prefill });
      this.step = 'signin';
    }
  }

  onLookup(): void {
    if (this.identifyForm.invalid) return;

    const credential = this.identifyForm.value.credential.trim();
    if (!credential) return;

    this.isLoading = true;
    this.errorMessage = null;

    // Primary: the hub's lookup decides register-vs-signin. If the hub is down, mirror the SAME lookup
    // via Supabase (full backup) so the flow is identical. If BOTH are unreachable (truly offline), we
    // can't tell — fall back to the manual choice (sign in / create an account).
    this.serverApi.lookupUser(credential).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.routeAfterLookup(result.status === 'FOUND', !!result.isActive, result.name || '',
          result.email || credential);
      },
      error: () => {
        if (!this.supabaseAuth.configured) { this.offlineFallback(credential); return; }
        this.supabaseAuth.lookupUser(credential).subscribe({
          next: (sb) => {
            this.isLoading = false;
            this.routeAfterLookup(sb.found, sb.isActive, sb.name, credential);
          },
          error: () => this.offlineFallback(credential),
        });
      }
    });
  }

  /** Route to signin / register from a lookup result (hub OR Supabase). */
  private routeAfterLookup(found: boolean, _isActive: boolean, name: string, email: string): void {
    if (found) {
      this.lookedUpEmail = email;
      this.lookedUpName = name;
      this.loginForm.patchValue({ email });
      // Pending-approval users can now sign in (they get tier-1 access; plant stays gated), so a found
      // account always goes to the sign-in step — no blocking "pending approval" screen.
      this.step = 'signin';
    } else {
      this.signupForm.patchValue({ email });
      this.step = 'register';
    }
  }

  /** Neither hub nor Supabase reachable — can't determine the account; let the user choose. */
  private offlineFallback(credential: string): void {
    this.isLoading = false;
    this.lookedUpEmail = credential;
    this.loginForm.patchValue({ email: credential });
    this.signupForm.patchValue({ email: credential });
    this.offlineChoice = true;
    this.step = 'signin';
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

  /**
   * Fully offline (no internet): basic info is enough — a real account is created later. With internet
   * (hub OR Supabase reachable): a real account is created now, so a password is required.
   */
  get canSubmitSignup(): boolean {
    const f = this.signupForm;
    const basicValid = !!f.get('name')?.valid && !!f.get('email')?.valid
      && !!f.get('phone')?.valid && !!f.get('company')?.valid;
    if (!basicValid) return false;
    if (navigator.onLine) {
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
    // The stored uuid belongs to whoever set this device up. A DIFFERENT person signing up here needs
    // their own — reusing it made the hub treat them as the existing account (or collide on the
    // uuid's unique index). Shared plant tablets hit this routinely.
    const isSamePerson = !!existingData?.email && existingData.email.trim().toLowerCase() === String(email).trim().toLowerCase();
    let pwaUserUuid = isSamePerson && existingData?.uuid ? existingData.uuid : crypto.randomUUID();

    this.userSetupService.saveUserData({ uuid: pwaUserUuid, name, email, phone, company, signature: signature ?? undefined, registeredOnServer: false });

    if (!navigator.onLine) {
      // Truly offline (no hub AND no Supabase): keep basic info on the device; the user finishes signing
      // up (sets a password) when connectivity returns. Survives restarts — nothing sensitive stored.
      this.isLoading = false;
      this.successMessage = 'Saved. You can use the app now — finish signing up to set a password when you\'re back online.';
      setTimeout(() => this.router.navigate([this.returnUrl]), 1500);
      return;
    }

    // Dual-authority sign-up: hub first, Supabase fallback when the hub is unreachable.
    this.authService.signUpDual({ pwaUserUuid, name, email, phone, company, password }).subscribe({
      next: (outcome) => {
        if (outcome.viaSupabase) {
          // Hub was down — the account was created in Supabase. Sign the user in via Supabase so they
          // can use the app right now; the hub provisions the row and admin-approves (for plant access)
          // when it comes back, and full profile sync follows.
          this.userSetupService.saveUserData({ uuid: pwaUserUuid, name, email, phone, company, signature: signature ?? undefined, registeredOnServer: true });
          this.authService.authenticate(email, password).subscribe({
            next: () => { this.isLoading = false; this.router.navigate([this.returnUrl]); },
            error: () => {
              // Couldn't establish a session (rare) — account still exists; show the pending state.
              this.isLoading = false;
              this.step = 'pending_approval';
              this.successMessage = outcome.message;
            }
          });
          return;
        }
        if (!outcome.ok) {
          this.isLoading = false;
          this.errorMessage = outcome.message || 'Registration failed. Please try again.';
          return;
        }
        // Hub success — mark registered, upload signature, then sign in + sync + navigate.
        // The hub may have assigned a different uuid than we asked for; everything keyed on it
        // (signature upload, status polling) must follow the hub's value.
        if (outcome.pwaUserUuid) pwaUserUuid = outcome.pwaUserUuid;
        this.userSetupService.saveUserData({ uuid: pwaUserUuid, name, email, phone, company, signature: signature ?? undefined, registeredOnServer: true });
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
              this.errorMessage = this.registrationErrorText(err);
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
          this.errorMessage = this.registrationErrorText(err);
        }
      }
    });
  }

  /**
   * registerUserRaw preserves the HttpErrorResponse, so the hub's own explanation ("this email
   * belongs to a closed account", …) is in the body. err.message is only Angular's
   * "Http failure response for <url>: 400 Bad Request", which tells the user nothing.
   */
  private registrationErrorText(err: any): string {
    const body = err?.error;
    const serverMessage = body?.responseData?.message ?? body?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage;
    if (typeof err?.message === 'string' && !/^Http failure/i.test(err.message)) return err.message;
    return 'Registration failed. Please try again.';
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
    this.offlineChoice = false;
  }

  /**
   * Browser connectivity (hub AND/OR Supabase reachable). Distinct from serverStatus.isOnline(), which
   * is HUB-only — registration/sign-in must work over Supabase when the hub is down but internet is up.
   */
  get hasInternet(): boolean {
    return navigator.onLine;
  }

  /** From the hub-down sign-in screen, let a new user switch to registration (email carried over). */
  goToRegister(): void {
    this.errorMessage = null;
    this.offlineChoice = false;
    this.signupForm.patchValue({ email: this.lookedUpEmail || this.loginForm.value.email });
    this.step = 'register';
  }
}
