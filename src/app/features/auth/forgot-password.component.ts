import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormField, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  readonly model = signal({ email: '' });
  readonly emailForm = form(this.model, (path) => {
    required(path.email);
    email(path.email);
  });
  readonly submitted = signal(false);
  readonly resetUrl = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal('');

  submit(event: Event): void {
    event.preventDefault();
    if (!this.emailForm().valid()) {
      this.emailForm.email().markAsTouched();
      return;
    }
    this.error.set('');
    this.isLoading.set(true);
    this.auth.requestPasswordReset(this.model().email).subscribe({
      next: (resetUrl) => {
        this.isLoading.set(false);
        this.resetUrl.set(resetUrl);
        this.submitted.set(true);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.error.set(error.message || 'Unable to process your request.');
      },
    });
  }
}
