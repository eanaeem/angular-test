import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SignupApiService } from './signup-api.service';

describe('SignupApiService', () => {
  let service: SignupApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SignupApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs the payload to /api/signups with a timestamp', () => {
    const payload = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };
    let result: unknown;

    service.submit(payload).subscribe((r) => (result = r));

    const req = http.expectOne('/api/signups');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject(payload);
    expect(typeof req.request.body.submittedAt).toBe('string');

    req.flush({ id: '1', ...payload });
    expect(result).toEqual({ id: '1', ...payload });
  });
});
