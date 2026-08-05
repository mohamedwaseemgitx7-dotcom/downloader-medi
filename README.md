# MedForms Pro — Doctor Patient Forms Management System

Secure, production-grade patient form management for a single doctor account. Four distinct
clinical form types, auto-generated patient IDs, editable drafts, and client-side PDF / ZIP export.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start v1 (React 19 + TypeScript) |
| Build tool | Vite |
| Routing | TanStack Router (file-based, `src/routes/`) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Forms | React Hook Form + Zod |
| Server state | TanStack Query |
| Backend | Lovable Cloud (Postgres + Auth + Row Level Security) |
| Server logic | TanStack `createServerFn` (typed RPC, runs server-side) |
| PDF | `@react-pdf/renderer` (fully client-side) |
| Bulk export | JSZip + file-saver |
| Hosting | Lovable hosting (automatic HTTPS, publish from the editor) |

## Local development

```bash
npm install
npm run dev
```

Environment variables are read from `.env` (already provisioned by Lovable Cloud). See
`.env.example` for the required names. Only the publishable key is ever exposed to the browser.

## Routes

| Route | Page |
| --- | --- |
| `/` | Public landing page with sign-in CTA |
| `/login` | Doctor sign in / create account (email + password, Google) |
| `/dashboard` | Live statistics + four form-type cards |
| `/forms/:type` | Patient list — search by ID/name, status filter, sort, bulk ZIP |
| `/forms/:type/new` | Create patient record |
| `/forms/:type/:patientId` | View patient record + single PDF |
| `/forms/:type/edit/:patientId` | Edit / continue draft |
| `/settings` | Doctor + clinic details used in PDF headers |

`:type` is one of `general`, `emergency`, `followup`, `history`.

## Form modules

1. **General Consultation** — card layout — Patient Details, Vitals, Symptoms, Diagnosis, Medicines, Notes
2. **Emergency Case** — timeline layout — Arrival Time, Complaint, Examination, Treatment, Observation, Outcome
3. **Follow-up** — accordion layout — Previous Visit, Current Status, Medication Changes, Next Visit, Notes
4. **Medical History** — 5-step wizard — Patient Info, Medical History, Family History, Current Medications, Summary

Every form supports **Save draft** (partial data allowed) and **Mark completed** (patient name required).

## Data model

- `profiles` — one row per doctor, created automatically on signup
- `patients` — `patient_id` auto-generated from a Postgres **sequence** (`PATIENT001`, `PATIENT002`, …), `doctor_id` is the auth user UUID
- `form_data` — full form content stored as `jsonb`, so form fields can change without migrations
- `pdf_downloads` — audit log of every export

## Security

- No custom password table — authentication is fully managed, passwords are stored only as salted hashes
- Row Level Security is enabled on every table, with policies scoped to `auth.uid()` — a doctor can never read another doctor's data
- Patient IDs come from a sequence, so concurrent inserts can never collide
- Client-side Zod validation is backed by Postgres constraints (`not null`, `check`, `unique`)
- Only the publishable key reaches the browser; the service role key is never used in client code
- PDFs are rendered on the doctor's device — no patient data is sent to a third-party PDF service
- Hosting serves the app over HTTPS only

## Deploying

Press **Publish** in the Lovable editor. Backend changes (schema, policies, server functions) go
live immediately; frontend changes go live when you publish.
