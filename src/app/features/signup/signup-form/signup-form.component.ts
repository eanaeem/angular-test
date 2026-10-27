import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormRecord,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { FormFieldConfig } from '../../../core/models/form-field.model';
import { SignupPayload } from '../../../core/models/signup.model';
import { SignupApiService } from '../../../core/services/signup-api.service';
import { SIGNUP_FORM_FIELDS } from '../config/signup-form.config';
import { DynamicFieldComponent } from '../dynamic-field/dynamic-field.component';

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-signup-form',
  imports: [ReactiveFormsModule, DynamicFieldComponent],
  templateUrl: './signup-form.component.html',
  styleUrl: './signup-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SignupApiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  private focusAfterRender(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }

  readonly fields = SIGNUP_FORM_FIELDS;
  readonly form = this.buildForm(this.fields);

  readonly status = signal<SubmitStatus>('idle');
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  control(name: string): FormControl<string> {
    return this.form.controls[name];
  }

  onSubmit(): void {
    if (this.status() === 'submitting' || this.status() === 'success') return;

    this.submitted.set(true);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.status.set('submitting');
    this.form.disable();

    this.api
      .submit(this.toPayload())
      .pipe(finalize(() => this.form.enable()))
      .subscribe({
        next: () => {
          this.status.set('success');
          this.focusAfterRender('#signup-title');
        },
        error: () => {
          this.status.set('error');
          this.errorMessage.set('Something went wrong while submitting. Please try again.');
        },
      });
  }

  reset(): void {
    this.form.reset();
    this.submitted.set(false);
    this.errorMessage.set(null);
    this.status.set('idle');
    this.focusAfterRender('[id^="field-"]');
  }

  private buildForm(fields: FormFieldConfig[]): FormRecord<FormControl<string>> {
    const controls: Record<string, FormControl<string>> = {};
    for (const field of fields) {
      const validators = [...(field.validators ?? [])];
      if (field.required) validators.unshift(Validators.required);
      controls[field.name] = this.fb.control('', validators);
    }
    return this.fb.record(controls);
  }

  private toPayload(): SignupPayload {
    const raw = this.form.getRawValue();
    const trimmed: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      trimmed[k] = v.trim();
    }
    return trimmed as SignupPayload;
  }

  private focusFirstInvalid(): void {
    const first = this.fields.find((f) => this.form.controls[f.name]?.invalid);
    if (!first) return;
    queueMicrotask(() => document.getElementById(`field-${first.name}`)?.focus());
  }
}
