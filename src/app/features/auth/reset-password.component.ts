import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
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
  readonly isLoading = signal(false);
  readonly error = signal('');

  submit(): void {
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