import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Download, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDefinition } from "@/lib/form-config";
import { getPatient, getStats, logDownloads } from "@/lib/patients.functions";
import { downloadPatientPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/forms/$type/$patientId")({
  beforeLoad: ({ params }) => {
    if (!getDefinition(params.type)) throw notFound();
  },
  head: ({ params }) => {
    const definition = getDefinition(params.type);
    const title = `${params.patientId} — ${definition?.label ?? "Record"} — MedForms Pro`;
    return {
      meta: [
        { title },
        { name: "description", content: `Patient record ${params.patientId}.` },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: `Patient record ${params.patientId}.` },
      ],
    };
  },
  component: ViewPatient,
});

function ViewPatient() {
  const { type, patientId } = Route.useParams();
  const definition = getDefinition(type)!;
  const fetchPatient = useServerFn(getPatient);
  const fetchStats = useServerFn(getStats);
  const recordDownloads = useServerFn(logDownloads);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => fetchPatient({ data: { patientId } }),
  });

  const exportPdf = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const stats = await fetchStats();
      await downloadPatientPdf(data, definition, {
        doctorName: stats.doctorName,
        hospitalName: stats.hospitalName,
      });
      await recordDownloads({ data: { patientIds: [patientId] } });
    } catch {
      toast.error("Could not generate the PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/forms/$type"
            params={{ type }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← {definition.label}
          </Link>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight">
            {data?.patient_name || "Unnamed patient"}
            {data && (
              <Badge variant={data.status === "Completed" ? "default" : "secondary"}>
                {data.status}
              </Badge>
            )}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{patientId}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/forms/$type/edit/$patientId" params={{ type, patientId }}>
              <Pencil /> Edit
            </Link>
          </Button>
          <Button disabled={exporting || !data} onClick={exportPdf}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />} Download PDF
          </Button>
        </div>
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
        <div className="grid gap-5">
          {definition.sections.map((section) => (
            <section key={section.key} className="surface-card p-5">
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-primary uppercase">
                {section.title}
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.name} className={field.full ? "sm:col-span-2" : undefined}>
                    <dt className="text-xs text-muted-foreground">{field.label}</dt>
                    <dd className="mt-0.5 text-sm whitespace-pre-wrap">
                      {data.form_json[field.name] || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
