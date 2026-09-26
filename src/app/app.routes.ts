import { Routes } from '@angular/router';
import { guestGuard } from './core/auth/auth.guard';
import { LoginSignupComponent } from './features/auth/login-signup.component';
import { QuotesDashboardComponent } from './features/quotes/quotes-dashboard.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginSignupComponent,
    title: 'InspireHub - Sign In / Sign Up',
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    title: 'InspireHub - Forgot Password',
    canActivate: [guestGuard],
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent,
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
