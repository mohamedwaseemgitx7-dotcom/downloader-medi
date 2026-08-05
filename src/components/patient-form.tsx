import { useForm } from "react-hook-form";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { emptyValues, type FormDefinition, type FormField, type FormSection } from "@/lib/form-config";
import type { PatientStatus } from "@/lib/form-config";
import { cn } from "@/lib/utils";

type Values = Record<string, string>;

interface PatientFormProps {
  definition: FormDefinition;
  initialValues?: Values;
  initialStatus?: PatientStatus;
  saving?: boolean;
  onSubmit: (values: Values, status: PatientStatus) => void;
}

function FieldControl({
  field,
  register,
}: {
  field: FormField;
  register: ReturnType<typeof useForm<Values>>["register"];
}) {
  const id = `field-${field.name}`;
  return (
    <div className={cn("space-y-1.5", field.full && "sm:col-span-2")}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {field.label}
      </Label>
      {field.type === "textarea" ? (
        <Textarea id={id} rows={3} placeholder={field.placeholder} {...register(field.name)} />
      ) : field.type === "select" ? (
        <select
          id={id}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          {...register(field.name)}
        >
          <option value="">Select…</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          type={
            field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : field.type === "datetime"
                  ? "datetime-local"
                  : "text"
          }
          placeholder={field.placeholder}
          {...register(field.name)}
        />
      )}
    </div>
  );
}

function SectionGrid({
  section,
  register,
}: {
  section: FormSection;
  register: ReturnType<typeof useForm<Values>>["register"];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {section.fields.map((field) => (
        <FieldControl key={field.name} field={field} register={register} />
      ))}
    </div>
  );
}

export function PatientForm({
  definition,
  initialValues,
  initialStatus = "Draft",
  saving = false,
  onSubmit,
}: PatientFormProps) {
  const { register, getValues } = useForm<Values>({
    defaultValues: { ...emptyValues(definition), ...initialValues },
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submit = (status: PatientStatus) => {
    const values = getValues();
    if (status === "Completed" && !values["patient_name"]?.trim()) {
      setError("Patient name is required before marking this record completed.");
      return;
    }
    setError(null);
    onSubmit(values, status);
  };

  const sections = definition.sections;

  return (
    <div className="space-y-6">
      {definition.layout === "card" && (
        <div className="grid gap-5">
          {sections.map((section) => (
            <section key={section.key} className="surface-card p-5">
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-primary uppercase">
                {section.title}
              </h2>
              <SectionGrid section={section} register={register} />
            </section>
          ))}
        </div>
      )}

      {definition.layout === "timeline" && (
        <div className="surface-card p-5 sm:p-7">
          <ol className="space-y-8">
            {sections.map((section, index) => (
              <li key={section.key} className="relative pl-9">
                <span className="gradient-medical absolute top-1 left-0 flex size-6 items-center justify-center rounded-full text-[11px] font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                {index < sections.length - 1 && (
                  <span className="absolute top-8 left-3 h-[calc(100%-1rem)] w-px bg-border" />
                )}
                <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
                {section.hint && (
                  <p className="mb-3 text-xs text-muted-foreground">{section.hint}</p>
                )}
                <div className="mt-3">
                  <SectionGrid section={section} register={register} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {definition.layout === "accordion" && (
        <div className="surface-card p-2 sm:p-4">
          <Accordion type="multiple" defaultValue={[sections[0]!.key]}>
            {sections.map((section) => (
              <AccordionItem key={section.key} value={section.key}>
                <AccordionTrigger className="px-2 text-sm font-semibold">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="px-2 pt-2">
                  <SectionGrid section={section} register={register} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {definition.layout === "wizard" && (
        <div className="surface-card p-5 sm:p-7">
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Step {step + 1} of {sections.length} — {sections[step]!.title}
              </span>
              <span>{Math.round(((step + 1) / sections.length) * 100)}%</span>
            </div>
            <Progress value={((step + 1) / sections.length) * 100} />
          </div>
          {/* All steps stay mounted so draft data is never lost between steps */}
          {sections.map((section, index) => (
            <div key={section.key} className={cn(index !== step && "hidden")}>
              <SectionGrid section={section} register={register} />
            </div>
          ))}
          <div className="mt-6 flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ChevronLeft /> Back
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={step === sections.length - 1}
              onClick={() => setStep((s) => Math.min(sections.length - 1, s + 1))}
            >
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={saving} onClick={() => submit("Draft")}>
          <Save /> Save draft
        </Button>
        <Button type="button" disabled={saving} onClick={() => submit("Completed")}>
          <CheckCircle2 /> Mark completed
        </Button>
        {initialStatus === "Completed" && (
          <span className="self-center text-xs text-muted-foreground">
            This record is currently marked completed.
          </span>
        )}
      </div>
    </div>
  );
}
