import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SignupFormComponent } from './signup-form.component';

describe('SignupFormComponent', () => {
  let fixture: ComponentFixture<SignupFormComponent>;
  let component: SignupFormComponent;
  let http: HttpTestingController;

  const el = <T extends HTMLElement>(sel: string) => fixture.nativeElement.querySelector(sel) as T;
  const type = (id: string, value: string) => {
    const input = el<HTMLInputElement>(`#field-${id}`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupFormComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('renders one control per configured field', () => {
    expect(el('#field-firstName')).toBeTruthy();
    expect(el('#field-lastName')).toBeTruthy();
    expect(el('#field-email')).toBeTruthy();
  });

  it('is invalid when empty and shows errors on submit without calling the API', async () => {
    expect(component.form.invalid).toBe(true);

    el<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(component.submitted()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Please enter your first name.');
    expect(el('#field-firstName').getAttribute('aria-invalid')).toBe('true');
    http.expectNone('/api/signups');
  });

  it('rejects an email without a TLD', () => {
    const email = component.control('email');
    email.setValue('ada@example');
    expect(email.hasError('pattern')).toBe(true);
    email.setValue('ada@example.com');
    expect(email.valid).toBe(true);
  });

  it('submits trimmed values and shows the success state on 200', async () => {
    type('firstName', '  Ada ');
    type('lastName', 'Lovelace');
    type('email', 'ada@example.com');
    await fixture.whenStable();

    el<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(component.status()).toBe('submitting');
    const req = http.expectOne('/api/signups');
    expect(req.request.body).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    });

    req.flush({ id: '1', ...req.request.body }, { status: 200, statusText: 'OK' });
    await fixture.whenStable();

    expect(component.status()).toBe('success');
    expect(fixture.nativeElement.textContent).toContain("You're on the list!");
  });

  it('shows an error message and re-enables the form on failure', async () => {
    component.form.setValue({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });
    component.onSubmit();

    http.expectOne('/api/signups').flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(component.status()).toBe('error');
    expect(component.form.enabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Something went wrong');
  });

  it('reset() returns to the empty idle form', async () => {
    component.form.setValue({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });
    component.onSubmit();
    http.expectOne('/api/signups').flush({ id: '1' });
    await fixture.whenStable();

    component.reset();
    await fixture.whenStable();

    expect(component.status()).toBe('idle');
    expect(component.form.getRawValue()).toEqual({ firstName: '', lastName: '', email: '' });
    expect(el('#field-firstName')).toBeTruthy();
  });
  it('accepts international names and rejects blank names and malformed emails', () => {
    for (const name of ['José', 'O’Connor', '李', 'Jose\u0301']) {
      component.control('firstName').setValue(name);
      expect(component.control('firstName').valid).toBe(true);
    }
    component.control('firstName').setValue('   ');
    expect(component.control('firstName').invalid).toBe(true);
    for (const email of ['a..b@example.com', 'a@example..com', 'a@example']) {
      component.control('email').setValue(email);
      expect(component.control('email').invalid).toBe(true);
    }
  });

  it('prevents duplicate requests and keeps values available for retry', async () => {
    const values = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };
    component.form.setValue(values);
    component.onSubmit();
    component.onSubmit();
    const req = http.expectOne('/api/signups');
    expect(component.form.disabled).toBe(true);
    req.flush('unavailable', { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(component.form.getRawValue()).toEqual(values);
    component.onSubmit();
    http.expectOne('/api/signups').flush({ id: 'retry' });
    await fixture.whenStable();
    expect(component.status()).toBe('success');
    expect(el('#signup-title')).toBe(document.activeElement);
  });
});
