export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  /** Future questions are forwarded as-is. */
  [key: string]: unknown;
}

export interface SignupResponse extends SignupPayload {
  ok: boolean;
  id: string;
  receivedAt: string;
}
