import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile, saveProfile } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MedForms Pro" },
      { name: "description", content: "Update your doctor name and clinic details for PDF headers." },
      { property: "og:title", content: "Settings — MedForms Pro" },
      { property: "og:description", content: "Doctor and clinic details used on exported PDFs." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const fetchProfile = useServerFn(getProfile);
  const persist = useServerFn(saveProfile);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");

  useEffect(() => {
    if (data) {
      setDoctorName(data.doctorName);
      setHospitalName(data.hospitalName);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => persist({ data: { doctorName, hospitalName } }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: () => toast.error("Could not update your profile"),
  });

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading profile…
        </div>
      ) : (
        <form
          className="surface-card max-w-lg space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="doctor-name">Doctor name</Label>
            <Input
              id="doctor-name"
              required
              value={doctorName}
              onChange={(event) => setDoctorName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hospital-name">Hospital / clinic</Label>
            <Input
              id="hospital-name"
              value={hospitalName}
              onChange={(event) => setHospitalName(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            These details appear in the header of every exported PDF.
          </p>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save
          </Button>
        </form>
      )}
    </AppShell>
  );
}
