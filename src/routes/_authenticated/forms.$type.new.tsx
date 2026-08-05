import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PatientForm } from "@/components/patient-form";
import { getDefinition, type PatientStatus } from "@/lib/form-config";
import { createPatient } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/forms/$type/new")({
  beforeLoad: ({ params }) => {
    if (!getDefinition(params.type)) throw notFound();
  },
  head: ({ params }) => {
    const definition = getDefinition(params.type);
    const title = `New ${definition?.label ?? "patient"} record — MedForms Pro`;
    return {
      meta: [
        { title },
        { name: "description", content: `Create a new ${definition?.label ?? "patient"} record.` },
        { property: "og:title", content: title },
        { property: "og:description", content: `Create a new ${definition?.label ?? "patient"} record.` },
      ],
    };
  },
  component: NewPatient,
});

function NewPatient() {
  const { type } = Route.useParams();
  const definition = getDefinition(type)!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useServerFn(createPatient);

  const mutation = useMutation({
    mutationFn: (input: { values: Record<string, string>; status: PatientStatus }) =>
      create({
        data: {
          formType: definition.type,
          patientName: input.values["patient_name"] ?? "",
          status: input.status,
          formJson: input.values,
        },
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["patients", type] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`Saved as ${result.patientId}`);
      navigate({ to: "/forms/$type/$patientId", params: { type, patientId: result.patientId } });
    },
    onError: (error) => toast.error(error.message || "Could not save this record"),
  });

  return (
    <AppShell>
      <div className="mb-6">
        <Link to="/forms/$type" params={{ type }} className="text-xs text-muted-foreground hover:text-foreground">
          ← {definition.label}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New {definition.label}</h1>
        <p className="text-sm text-muted-foreground">
          The patient ID is generated automatically when you save.
        </p>
      </div>
      <PatientForm
        definition={definition}
        saving={mutation.isPending}
        onSubmit={(values, status) => mutation.mutate({ values, status })}
      />
    </AppShell>
  );
}
