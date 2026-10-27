# UI Engineer sign-up exercise

An Angular form for first name, last name and email, with a local mock API.

## Run locally

Requires Node 20.19+ (tested on Node 22).

```bash
npm ci
npm start
```

Open http://localhost:4200. This starts Angular and the mock API together.
The dev proxy forwards `/api/signups` to `http://127.0.0.1:3000/signups`.
A successful POST returns **HTTP 200** and appends the record to `mock/db.json`.
Use synthetic data such as Ada Lovelace / ada@example.com.

```bash
npm test -- --watch=false # Angular unit tests
npm run test:mock         # actual HTTP requests, using a temporary database
npm run build            # production build in dist/
```

`npm run serve` and `npm run mock` run either server separately.

## How it works

- `signup-form.component` builds the reactive form and handles submission, loading, success and retry.
- `signup-form.config.ts` holds the questions, labels and validators.
- `dynamic-field.component` renders an input with its label, hint and error.
- `signup-api.service.ts` sends the request, with a 15-second timeout.
- `mock/server.mjs` validates required values and saves records to a JSON file.

The form accepts international names, rejects blank names and validates email addresses.
Errors appear after editing, blur or submit. Invalid submit focuses the first invalid input;
success and reset also move focus. Labels and errors are linked to their inputs.
The form uses two columns on wider screens and one on mobile.

## Adding a question

Add an entry to `signup-form.config.ts`, for example:

```ts
{
  name: 'company',
  label: 'Company',
  type: 'text',
  span: 2,
  validators: [Validators.maxLength(100)],
},
```

The form and submitted payload include it automatically. Text and email inputs cover the current
questions. If a future question needs a select or checkbox, add that control when it is needed.

## Review and limitations

Try empty submit, invalid email, keyboard navigation, success and reset. Stop the mock to check
that an error keeps the entered values available for retry. Check a narrow viewport (320px).
Tests cover these form states and the mock's HTTP status codes, persistence and storage failures.
Browser checks are manual; there is no automated end-to-end suite.

This mock is for local development. `MOCK_DB_PATH` overrides its data file and `MOCK_PORT` overrides
port 3000 (also update the proxy if changing ports). Do not save real personal data.
The production build needs a host that serves `/api`; the mock is not a production backend.
