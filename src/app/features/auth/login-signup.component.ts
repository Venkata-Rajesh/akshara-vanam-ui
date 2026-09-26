import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { LoginCredentials, SignupCredentials } from '../../core/auth/auth.models';

@Component({
  selector: 'app-login-signup',
  imports: [CommonModule, FormsModule],
  templateUrl: './login-signup.component.html',
  styleUrl: './login-signup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  loginData: LoginCredentials = {
    email: '',
    password: '',
  };

  signupData: SignupCredentials = {
    username: '',
    email: '',
    password: '',
  };

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  switchToSignup(): void {
    this.isRightPanelActive.set(true);
  }

  switchToLogin(): void {
    this.isRightPanelActive.set(false);
  }

  onLogin(form: NgForm): void {
    if (form.invalid) {
      this.toast.warning('Please enter valid email and password.');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginData).subscribe({
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

  onSignup(form: NgForm): void {
    if (form.invalid) {
      this.toast.warning('Please fill all required fields properly.');
      return;
    }

    if (this.signupData.password.length < 12) {
      this.toast.warning('Password must be at least 12 characters.');
      return;
    }

    this.isLoading.set(true);

    this.authService.signup(this.signupData).subscribe({
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
