import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Lock, ShieldCheck, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FORM_DEFINITIONS, FORM_TYPES } from "@/lib/form-config";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "MedForms Pro — Patient Forms Management for Doctors" },
      {
        name: "description",
        content:
          "Secure patient form management: four clinical form types, drafts, edits, single and bulk PDF export.",
      },
      { property: "og:title", content: "MedForms Pro — Patient Forms Management for Doctors" },
      {
        property: "og:description",
        content:
          "Four clinical form types, auto patient IDs, draft editing and one-click PDF or ZIP export.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="gradient-medical flex size-8 items-center justify-center rounded-lg">
            <Stethoscope className="size-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold tracking-tight">MedForms Pro</span>
        </div>
        <Button asChild size="sm">
          <Link to="/login">Doctor sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent-foreground uppercase">
          Clinical records, organised
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Patient forms management,{" "}
          <span className="text-gradient-medical">built for consultations</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          Four purpose-built clinical forms, auto-generated patient IDs, editable drafts and
          professional PDF exports — single or bulk.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/login">Sign in to continue</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {FORM_TYPES.map((type) => {
          const definition = FORM_DEFINITIONS[type];
          return (
            <article key={type} className="surface-card p-5">
              <FileText className="size-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">{definition.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{definition.description}</p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="surface-card grid gap-6 p-6 sm:grid-cols-2">
          <div className="flex gap-3">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Row-level data isolation</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Every record is scoped to the signed-in doctor. No doctor can read another
                doctor&apos;s patients.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Lock className="size-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">PDFs generated on your device</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Patient data is never sent to a third-party PDF service.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
