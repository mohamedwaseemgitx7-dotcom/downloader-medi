export const FORM_TYPES = ["general", "emergency", "followup", "history"] as const;
export type FormType = (typeof FORM_TYPES)[number];

export const STATUSES = ["Draft", "Completed"] as const;
export type PatientStatus = (typeof STATUSES)[number];

export type FieldType = "text" | "textarea" | "number" | "date" | "datetime" | "select";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  full?: boolean;
}

export interface FormSection {
  key: string;
  title: string;
  hint?: string;
  fields: FormField[];
}

export interface FormDefinition {
  type: FormType;
  label: string;
  short: string;
  description: string;
  layout: "card" | "timeline" | "accordion" | "wizard";
  sections: FormSection[];
}

const patientDetails: FormField[] = [
  { name: "patient_name", label: "Patient name", type: "text", placeholder: "Full name" },
  { name: "age", label: "Age", type: "number", placeholder: "Years" },
  { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
  { name: "phone", label: "Phone", type: "text", placeholder: "Contact number" },
  { name: "visit_date", label: "Visit date", type: "date" },
  { name: "address", label: "Address", type: "textarea", full: true },
];

export const FORM_DEFINITIONS: Record<FormType, FormDefinition> = {
  general: {
    type: "general",
    label: "General Consultation",
    short: "General",
    description: "Routine consultation with vitals, diagnosis and prescription.",
    layout: "card",
    sections: [
      { key: "patient", title: "Patient Details", fields: patientDetails },
      {
        key: "vitals",
        title: "Vitals",
        fields: [
          { name: "bp", label: "Blood pressure", type: "text", placeholder: "120/80 mmHg" },
          { name: "pulse", label: "Pulse", type: "text", placeholder: "bpm" },
          { name: "temperature", label: "Temperature", type: "text", placeholder: "°F" },
          { name: "spo2", label: "SpO₂", type: "text", placeholder: "%" },
          { name: "weight", label: "Weight", type: "text", placeholder: "kg" },
          { name: "height", label: "Height", type: "text", placeholder: "cm" },
        ],
      },
      {
        key: "symptoms",
        title: "Symptoms",
        fields: [
          { name: "chief_complaint", label: "Chief complaint", type: "text", full: true },
          { name: "duration", label: "Duration", type: "text" },
          { name: "symptom_details", label: "Symptom details", type: "textarea", full: true },
        ],
      },
      {
        key: "diagnosis",
        title: "Diagnosis",
        fields: [
          { name: "provisional_diagnosis", label: "Provisional diagnosis", type: "text", full: true },
          { name: "investigations", label: "Investigations advised", type: "textarea", full: true },
        ],
      },
      {
        key: "medicines",
        title: "Medicines",
        fields: [
          {
            name: "prescription",
            label: "Prescription",
            type: "textarea",
            placeholder: "One medicine per line — name, dose, frequency, duration",
            full: true,
          },
        ],
      },
      {
        key: "notes",
        title: "Notes",
        fields: [{ name: "notes", label: "Doctor's notes", type: "textarea", full: true }],
      },
    ],
  },
  emergency: {
    type: "emergency",
    label: "Emergency Case",
    short: "Emergency",
    description: "Time-stamped emergency record from arrival to outcome.",
    layout: "timeline",
    sections: [
      {
        key: "arrival",
        title: "Arrival Time",
        hint: "When and how the patient reached the facility",
        fields: [
          { name: "patient_name", label: "Patient name", type: "text" },
          { name: "age", label: "Age", type: "number" },
          { name: "arrival_time", label: "Arrival time", type: "datetime" },
          { name: "brought_by", label: "Brought by", type: "text" },
        ],
      },
      {
        key: "complaint",
        title: "Complaint",
        hint: "Presenting complaint and history",
        fields: [
          { name: "chief_complaint", label: "Chief complaint", type: "text", full: true },
          { name: "history", label: "Brief history", type: "textarea", full: true },
        ],
      },
      {
        key: "examination",
        title: "Examination",
        hint: "Vitals and clinical findings on arrival",
        fields: [
          { name: "bp", label: "Blood pressure", type: "text" },
          { name: "pulse", label: "Pulse", type: "text" },
          { name: "spo2", label: "SpO₂", type: "text" },
          { name: "gcs", label: "GCS", type: "text" },
          { name: "findings", label: "Examination findings", type: "textarea", full: true },
        ],
      },
      {
        key: "treatment",
        title: "Treatment",
        hint: "Interventions and medication given",
        fields: [
          { name: "treatment_given", label: "Treatment given", type: "textarea", full: true },
          { name: "procedures", label: "Procedures", type: "textarea", full: true },
        ],
      },
      {
        key: "observation",
        title: "Observation",
        hint: "Response and monitoring notes",
        fields: [
          { name: "observation_notes", label: "Observation notes", type: "textarea", full: true },
          { name: "observation_duration", label: "Observed for", type: "text" },
        ],
      },
      {
        key: "outcome",
        title: "Outcome",
        hint: "Final disposition",
        fields: [
          {
            name: "outcome",
            label: "Outcome",
            type: "select",
            options: ["Discharged", "Admitted", "Referred", "Under observation", "Expired"],
          },
          { name: "outcome_notes", label: "Outcome notes", type: "textarea", full: true },
        ],
      },
    ],
  },
  followup: {
    type: "followup",
    label: "Follow-up",
    short: "Follow-up",
    description: "Progress review against the previous visit.",
    layout: "accordion",
    sections: [
      {
        key: "previous",
        title: "Previous Visit",
        fields: [
          { name: "patient_name", label: "Patient name", type: "text" },
          { name: "previous_visit_date", label: "Previous visit date", type: "date" },
          { name: "previous_diagnosis", label: "Previous diagnosis", type: "text", full: true },
          { name: "previous_treatment", label: "Previous treatment", type: "textarea", full: true },
        ],
      },
      {
        key: "current",
        title: "Current Status",
        fields: [
          {
            name: "progress",
            label: "Progress",
            type: "select",
            options: ["Improved", "Same", "Worsened"],
          },
          { name: "current_complaints", label: "Current complaints", type: "textarea", full: true },
          { name: "vitals_summary", label: "Vitals summary", type: "text", full: true },
        ],
      },
      {
        key: "medication",
        title: "Medication Changes",
        fields: [
          { name: "continued", label: "Continued medicines", type: "textarea", full: true },
          { name: "stopped", label: "Stopped medicines", type: "textarea", full: true },
          { name: "added", label: "Newly added medicines", type: "textarea", full: true },
        ],
      },
      {
        key: "next",
        title: "Next Visit",
        fields: [
          { name: "next_visit_date", label: "Next visit date", type: "date" },
          { name: "next_visit_instructions", label: "Instructions", type: "textarea", full: true },
        ],
      },
      {
        key: "notes",
        title: "Notes",
        fields: [{ name: "notes", label: "Doctor's notes", type: "textarea", full: true }],
      },
    ],
  },
  history: {
    type: "history",
    label: "Medical History",
    short: "History",
    description: "Detailed five-step medical and family history.",
    layout: "wizard",
    sections: [
      { key: "patient", title: "Patient Info", fields: patientDetails },
      {
        key: "medical",
        title: "Medical History",
        fields: [
          { name: "past_illnesses", label: "Past illnesses", type: "textarea", full: true },
          { name: "surgeries", label: "Surgeries", type: "textarea", full: true },
          { name: "allergies", label: "Allergies", type: "textarea", full: true },
          { name: "immunisations", label: "Immunisations", type: "textarea", full: true },
        ],
      },
      {
        key: "family",
        title: "Family History",
        fields: [
          { name: "family_conditions", label: "Family conditions", type: "textarea", full: true },
          { name: "hereditary_risk", label: "Hereditary risk notes", type: "textarea", full: true },
        ],
      },
      {
        key: "medications",
        title: "Current Medications",
        fields: [
          { name: "current_medications", label: "Current medications", type: "textarea", full: true },
          { name: "supplements", label: "Supplements", type: "textarea", full: true },
          {
            name: "lifestyle",
            label: "Lifestyle (smoking / alcohol / diet)",
            type: "textarea",
            full: true,
          },
        ],
      },
      {
        key: "summary",
        title: "Summary",
        fields: [
          { name: "summary", label: "Clinical summary", type: "textarea", full: true },
          { name: "plan", label: "Plan", type: "textarea", full: true },
        ],
      },
    ],
  },
};

export function isFormType(value: string): value is FormType {
  return (FORM_TYPES as readonly string[]).includes(value);
}

export function getDefinition(type: string): FormDefinition | null {
  return isFormType(type) ? FORM_DEFINITIONS[type] : null;
}

export function allFields(definition: FormDefinition): FormField[] {
  return definition.sections.flatMap((section) => section.fields);
}

export function emptyValues(definition: FormDefinition): Record<string, string> {
  return Object.fromEntries(allFields(definition).map((field) => [field.name, ""]));
}
