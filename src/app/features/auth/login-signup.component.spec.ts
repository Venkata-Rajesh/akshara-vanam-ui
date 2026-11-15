import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { LoginSignupComponent } from './login-signup.component';

describe('LoginSignupComponent Signal Forms', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<LoginSignupComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginSignupComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
            isAuthenticated: signal(false),
            login: vi.fn(),
            signup: vi.fn(),
            setSession: vi.fn(),
          },
        },
        { provide: ThemeService, useValue: { isDark: signal(false), toggleTheme: vi.fn() } },
        {
          provide: ToastService,
          useValue: { warning: vi.fn(), success: vi.fn(), error: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginSignupComponent);
    fixture.detectChanges();
  });

  it('validates credentials and disables signup until passwords match', () => {
    const component = fixture.componentInstance;

    expect(component.loginForm().invalid()).toBe(true);
    component.loginForm.email().value.set('not-an-email');
    component.loginForm.password().value.set('secret');
    expect(component.loginForm().invalid()).toBe(true);

    component.loginForm.email().value.set('poet@example.com');
    expect(component.loginForm().valid()).toBe(true);

    component.signupForm.username().value.set('A Poet');
    component.signupForm.email().value.set('poet@example.com');
    component.signupForm.password().value.set('123456789012');
    component.signupForm.confirmation().value.set('12345678901');
    component.switchToSignup();
    fixture.detectChanges();

    const signupButton = fixture.nativeElement.querySelector(
      '.sign-up-container button[type="submit"]',
    ) as HTMLButtonElement;
    expect(component.signupForm().valid()).toBe(true);
    expect(signupButton.disabled).toBe(true);

    component.signupForm.confirmation().value.set('123456789012');
    fixture.detectChanges();
    expect(signupButton.disabled).toBe(false);
  });
});
