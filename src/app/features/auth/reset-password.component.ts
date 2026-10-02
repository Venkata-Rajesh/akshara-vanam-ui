import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PasswordVisibilityToggleComponent } from '../../shared/components/password-visibility-toggle.component';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink, PasswordVisibilityToggleComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly password = signal('');
  readonly confirmation = signal('');
  readonly passwordVisible = signal(false);
  readonly confirmationVisible = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal('');

  updatePassword(value: string): void {
    this.password.set(value);
    this.error.set('');
  }

  updateConfirmation(value: string): void {
    this.confirmation.set(value);
    this.error.set('');
  }

  submit(): void {
    if (this.password().length < 12) {
      this.error.set('Password must be at least 12 characters.');
      return;
    }
    if (this.password() !== this.confirmation()) {
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
    this.auth.resetPassword(token, this.password()).subscribe({
      next: () => void this.router.navigate(['/login'], { queryParams: { reset: 'success' } }),
      error: (error: Error) => {
        this.isLoading.set(false);
        this.error.set(error.message || 'This reset link is invalid or expired.');
      },
    });
  }
}
