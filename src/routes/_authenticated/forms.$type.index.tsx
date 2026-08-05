import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Download, FileArchive, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getDefinition } from "@/lib/form-config";
import { deletePatient, getPatient, getStats, listPatients, logDownloads } from "@/lib/patients.functions";
import { downloadPatientPdf, downloadPatientsZip } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/forms/$type/")({
  ssr: false,
  beforeLoad: ({ params }) => {
    if (!getDefinition(params.type)) throw notFound();
  },
  head: ({ params }) => {
    const definition = getDefinition(params.type);
    const title = `${definition?.label ?? "Patient"} records — MedForms Pro`;
    const description = definition?.description ?? "Patient records list.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PatientList,
});

type SortKey = "newest" | "oldest" | "id";

function PatientList() {
  const { type } = Route.useParams();
  const definition = getDefinition(type)!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchList = useServerFn(listPatients);
  const fetchPatient = useServerFn(getPatient);
  const fetchStats = useServerFn(getStats);
  const removePatient = useServerFn(deletePatient);
  const recordDownloads = useServerFn(logDownloads);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "Draft" | "Completed">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients", type],
    queryFn: () => fetchList({ data: { formType: definition.type } }),
  });

  const deleteMutation = useMutation({
    mutationFn: (patientId: string) => removePatient({ data: { patientId } }),
    onSuccess: () => {
      toast.success("Record deleted");
      queryClient.invalidateQueries({ queryKey: ["patients", type] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: () => toast.error("Could not delete this record"),
  });

  const visible = useMemo(() => {
    const list = (patients ?? []).filter((patient) => {
      const term = search.trim().toLowerCase();
      const matchesTerm =
        !term ||
        patient.patient_id.toLowerCase().includes(term) ||
        patient.patient_name.toLowerCase().includes(term);
      const matchesStatus = status === "all" || patient.status === status;
      return matchesTerm && matchesStatus;
    });
    return [...list].sort((a, b) => {
      if (sort === "id") return a.patient_id.localeCompare(b.patient_id);
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "oldest" ? diff : -diff;
    });
  }, [patients, search, status, sort]);

  const exportPdf = async (patientId: string) => {
    setExporting(true);
    try {
      const [record, stats] = await Promise.all([
        fetchPatient({ data: { patientId } }),
        fetchStats(),
      ]);
      if (!record) throw new Error("not found");
      await downloadPatientPdf(record, definition, {
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

  const exportZip = async () => {
    if (selected.length === 0) return;
    setExporting(true);
    try {
      const stats = await fetchStats();
      const records = [];
      for (const patientId of selected) {
        const record = await fetchPatient({ data: { patientId } });
        if (record) records.push(record);
      }
      await downloadPatientsZip(records, definition, {
        doctorName: stats.doctorName,
        hospitalName: stats.hospitalName,
      });
      await recordDownloads({ data: { patientIds: selected } });
      toast.success(`${records.length} PDFs exported as ZIP`);
    } catch {
      toast.error("Could not generate the ZIP archive");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{definition.label}</h1>
          <p className="text-sm text-muted-foreground">{definition.description}</p>
        </div>
        <Button onClick={() => navigate({ to: "/forms/$type/new", params: { type } })}>
          <Plus /> New patient
        </Button>
      </div>

      <div className="surface-card mb-4 flex flex-wrap items-center gap-3 p-4">
        <Input
          placeholder="Search by patient ID or name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Completed">Completed</option>
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="id">Patient ID</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{selected.length} selected</span>
          <Button variant="outline" disabled={selected.length === 0 || exporting} onClick={exportZip}>
            {exporting ? <Loader2 className="animate-spin" /> : <FileArchive />} Bulk ZIP
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading records…
        </div>
      ) : visible.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          No records match your filters yet.
        </div>
      ) : (
        <div className="surface-card divide-y divide-border">
          {visible.map((patient) => (
            <div key={patient.patient_id} className="flex flex-wrap items-center gap-3 p-4">
              <Checkbox
                checked={selected.includes(patient.patient_id)}
                onCheckedChange={(checked) =>
                  setSelected((prev) =>
                    checked
                      ? [...prev, patient.patient_id]
                      : prev.filter((id) => id !== patient.patient_id),
                  )
                }
                aria-label={`Select ${patient.patient_id}`}
              />
              <Link
                to="/forms/$type/$patientId"
                params={{ type, patientId: patient.patient_id }}
                className="min-w-40 flex-1"
              >
                <p className="font-mono text-xs text-muted-foreground">{patient.patient_id}</p>
                <p className="text-sm font-medium">{patient.patient_name || "Unnamed patient"}</p>
              </Link>
              <Badge variant={patient.status === "Completed" ? "default" : "secondary"}>
                {patient.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(patient.updated_at).toLocaleDateString()}
              </span>
              <div className="flex gap-1">
                <Button asChild variant="ghost" size="icon" aria-label="Edit record">
                  <Link
                    to="/forms/$type/edit/$patientId"
                    params={{ type, patientId: patient.patient_id }}
                  >
                    <Pencil />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Download PDF"
                  disabled={exporting}
                  onClick={() => exportPdf(patient.patient_id)}
                >
                  <Download />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete record"
                  onClick={() => deleteMutation.mutate(patient.patient_id)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
