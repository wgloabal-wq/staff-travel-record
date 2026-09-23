"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  Plane,
  Save,
  Ticket,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type FormState = {
  staff_name: string;
  country: string;
  going_date: string;
  coming_date: string;
  visa_valid_till: string;
};

function validatePdf(file: File) {
  if (file.type !== "application/pdf") {
    return "Only PDF files are allowed.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "PDF file size must be 10 MB or less.";
  }

  return "";
}

export default function AddStaffTravelPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    staff_name: "",
    country: "",
    going_date: "",
    coming_date: "",
    visa_valid_till: "",
  });

  const [goingFile, setGoingFile] = useState<File | null>(null);
  const [returnFile, setReturnFile] = useState<File | null>(null);
  const [sameTicket, setSameTicket] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const staffName = params.get("staff_name");

    if (staffName) {
      setForm((current) => ({
        ...current,
        staff_name: staffName,
      }));
    }
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleGoingFile(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");

    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validatePdf(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setGoingFile(file);
  }

  function handleReturnFile(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");

    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validatePdf(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setSameTicket(false);
    setReturnFile(file);
  }

  async function uploadPdf(
    file: File,
    recordId: string,
    type: "going" | "return"
  ) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("folder", `travel/${recordId}/${type}`);

    const response = await fetch("/api/r2-upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.key) {
      throw new Error(
        result.message || `Unable to upload ${type} ticket.`
      );
    }

    return {
      path: result.key as string,
    };
  }

  async function removeUploadedFiles(paths: string[]) {
    if (!paths.length) return;

    try {
      const response = await fetch("/api/r2-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keys: paths }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.warn(
          "Unable to clean uploaded R2 files:",
          result.message || "Unknown error"
        );
      }
    } catch (removeError) {
      console.warn("Unable to clean uploaded R2 files:", removeError);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const staffName = form.staff_name.trim();
    const country = form.country.trim();

    if (!staffName) {
      setError("Please enter staff name.");
      return;
    }

    if (!country) {
      setError("Please enter country.");
      return;
    }

    if (!form.going_date) {
      setError("Please select going date.");
      return;
    }

    if (form.coming_date && form.going_date > form.coming_date) {
      setError("Return date cannot be before going date.");
      return;
    }

    if (!form.visa_valid_till) {
      setError("Please select visa valid till date.");
      return;
    }

    if (sameTicket && !goingFile) {
      setError("Upload the Going Ticket PDF first before using the same PDF for return.");
      return;
    }

    if (sameTicket && returnFile) {
      setError("Remove the separate Return Ticket PDF when Same PDF is selected.");
      return;
    }

    setSaving(true);

    let recordId = "";
    const uploadedPaths: string[] = [];

    try {
      // Create the trip first so uploaded PDFs can use its ID.
      const { data: createdRecord, error: insertError } = await supabase
        .from("travel_records")
        .insert({
          staff_name: staffName,
          country,
          going_date: form.going_date || null,
          coming_date: form.coming_date || null,
          visa_valid_till: form.visa_valid_till || null,
          ticket_file: null,
          return_ticket_file: null,
        })
        .select("id")
        .single();

      if (insertError || !createdRecord) {
        throw new Error(
          insertError?.message || "Unable to create travel record."
        );
      }

      recordId = createdRecord.id;

      let goingTicketKey: string | null = null;
      let returnTicketKey: string | null = null;

      if (goingFile) {
        const uploaded = await uploadPdf(goingFile, recordId, "going");
        goingTicketKey = uploaded.path;
        uploadedPaths.push(uploaded.path);
      }

      if (sameTicket) {
        returnTicketKey = goingTicketKey;
      } else if (returnFile) {
        const uploaded = await uploadPdf(returnFile, recordId, "return");
        returnTicketKey = uploaded.path;
        uploadedPaths.push(uploaded.path);
      }

      const { error: updateError } = await supabase
        .from("travel_records")
        .update({
          ticket_file: goingTicketKey,
          return_ticket_file: returnTicketKey,
        })
        .eq("id", recordId);

      if (updateError) {
        await removeUploadedFiles(uploadedPaths);

        await supabase
          .from("travel_records")
          .delete()
          .eq("id", recordId);

        throw new Error(
          updateError.message || "Unable to save ticket information."
        );
      }

      setSuccess("Travel record added successfully.");

      setTimeout(() => {
        router.push("/staff");
        router.refresh();
      }, 700);
    } catch (submitError) {
      console.error(submitError);

      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while adding the travel record.";

      setError(message);

      if (recordId) {
        await supabase
          .from("travel_records")
          .delete()
          .eq("id", recordId);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/staff"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff Travel
        </Link>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
                <Plane className="h-3.5 w-3.5" />
                New Travel Trip
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Add Travel
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Add one trip for an employee. The same employee can have
                multiple travel records.
              </p>
            </div>

            <Link
              href="/staff"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <p className="font-semibold">Please check this</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    Staff & Travel Details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Basic information for this trip
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div className="sm:col-span-2">
                <label
                  htmlFor="staff_name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Staff Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="staff_name"
                  name="staff_name"
                  value={form.staff_name}
                  onChange={handleChange}
                  placeholder="e.g. Tarun Kumar"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Enter the same name for future trips to keep the employee
                  history grouped together.
                </p>
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Country <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="e.g. Russia"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="going_date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Going Date <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="going_date"
                    name="going_date"
                    type="date"
                    value={form.going_date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="coming_date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Return Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="coming_date"
                    name="coming_date"
                    type="date"
                    value={form.coming_date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <p className="mt-1.5 text-xs text-slate-400">
                  Leave blank if the employee is still abroad.
                </p>
              </div>

              <div>
                <label
                  htmlFor="visa_valid_till"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Visa Valid Till <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="visa_valid_till"
                    name="visa_valid_till"
                    type="date"
                    value={form.visa_valid_till}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    Travel Tickets
                  </h2>
                  <p className="text-sm text-slate-500">
                    Going and return tickets can be the same PDF or separate
                    PDFs.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <TicketUploadCard
                title="Going Ticket"
                description="Upload the ticket used for travelling to the destination."
                selectedFile={goingFile}
                onFileChange={handleGoingFile}
                onRemove={() => setGoingFile(null)}
              />

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <input
                  type="checkbox"
                  checked={sameTicket}
                  onChange={(event) => {
                    setSameTicket(event.target.checked);

                    if (event.target.checked) {
                      setReturnFile(null);
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />

                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    Return ticket is the same PDF
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    Use this when both going and return tickets are included in
                    one PDF.
                  </span>
                </span>
              </label>

              {!sameTicket && (
                <TicketUploadCard
                  title="Return Ticket"
                  description={
                    form.coming_date
                      ? "Upload the ticket used for the journey back."
                      : "Optional now. You can add the return ticket later from Edit."
                  }
                  selectedFile={returnFile}
                  onFileChange={handleReturnFile}
                  onRemove={() => setReturnFile(null)}
                  optional
                />
              )}

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                <strong className="text-slate-700">PDF only:</strong> Maximum
                file size is 10 MB per ticket.
              </div>
            </div>
          </section>

          <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/staff"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Travel...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Travel
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function TicketUploadCard({
  title,
  description,
  selectedFile,
  onFileChange,
  onRemove,
  optional = false,
}: {
  title: string;
  description: string;
  selectedFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  optional?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <FileText className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>

            {optional && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Optional
              </span>
            )}
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-indigo-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {selectedFile.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-4 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/50">
        <Upload className="h-4 w-4 text-indigo-600" />
        {selectedFile ? "Replace PDF" : "Upload PDF"}
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={onFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
}
