import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SignupFormComponent } from './features/signup/signup-form/signup-form.component';

@Component({
  selector: 'app-root',
  imports: [SignupFormComponent],
  template: `
    <main class="page">
      <app-signup-form />
    </main>
  `,
  styles: `
    .page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: clamp(1rem, 4vw, 3rem) 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
