import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PatientForm } from "@/components/patient-form";
import { getDefinition, type PatientStatus } from "@/lib/form-config";
import { getPatient, updatePatient } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/forms/$type/edit/$patientId")({
  beforeLoad: ({ params }) => {
    if (!getDefinition(params.type)) throw notFound();
  },
  head: ({ params }) => {
    const definition = getDefinition(params.type);
    const title = `Edit ${params.patientId} — ${definition?.label ?? "Record"} — MedForms Pro`;
    return {
      meta: [
        { title },
        { name: "description", content: `Continue or edit patient record ${params.patientId}.` },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: `Edit patient record ${params.patientId}.` },
      ],
    };
  },
  component: EditPatient,
});

function EditPatient() {
  const { type, patientId } = Route.useParams();
  const definition = getDefinition(type)!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchPatient = useServerFn(getPatient);
  const save = useServerFn(updatePatient);

  const { data, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => fetchPatient({ data: { patientId } }),
  });

  const mutation = useMutation({
    mutationFn: (input: { values: Record<string, string>; status: PatientStatus }) =>
      save({
        data: {
          patientId,
          patientName: input.values["patient_name"] ?? "",
          status: input.status,
          formJson: input.values,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patients", type] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Record saved");
      navigate({ to: "/forms/$type/$patientId", params: { type, patientId } });
    },
    onError: (error) => toast.error(error.message || "Could not save this record"),
  });

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          to="/forms/$type/$patientId"
          params={{ type, patientId }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to record
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit {definition.label}</h1>
        <p className="font-mono text-xs text-muted-foreground">{patientId}</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading record…
        </div>
      )}
      {!isLoading && !data && (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          This record could not be found.
        </div>
      )}
      {data && (
        <PatientForm
          definition={definition}
          initialValues={data.form_json}
          initialStatus={data.status === "Completed" ? "Completed" : "Draft"}
          saving={mutation.isPending}
          onSubmit={(values, status) => mutation.mutate({ values, status })}
        />
      )}
    </AppShell>
  );
}
