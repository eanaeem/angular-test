import { ValidatorFn } from '@angular/forms';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email';
  placeholder?: string;
  hint?: string;
  autocomplete?: string;
  required?: boolean;
  validators?: ValidatorFn[];
  errorMessages?: Record<string, string>;
  /** Number of columns occupied on wider screens. */
  span?: 1 | 2;
}
