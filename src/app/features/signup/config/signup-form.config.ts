import { Validators } from '@angular/forms';
import { FormFieldConfig } from '../../../core/models/form-field.model';

/** Stricter than Angular's default email validator (requires a TLD). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Names vary across languages; only reject blank input rather than policing spelling.
const NON_BLANK = /\S/u;

/**
 * Single source of truth for the sign-up form.
 * To add a new question, append a new FormFieldConfig here.
 */
export const SIGNUP_FORM_FIELDS: FormFieldConfig[] = [
  {
    name: 'firstName',
    label: 'First name',
    type: 'text',
    autocomplete: 'given-name',
    required: true,
    span: 1,
    validators: [Validators.maxLength(50), Validators.pattern(NON_BLANK)],
    errorMessages: {
      required: 'Please enter your first name.',
      maxlength: 'First name must be 50 characters or fewer.',
      pattern: 'Please enter your first name.',
    },
  },
  {
    name: 'lastName',
    label: 'Last name',
    type: 'text',
    autocomplete: 'family-name',
    required: true,
    span: 1,
    validators: [Validators.maxLength(50), Validators.pattern(NON_BLANK)],
    errorMessages: {
      required: 'Please enter your last name.',
      maxlength: 'Last name must be 50 characters or fewer.',
      pattern: 'Please enter your last name.',
    },
  },
  {
    name: 'email',
    label: 'Email address',
    type: 'email',
    placeholder: 'you@example.com',
    hint: "We'll only use this to send you product updates.",
    autocomplete: 'email',
    required: true,
    span: 2,
    validators: [Validators.email, Validators.pattern(EMAIL_PATTERN)],
    errorMessages: {
      required: 'Please enter your email address.',
      pattern: 'Please enter a valid email address, e.g. you@example.com.',
    },
  },
];
