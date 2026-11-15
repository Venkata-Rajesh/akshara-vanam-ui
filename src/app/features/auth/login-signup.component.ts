import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { LoginCredentials, SignupCredentials } from '../../core/auth/auth.models';
import { PasswordVisibilityToggleComponent } from '../../shared/components/password-visibility-toggle.component';

type SignupFormData = SignupCredentials & { confirmation: string };

@Component({
  selector: 'app-login-signup',
  imports: [FormField, RouterLink, PasswordVisibilityToggleComponent],
  templateUrl: './login-signup.component.html',
  styleUrl: './login-signup.component.css',
})
export class LoginSignupComponent {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly themeService = inject(ThemeService);

  readonly isDark = this.themeService.isDark;
  readonly isRightPanelActive = signal(false);
  readonly isLoading = signal(false);
  readonly loginPasswordVisible = signal(false);
  readonly signupPasswordVisible = signal(false);
  readonly signupConfirmationVisible = signal(false);
  readonly loginData = signal<LoginCredentials>({
    email: '',
    password: '',
  });
  readonly loginForm = form(this.loginData, (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
  });

  readonly signupData = signal<SignupFormData>({
    username: '',
    email: '',
    password: '',
    confirmation: '',
  });
  readonly signupForm = form(this.signupData, (path) => {
    required(path.username);
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, 12);
    required(path.confirmation);
  });

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  switchToSignup(): void {
    this.isRightPanelActive.set(true);
  }

  switchToLogin(): void {
    this.isRightPanelActive.set(false);
  }

  onLogin(event: Event): void {
    event.preventDefault();
    if (!this.loginForm().valid()) {
      this.loginForm.email().markAsTouched();
      this.loginForm.password().markAsTouched();
      this.toast.warning('Please enter valid email and password.');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginData()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toast.success(`Welcome back, ${res.user.username || res.user.email}!`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/quotes';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.message || 'Login failed. Please check your credentials.');
      },
    });
  }

  onSignup(event: Event): void {
    event.preventDefault();
    const formData = this.signupData();
    if (!this.signupForm().valid()) {
      this.signupForm.username().markAsTouched();
      this.signupForm.email().markAsTouched();
      this.signupForm.password().markAsTouched();
      this.signupForm.confirmation().markAsTouched();
      this.toast.warning('Please fill all required fields properly.');
      return;
    }

    if (formData.password !== formData.confirmation) {
      this.toast.warning('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);

    this.authService.signup({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toast.success(res.message || 'Account created! Signing you in...');
        // Auto sign-in on registration
        this.authService.setSession(res.user, res.token);
        this.router.navigate(['/quotes']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.message || 'Signup failed. Please try again.');
      },
    });
  }
}
