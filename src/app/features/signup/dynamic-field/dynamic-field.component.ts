import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormFieldConfig } from '../../../core/models/form-field.model';

const DEFAULT_MESSAGES: Record<string, string> = {
  required: 'This field is required.',
  email: 'Please enter a valid email address.',
  minlength: 'Too short.',
  maxlength: 'Too long.',
  pattern: 'Invalid format.',
};

@Component({
  selector: 'app-dynamic-field',
  imports: [ReactiveFormsModule],
  templateUrl: './dynamic-field.component.html',
  styleUrl: './dynamic-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.span-2]': 'config().span === 2' },
})
export class DynamicFieldComponent {
  readonly config = input.required<FormFieldConfig>();
  readonly control = input.required<FormControl<string>>();
  // Also refreshes this OnPush component when the parent marks every field touched.
  readonly submitted = input(false);

  readonly inputId = computed(() => `field-${this.config().name}`);
  readonly errorId = computed(() => `${this.inputId()}-error`);
  readonly hintId = computed(() => `${this.inputId()}-hint`);

  get showError(): boolean {
    const c = this.control();
    return c.invalid && (c.touched || c.dirty || this.submitted());
  }

  get errorMessage(): string | null {
    const errors = this.control().errors;
    if (!errors) return null;
    const key = Object.keys(errors)[0];
    return this.config().errorMessages?.[key] ?? DEFAULT_MESSAGES[key] ?? 'Invalid value.';
  }

  get describedBy(): string | null {
    const ids: string[] = [];
    if (this.config().hint) ids.push(this.hintId());
    if (this.showError) ids.push(this.errorId());
    return ids.length ? ids.join(' ') : null;
  }
}
