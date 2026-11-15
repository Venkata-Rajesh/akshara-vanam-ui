# TestAuth

This project uses [Angular CLI](https://github.com/angular/angular-cli) version 22.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Forms

Form validation and field state use Angular Signal Forms. Authentication, password-reset, quote,
and comment forms bind directly to signal-backed models; the dashboard search and Markdown editor
use signal-backed input controls.

## Theme and design tokens

The UI uses custom Angular controls styled with the Material 3 baseline palette; Angular Material is
not installed. Semantic light/dark color roles, surface containers, typography, shape, elevation,
spacing, state, focus, and motion tokens live in `src/styles.css`. Existing component color aliases
map to those roles so the dashboard, dialogs, auth flows, editor, notifications, and not-found route
stay in sync. Plus Jakarta Sans is the English UI face, with Noto Sans Telugu and Noto Serif Telugu
retained for Telugu text and poetry. The theme toggle continues to persist `theme-preference`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

Run the unit tests with the Angular CLI's Vitest-based test runner:

```bash
npm test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
