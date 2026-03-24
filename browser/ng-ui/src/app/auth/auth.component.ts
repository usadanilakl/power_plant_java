import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ServerApiService } from '../services/server-api.service';
import { UserSetupService } from '../services/user-setup.service';
import { ServerStatusService } from '../services/server-status.service';
import { CommonModule } from '@angular/common';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
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
    const localData = this.userSetupService.getUserData();

    this.loginForm = this.fb.group({
      email: [localData?.email ?? '', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.signupForm = this.fb.group({
      name: [localData?.name ?? '', [Validators.required, Validators.minLength(2)]],
      email: [localData?.email ?? '', [Validators.required, Validators.email]],
      phone: [localData?.phone ?? '', [Validators.required]],
      company: [localData?.company ?? '', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(8)]]
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
        this.router.navigate(['/']);
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
    const { name, email, phone, company, password } = this.signupForm.value;
    const pwaUserUuid = this.userSetupService.getUserData()?.uuid ?? crypto.randomUUID();

    this.serverApi.registerUser({ pwaUserUuid, name, email, phone, company, password }).pipe(
      switchMap(result => {
        if (!result.success && result.status !== 'already_exists') {
          throw new Error(result.message);
        }
        this.userSetupService.saveUserData({ name, email, phone, company, registeredOnServer: true });
        return this.authService.authenticate(email, password);
      })
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.authService.syncLocalUserData();
        this.router.navigate(['/']);
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
