import { Routes } from '@angular/router';
import { guestGuard } from './core/auth/auth.guard';
import { QuotesDashboardComponent } from './features/quotes/quotes-dashboard.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-signup.component').then(
        (module) => module.LoginSignupComponent,
      ),
    title: 'InspireHub - Sign In / Sign Up',
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then(
        (module) => module.ForgotPasswordComponent,
      ),
    title: 'InspireHub - Forgot Password',
    canActivate: [guestGuard],
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./features/auth/reset-password.component').then(
        (module) => module.ResetPasswordComponent,
      ),
    title: 'InspireHub - Reset Password',
    canActivate: [guestGuard],
  },
  {
    path: 'quotes',
    component: QuotesDashboardComponent,
    title: 'InspireHub - Quotes & Inspiration',
  },
  {
    path: '',
    redirectTo: 'quotes',
    pathMatch: 'full',
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'InspireHub - Page Not Found',
  },
];
