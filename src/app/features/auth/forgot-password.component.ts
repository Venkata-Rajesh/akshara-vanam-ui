import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  readonly email = signal('');
  readonly submitted = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal('');

  submit(): void {
    this.error.set('');
    this.isLoading.set(true);
    this.auth.requestPasswordReset(this.email()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submitted.set(true);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.error.set(error.message || 'Unable to process your request.');
      },
    });
  }
}