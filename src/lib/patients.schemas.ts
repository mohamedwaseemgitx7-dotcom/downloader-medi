import { z } from "zod";
import { FORM_TYPES, STATUSES } from "./form-config";

export const formTypeSchema = z.enum(FORM_TYPES);
export const statusSchema = z.enum(STATUSES);

export const formJsonSchema = z.record(z.string().max(4000)).default({});

export const listPatientsSchema = z.object({
  formType: formTypeSchema,
});

export const patientIdSchema = z.object({
  patientId: z
    .string()
    .trim()
    .regex(/^PATIENT\d{3,}$/, "Invalid patient ID"),
});

export const createPatientSchema = z.object({
  formType: formTypeSchema,
  patientName: z.string().trim().max(120).default(""),
  status: statusSchema.default("Draft"),
  formJson: formJsonSchema,
});

export const updatePatientSchema = z.object({
  patientId: patientIdSchema.shape.patientId,
  patientName: z.string().trim().max(120).default(""),
  status: statusSchema,
  formJson: formJsonSchema,
});

export const logDownloadsSchema = z.object({
  patientIds: z.array(patientIdSchema.shape.patientId).min(1).max(200),
});

export const profileSchema = z.object({
  doctorName: z.string().trim().min(1).max(120),
  hospitalName: z.string().trim().max(160).optional().default(""),
});

export type PatientRow = {
  patient_id: string;
  patient_name: string;
  form_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PatientRecord = PatientRow & {
  form_json: Record<string, string>;
};
