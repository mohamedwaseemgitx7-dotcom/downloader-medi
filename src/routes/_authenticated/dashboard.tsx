import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, FileText, FolderOpen, Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { getStats } from "@/lib/patients.functions";
import { FORM_DEFINITIONS, FORM_TYPES } from "@/lib/form-config";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedForms Pro" },
      { name: "description", content: "Live counts of your patient records across all form types." },
      { property: "og:title", content: "Dashboard — MedForms Pro" },
      { property: "og:description", content: "Your patient record statistics at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchStats = useServerFn(getStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchStats(),
  });

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {data?.hospitalName || "MedForms Pro"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Welcome back, Dr. {data?.doctorName ?? "Doctor"}
        </h1>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading statistics…
        </div>
      )}
      {error && <p className="text-sm text-destructive">Could not load statistics.</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total records" value={data.total} />
            <StatCard label="Drafts" value={data.drafts} />
            <StatCard label="Completed" value={data.completed} />
          </div>

          <h2 className="mt-10 mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Form types
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FORM_TYPES.map((type) => {
              const definition = FORM_DEFINITIONS[type];
              const bucket = data.byType[type] ?? { total: 0, drafts: 0, completed: 0 };
              return (
                <Link
                  key={type}
                  to="/forms/$type"
                  params={{ type }}
                  className="surface-card group flex flex-col gap-3 p-5 transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <span className="gradient-medical flex size-9 items-center justify-center rounded-lg">
                      <FileText className="size-4 text-primary-foreground" />
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{definition.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{definition.description}</p>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{bucket.total} records</span>
                    <span>{bucket.drafts} draft</span>
                    <span>{bucket.completed} completed</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {data.total === 0 && (
            <div className="surface-card mt-8 flex items-center gap-3 p-5 text-sm text-muted-foreground">
              <FolderOpen className="size-4" /> No records yet — open a form type above to create your
              first patient record.
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
