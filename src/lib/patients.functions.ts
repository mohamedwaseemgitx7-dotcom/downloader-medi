import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createPatientSchema,
  listPatientsSchema,
  logDownloadsSchema,
  patientIdSchema,
  profileSchema,
  updatePatientSchema,
  type PatientRecord,
  type PatientRow,
} from "./patients.schemas";

export const listPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listPatientsSchema.parse(data))
  .handler(async ({ data, context }): Promise<PatientRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("patients")
      .select("patient_id, patient_name, form_type, status, created_at, updated_at")
      .eq("doctor_id", context.userId)
      .eq("form_type", data.formType)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as PatientRow[];
  });

export const getStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("patients")
      .select("form_type, status")
      .eq("doctor_id", context.userId);
    if (error) throw new Error(error.message);

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("doctor_name, hospital_name")
      .eq("id", context.userId)
      .maybeSingle();

    const list = (rows ?? []) as { form_type: string; status: string }[];
    const byType: Record<string, { total: number; drafts: number; completed: number }> = {};
    for (const row of list) {
      const bucket = (byType[row.form_type] ??= { total: 0, drafts: 0, completed: 0 });
      bucket.total += 1;
      if (row.status === "Completed") bucket.completed += 1;
      else bucket.drafts += 1;
    }
    return {
      total: list.length,
      drafts: list.filter((r) => r.status !== "Completed").length,
      completed: list.filter((r) => r.status === "Completed").length,
      byType,
      doctorName: profile?.doctor_name ?? "Doctor",
      hospitalName: profile?.hospital_name ?? "",
    };
  });

export const getPatient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => patientIdSchema.parse(data))
  .handler(async ({ data, context }): Promise<PatientRecord | null> => {
    const { data: patient, error } = await context.supabase
      .from("patients")
      .select("patient_id, patient_name, form_type, status, created_at, updated_at")
      .eq("doctor_id", context.userId)
      .eq("patient_id", data.patientId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!patient) return null;

    const { data: form, error: formError } = await context.supabase
      .from("form_data")
      .select("form_json")
      .eq("patient_id", data.patientId)
      .maybeSingle();
    if (formError) throw new Error(formError.message);

    return {
      ...(patient as PatientRow),
      form_json: (form?.form_json ?? {}) as Record<string, string>,
    };
  });

export const createPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createPatientSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("patients")
      .insert({
        doctor_id: context.userId,
        form_type: data.formType,
        status: data.status,
        patient_name: data.patientName,
      })
      .select("patient_id")
      .single();
    if (error) throw new Error(error.message);

    const patientId = (inserted as { patient_id: string }).patient_id;
    const { error: formError } = await context.supabase
      .from("form_data")
      .insert({ patient_id: patientId, form_json: data.formJson });
    if (formError) throw new Error(formError.message);

    return { patientId };
  });

export const updatePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updatePatientSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("patients")
      .update({ status: data.status, patient_name: data.patientName })
      .eq("patient_id", data.patientId)
      .eq("doctor_id", context.userId)
      .select("patient_id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Patient not found");

    const { error: formError } = await context.supabase
      .from("form_data")
      .upsert({ patient_id: data.patientId, form_json: data.formJson }, { onConflict: "patient_id" });
    if (formError) throw new Error(formError.message);

    return { patientId: data.patientId };
  });

export const deletePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => patientIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("patients")
      .delete()
      .eq("patient_id", data.patientId)
      .eq("doctor_id", context.userId);
    if (error) throw new Error(error.message);
    return { patientId: data.patientId };
  });

export const logDownloads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => logDownloadsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("pdf_downloads")
      .insert(data.patientIds.map((patientId) => ({ patient_id: patientId })));
    if (error) throw new Error(error.message);
    return { logged: data.patientIds.length };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("doctor_name, hospital_name")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      doctorName: data?.doctor_name ?? "",
      hospitalName: data?.hospital_name ?? "",
    };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").upsert(
      {
        id: context.userId,
        doctor_name: data.doctorName,
        hospital_name: data.hospitalName,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
