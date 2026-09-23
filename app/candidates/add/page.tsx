"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Loader2,
  Plane,
  Save,
  Upload,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type FormState = {
  full_name: string;
  father_name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  date_of_birth: string;

  passport_number: string;
  passport_expiry: string;

  country: string;
  job_position: string;
  employer_name: string;
  salary: string;
  salary_currency: string;
  contract_duration: string;
  job_location: string;
  joining_date: string;
  status: string;

  visa_type: string;
  visa_number: string;
  visa_valid_till: string;
  going_date: string;
  return_date: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;

  service_fee: string;
  amount_paid: string;
  payment_currency: string;
  last_payment_date: string;
  payment_method: string;
  exchange_rate_to_inr: string;
};

const initialForm: FormState = {
  full_name: "",
  father_name: "",
  mobile: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  state: "",
  date_of_birth: "",

  passport_number: "",
  passport_expiry: "",

  country: "Russia",
  job_position: "",
  employer_name: "",
  salary: "",
  salary_currency: "RUB",
  contract_duration: "",
  job_location: "",
  joining_date: "",
  status: "New Lead",

  visa_type: "",
  visa_number: "",
  visa_valid_till: "",
  going_date: "",
  return_date: "",
  flight_number: "",
  departure_airport: "",
  arrival_airport: "",

  service_fee: "",
  amount_paid: "",
  payment_currency: "USD",
  last_payment_date: "",
  payment_method: "",
  exchange_rate_to_inr: "",
};

const statusOptions = [
  "New Lead",
  "Documents Pending",
  "Documents Verified",
  "Job Selected",
  "Offer Letter",
  "Contract Signed",
  "Visa Processing",
  "Visa Approved",
  "Ticket Booked",
  "Travelled",
  "Working in Russia",
  "Completed",
  "Rejected",
];

