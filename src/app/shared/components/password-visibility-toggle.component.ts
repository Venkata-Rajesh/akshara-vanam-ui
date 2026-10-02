import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-password-visibility-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="visibility-toggle"
      [attr.aria-label]="visible() ? 'Hide ' + fieldLabel() : 'Show ' + fieldLabel()"
      [title]="visible() ? 'Hide ' + fieldLabel() : 'Show ' + fieldLabel()"
      (click)="visibleChange.emit(!visible())"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path>
        <circle cx="12" cy="12" r="3"></circle>
        @if (visible()) {
          <path d="m4 4 16 16"></path>
        }
      </svg>
    </button>
  `,
  styles: `
    :host {
      position: absolute;
      top: 50%;
      right: 8px;
      display: grid;
      transform: translateY(-50%);
    }

    .visibility-toggle {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
    }

    .visibility-toggle:hover {
      background: var(--bg-surface-glass-hover);
      color: var(--text-primary);
    }

    .visibility-toggle:focus-visible {
      outline: 2px solid var(--primary-500);
      outline-offset: 2px;
    }
  `,
})
export class PasswordVisibilityToggleComponent {
  readonly visible = input.required<boolean>();
  readonly fieldLabel = input('password');
  readonly visibleChange = output<boolean>();
}
