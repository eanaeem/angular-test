import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SignupPayload, SignupResponse } from '../models/signup.model';

@Injectable({ providedIn: 'root' })
export class SignupApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/signups`;

  submit(payload: SignupPayload): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(
      this.endpoint,
      {
        ...payload,
        submittedAt: new Date().toISOString(),
      },
      { timeout: 15000 },
    );
  }
}