const currencies = [
  "USD",
  "EUR",
  "RUB",
  "GBP",
  "AED",
  "SAR",
  "CAD",
  "AUD",
  "INR",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function numberValue(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMoney(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

export default function AddCandidatePage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [documentsFile, setDocumentsFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);

  const serviceFee = numberValue(form.service_fee) ?? 0;
  const amountPaid = numberValue(form.amount_paid) ?? 0;
  const balance = Math.max(0, serviceFee - amountPaid);
  const exchangeRate = numberValue(form.exchange_rate_to_inr) ?? 0;
  const serviceFeeInr = serviceFee * exchangeRate;
  const amountPaidInr = amountPaid * exchangeRate;
  const balanceInr = balance * exchangeRate;

  useEffect(() => {
    if (!form.payment_currency || form.payment_currency === "INR") {
      if (form.payment_currency === "INR") {
        setForm((current) => ({ ...current, exchange_rate_to_inr: "1" }));
      }
      return;
    }

    let cancelled = false;

    async function loadRate() {
      setRateLoading(true);

      try {
        const response = await fetch(
          `/api/exchange-rate?from=${encodeURIComponent(
            form.payment_currency
          )}&to=INR`
        );

        const data = await response.json();

        if (!cancelled && response.ok && Number.isFinite(Number(data?.rate))) {
          setForm((current) => ({
            ...current,
            exchange_rate_to_inr: String(data.rate),
          }));
        }
      } catch {
        // The user can enter the actual rate manually.
      } finally {
        if (!cancelled) setRateLoading(false);
      }
    }

    void loadRate();

    return () => {
      cancelled = true;
    };
  }, [form.payment_currency]);

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleDocument(event: ChangeEvent<HTMLInputElement>) {
    setError("");

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Candidate Documents must be a PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Candidate Documents PDF must be 20 MB or smaller.");
      event.target.value = "";
      return;
    }

    setDocumentsFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.full_name.trim()) {
      setError("Candidate full name is required.");
      return;
    }

    if (!form.mobile.trim()) {
      setError("Mobile number is required.");
      return;
    }

    if (!form.country.trim()) {
      setError("Country is required.");
      return;
    }

    if (!form.job_position.trim()) {
      setError("Job position is required.");
      return;
    }

    if (
      form.going_date &&
      form.return_date &&
      form.return_date < form.going_date
    ) {
      setError("Return date cannot be before the going date.");
      return;
    }

    if (amountPaid > serviceFee) {
      setError("Amount paid cannot be greater than the Service Fee.");
      return;
    }

    setSaving(true);

    const candidateId = crypto.randomUUID();
    let uploadedPath: string | null = null;

    try {
      if (documentsFile) {
        const safeName = documentsFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

        const formData = new FormData();
        formData.append("file", documentsFile);
        formData.append("folder", `candidates/${candidateId}`);

        const uploadResponse = await fetch("/api/r2-upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadResult.success || !uploadResult.key) {
          throw new Error(
            uploadResult.message || "Documents upload failed."
          );
        }

        uploadedPath = uploadResult.key as string;
      }

      const { error: insertError } = await supabase
        .from("job_candidates")
        .insert({
          full_name: form.full_name.trim(),
          father_name: form.father_name.trim() || null,
          mobile: form.mobile.trim(),
          whatsapp: form.whatsapp.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          date_of_birth: form.date_of_birth || null,

          passport_number: form.passport_number.trim() || null,
          passport_expiry: form.passport_expiry || null,

          country: form.country.trim(),
          job_position: form.job_position.trim(),
          employer_name: form.employer_name.trim() || null,
          salary: numberValue(form.salary),
          salary_currency: form.salary_currency || null,
          contract_duration: form.contract_duration.trim() || null,
          job_location: form.job_location.trim() || null,
          joining_date: form.joining_date || null,
          status: form.status || "New Lead",

          visa_type: form.visa_type.trim() || null,
          visa_number: form.visa_number.trim() || null,
          visa_valid_till: form.visa_valid_till || null,
          going_date: form.going_date || null,
          return_date: form.return_date || null,
          flight_number: form.flight_number.trim() || null,
          departure_airport: form.departure_airport.trim() || null,
          arrival_airport: form.arrival_airport.trim() || null,

          registration_fee: serviceFee,
          visa_fee: null,
          ticket_amount: null,
          other_charges: null,
          total_amount: serviceFee,
          amount_paid: amountPaid,
          balance_amount: balance,
          payment_currency: form.payment_currency || "USD",
          last_payment_date: form.last_payment_date || null,
          payment_method: form.payment_method.trim() || null,

          exchange_rate_to_inr: exchangeRate > 0 ? exchangeRate : null,
          service_fee_inr: serviceFeeInr > 0 ? serviceFeeInr : null,
          ticket_amount_inr: null,
          total_amount_inr: serviceFeeInr > 0 ? serviceFeeInr : null,

          other_file: uploadedPath,
        });

      if (insertError) {
        if (uploadedPath?.startsWith("candidates/")) {
          await fetch("/api/r2-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keys: [uploadedPath] }),
          }).catch(() => undefined);
        }

        throw new Error(insertError.message);
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/candidates");
        router.refresh();
      }, 700);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while saving the candidate."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
        <Link
          href="/candidates"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </Link>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
                <UserRound className="h-3.5 w-3.5" />
                New Candidate
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Add Job Candidate
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Add the candidate once. You can update the record later from
                the Candidates page.
              </p>
            </div>

            <Link
              href="/candidates"
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
            <p className="mt-0.5 break-words">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            Candidate added successfully.
          </div>
        )}

        <form
          id="candidate-form"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Section
            icon={<UserRound className="h-5 w-5" />}
            title="1. Personal Details"
            description="Basic information and contact details."
          >
            <Field label="Full Name" required value={form.full_name} onChange={(v) => updateField("full_name", v)} placeholder="Candidate full name" />
            <Field label="Father's Name" value={form.father_name} onChange={(v) => updateField("father_name", v)} placeholder="Father's name" />
            <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v) => updateField("date_of_birth", v)} />
            <Field label="Mobile" required value={form.mobile} onChange={(v) => updateField("mobile", v)} placeholder="+91 XXXXX XXXXX" />
            <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => updateField("whatsapp", v)} placeholder="+91 XXXXX XXXXX" />
            <Field label="Email" type="email" value={form.email} onChange={(v) => updateField("email", v)} placeholder="candidate@email.com" />
            <Field label="City" value={form.city} onChange={(v) => updateField("city", v)} placeholder="City" />
            <Field label="State" value={form.state} onChange={(v) => updateField("state", v)} placeholder="State" />
            <div className="sm:col-span-2">
              <TextAreaField label="Address" value={form.address} onChange={(v) => updateField("address", v)} placeholder="Full address" />
            </div>
          </Section>

          <Section
            icon={<FileText className="h-5 w-5" />}
            title="2. Passport"
            description="Passport information."
          >
            <Field label="Passport Number" value={form.passport_number} onChange={(v) => updateField("passport_number", v)} placeholder="Passport number" />
            <Field label="Passport Expiry" type="date" value={form.passport_expiry} onChange={(v) => updateField("passport_expiry", v)} />
          </Section>

          <Section
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            title="3. Job Details"
            description="Country, position and employer information."
          >
            <Field label="Country" required value={form.country} onChange={(v) => updateField("country", v)} placeholder="Russia" />
            <Field label="Job Position" required value={form.job_position} onChange={(v) => updateField("job_position", v)} placeholder="Welder / Driver / Helper" />
            <Field label="Employer" value={form.employer_name} onChange={(v) => updateField("employer_name", v)} placeholder="Company name" />
            <Field label="Salary" type="number" value={form.salary} onChange={(v) => updateField("salary", v)} placeholder="0" />
            <SelectField label="Salary Currency" value={form.salary_currency} onChange={(v) => updateField("salary_currency", v)} options={currencies} />
            <Field label="Contract Duration" value={form.contract_duration} onChange={(v) => updateField("contract_duration", v)} placeholder="1 Year" />
            <Field label="Job Location" value={form.job_location} onChange={(v) => updateField("job_location", v)} placeholder="Moscow" />
            <Field label="Joining Date" type="date" value={form.joining_date} onChange={(v) => updateField("joining_date", v)} />
            <SelectField label="Status" value={form.status} onChange={(v) => updateField("status", v)} options={statusOptions} />
          </Section>

          <Section
            icon={<Plane className="h-5 w-5" />}
            title="4. Visa & Travel"
            description="Visa and flight information."
          >
            <Field label="Visa Type" value={form.visa_type} onChange={(v) => updateField("visa_type", v)} placeholder="Work Visa" />
            <Field label="Visa Number" value={form.visa_number} onChange={(v) => updateField("visa_number", v)} placeholder="Visa number" />
            <Field label="Visa Valid Till" type="date" value={form.visa_valid_till} onChange={(v) => updateField("visa_valid_till", v)} />
            <Field label="Going Date" type="date" value={form.going_date} onChange={(v) => updateField("going_date", v)} />
            <Field label="Return Date" type="date" value={form.return_date} onChange={(v) => updateField("return_date", v)} />
            <Field label="Flight Number" value={form.flight_number} onChange={(v) => updateField("flight_number", v)} placeholder="SU123" />
            <Field label="Departure Airport" value={form.departure_airport} onChange={(v) => updateField("departure_airport", v)} placeholder="DEL" />
            <Field label="Arrival Airport" value={form.arrival_airport} onChange={(v) => updateField("arrival_airport", v)} placeholder="SVO" />
          </Section>

          <Section
            icon={<WalletCards className="h-5 w-5" />}
            title="5. Service Fee"
            description="Only the service fee is recorded. Currency is converted to INR automatically."
          >
            <Field
              label="Service Fee"
              type="number"
              value={form.service_fee}
              onChange={(v) => updateField("service_fee", v)}
              placeholder="50000"
              required
            />

            <SelectField
              label="Currency"
              value={form.payment_currency}
              onChange={(v) => updateField("payment_currency", v)}
              options={currencies}
            />

            <Field
              label="Amount Paid"
              type="number"
              value={form.amount_paid}
              onChange={(v) => updateField("amount_paid", v)}
              placeholder="0"
            />

            <Field
              label="Last Payment Date"
              type="date"
              value={form.last_payment_date}
              onChange={(v) => updateField("last_payment_date", v)}
            />

            <Field
              label="Payment Method"
              value={form.payment_method}
              onChange={(v) => updateField("payment_method", v)}
              placeholder="Cash / Bank / UPI"
            />

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:col-span-2 lg:col-span-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                    Automatic INR Conversion
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {rateLoading
                      ? "Fetching the latest exchange rate..."
                      : `1 ${form.payment_currency} = ₹ ${formatMoney(exchangeRate || 0)}`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
                  <MoneyBox
                    label="Service Fee in INR"
                    value={`₹ ${formatMoney(serviceFeeInr)}`}
                  />
                  <MoneyBox
                    label="Paid in INR"
                    value={`₹ ${formatMoney(amountPaidInr)}`}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Balance
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {form.payment_currency} {formatMoney(balance)}
                  <span className="ml-2 text-slate-400">•</span>
                  <span className="ml-2">₹ {formatMoney(balanceInr)}</span>
                </span>
              </div>
            </div>
          </Section>

          <Section
            icon={<Upload className="h-5 w-5" />}
            title="6. Documents"
            description="Upload all candidate documents together in one PDF."
          >
            <div className="sm:col-span-2 lg:col-span-3">
              {documentsFile ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {documentsFile.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(documentsFile.size / 1024 / 1024).toFixed(2)} MB • PDF
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentsFile(null)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-indigo-300 hover:bg-indigo-50/40">
                  <Upload className="h-6 w-6 text-indigo-500" />
                  <span className="mt-2 text-sm font-bold text-slate-700">
                    Upload Candidate Documents
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    One PDF • Maximum 20 MB
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleDocument}
                    className="hidden"
                  />
                </label>
              )}

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Suggested order: Passport → Photo → CV → Offer Letter →
                Contract → Invitation → Visa → Ticket → Medical → Insurance →
                Other.
              </p>
            </div>
          </Section>

          <div className="hidden items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex">
            <Link
              href="/candidates"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || success}
              className="inline-flex h-11 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Candidate
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-5xl gap-2">
          <Link
            href="/candidates"
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form="candidate-form"
            disabled={saving || success}
            className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Candidate"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function MoneyBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
