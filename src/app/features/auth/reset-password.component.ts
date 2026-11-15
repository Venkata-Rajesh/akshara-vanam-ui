import { Component, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PasswordVisibilityToggleComponent } from '../../shared/components/password-visibility-toggle.component';

@Component({
  selector: 'app-reset-password',
  imports: [FormField, RouterLink, PasswordVisibilityToggleComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly model = signal({ password: '', confirmation: '' });
  readonly passwordForm = form(this.model, (path) => {
    required(path.password);
    minLength(path.password, 12);
    required(path.confirmation);
    minLength(path.confirmation, 12);
  });
  readonly passwordVisible = signal(false);
  readonly confirmationVisible = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal('');

  clearError(): void {
    this.error.set('');
  }

  submit(event: Event): void {
    event.preventDefault();
    if (!this.passwordForm().valid()) {
      this.passwordForm.password().markAsTouched();
      this.passwordForm.confirmation().markAsTouched();
      return;
    }
    if (this.model().password !== this.model().confirmation) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.isLoading.set(true);
    this.error.set('');
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.error.set('This reset link is invalid.');
      this.isLoading.set(false);
      return;
    }
    this.auth.resetPassword(token, this.model().password).subscribe({
      next: () => void this.router.navigate(['/login'], { queryParams: { reset: 'success' } }),
      error: (error: Error) => {
        this.isLoading.set(false);
        this.error.set(error.message || 'This reset link is invalid or expired.');
      },
    });
  }
}
