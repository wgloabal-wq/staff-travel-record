"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserRound,
  BriefcaseBusiness,
  Plane,
  WalletCards,
  FileText,
  Loader2,
  AlertCircle,
  Pencil,
  Printer,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Candidate = {
  id: string;

  full_name: string;
  father_name: string | null;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  date_of_birth: string | null;

  passport_number: string | null;
  passport_expiry: string | null;

  country: string | null;
  job_position: string | null;
  employer_name: string | null;
  salary: number | null;
  salary_currency: string | null;
  contract_duration: string | null;
  job_location: string | null;
  joining_date: string | null;
  status: string | null;

  visa_type: string | null;
  visa_number: string | null;
  visa_valid_till: string | null;
  going_date: string | null;
  return_date: string | null;
  flight_number: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;

  registration_fee: number | null;
  visa_fee: number | null;
  ticket_amount: number | null;
  other_charges: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  balance_amount: number | null;
  payment_currency: string | null;

  exchange_rate_to_inr: number | null;
  service_fee_inr: number | null;
  ticket_amount_inr: number | null;
  total_amount_inr: number | null;

  other_file: string | null;

  created_at: string | null;
  updated_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number | null, currency = "INR") {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${currency} ${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function statusClass(status: string | null) {
  switch (status) {
    case "Completed":
    case "Working in Russia":
    case "Travelled":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";

    case "Visa Approved":
    case "Ticket Booked":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function CandidateDetailsPage() {
  const params = useParams();

  const candidateId = String(params.id);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  useEffect(() => {
    async function loadCandidate() {
      setLoading(true);
      setError("");

      try {
        const { data, error: fetchError } = await supabase
          .from("job_candidates")
          .select("*")
          .eq("id", candidateId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setCandidate(data as Candidate);

        if (data?.other_file) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("candidate-documents")
              .createSignedUrl(data.other_file, 3600);

          if (!signedError && signedData?.signedUrl) {
            setDocumentUrl(signedData.signedUrl);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load candidate."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCandidate();
  }, [candidateId]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Loading candidate details...
          </div>
        </div>
      </main>
    );
  }

  if (error || !candidate) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <h2 className="font-bold text-red-800">
                  Candidate not found
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error || "The requested candidate record does not exist."}
                </p>
              </div>
            </div>

            <Link
              href="/candidates"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Candidates
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currency = candidate.payment_currency || "INR";

  /*
   * Service Fee includes Ticket Amount.
   * Therefore Service Fee itself is the total fee.
   */
  const serviceFee = candidate.registration_fee ?? 0;

  const calculatedTotal =
    candidate.total_amount ?? serviceFee;

  const totalInr =
    candidate.total_amount_inr ??
    candidate.service_fee_inr ??
    (candidate.exchange_rate_to_inr
      ? serviceFee * candidate.exchange_rate_to_inr
      : null);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link
            href="/candidates"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Candidates
          </Link>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <Link
              href={`/candidates/${candidate.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" />
              Edit Candidate
            </Link>
          </div>
        </div>

        {/* HERO */}
        <section className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-lg">
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <UserRound className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Candidate Profile
                  </p>

                  <h1 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
                    {candidate.full_name}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
                    {candidate.job_position && (
                      <span className="flex items-center gap-1.5">
                        <BriefcaseBusiness className="h-4 w-4" />
                        {candidate.job_position}
                      </span>
                    )}

                    {candidate.country && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {candidate.country}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${statusClass(
                  candidate.status
                )}`}
              >
                <span className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  {candidate.status || "New Lead"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/10 sm:grid-cols-3">
            <HeroStat
              label="Mobile"
              value={candidate.mobile || "—"}
            />

            <HeroStat
              label="Job Position"
              value={candidate.job_position || "—"}
            />

            <HeroStat
              label="Country"
              value={candidate.country || "—"}
            />
          </div>
        </section>

        {/* PERSONAL DETAILS */}
        <DetailSection
          icon={<UserRound className="h-5 w-5" />}
          title="Personal Details"
          description="Candidate contact and personal information."
        >
          <InfoGrid
            items={[
              ["Full Name", candidate.full_name],
              ["Father's Name", candidate.father_name],
              ["Date of Birth", formatDate(candidate.date_of_birth)],
              ["Mobile", candidate.mobile],
              ["WhatsApp", candidate.whatsapp],
              ["Email", candidate.email],
              ["City", candidate.city],
              ["State", candidate.state],
              ["Address", candidate.address, true],
            ]}
          />
        </DetailSection>

        {/* PASSPORT */}
        <DetailSection
          icon={<FileText className="h-5 w-5" />}
          title="Passport Details"
          description="Passport information for overseas processing."
        >
          <InfoGrid
            items={[
              ["Passport Number", candidate.passport_number],
              ["Passport Expiry", formatDate(candidate.passport_expiry)],
            ]}
          />
        </DetailSection>

        {/* JOB */}
        <DetailSection
          icon={<BriefcaseBusiness className="h-5 w-5" />}
          title="Job & Employer"
          description="Employment and contract information."
        >
          <InfoGrid
            items={[
              ["Country", candidate.country],
              ["Job Position", candidate.job_position],
              ["Employer", candidate.employer_name],
              [
                "Salary",
                candidate.salary !== null
                  ? formatMoney(
                      candidate.salary,
                      candidate.salary_currency || "RUB"
                    )
                  : null,
              ],
              ["Contract Duration", candidate.contract_duration],
              ["Job Location", candidate.job_location],
              ["Joining Date", formatDate(candidate.joining_date)],
              ["Status", candidate.status],
            ]}
          />
        </DetailSection>

        {/* VISA & TRAVEL */}
        <DetailSection
          icon={<Plane className="h-5 w-5" />}
          title="Visa & Travel"
          description="Visa, flight and travel information."
        >
          <InfoGrid
            items={[
              ["Visa Type", candidate.visa_type],
              ["Visa Number", candidate.visa_number],
              ["Visa Valid Till", formatDate(candidate.visa_valid_till)],
              ["Going Date", formatDate(candidate.going_date)],
              ["Return Date", formatDate(candidate.return_date)],
              ["Flight Number", candidate.flight_number],
              ["Departure Airport", candidate.departure_airport],
              ["Arrival Airport", candidate.arrival_airport],
            ]}
          />
        </DetailSection>

        {/* PAYMENT */}
        <DetailSection
          icon={<WalletCards className="h-5 w-5" />}
          title="Payment Details"
          description="Service Fee includes the ticket amount."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MoneyCard
              label="Service Fee"
              value={formatMoney(serviceFee, currency)}
            />

            <MoneyCard
              label="Total Amount"
              value={formatMoney(calculatedTotal, currency)}
            />

            <MoneyCard
              label="Amount Paid"
              value={formatMoney(
                candidate.amount_paid ?? 0,
                currency
              )}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Exchange Rate
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {candidate.exchange_rate_to_inr
                  ? `1 ${currency} = ₹ ${candidate.exchange_rate_to_inr}`
                  : "Not available"}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Total in INR
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {totalInr !== null
                  ? `₹ ${totalInr.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}`
                  : "Not available"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoRow
              label="Balance"
              value={formatMoney(
                candidate.balance_amount ?? 0,
                currency
              )}
            />

            <InfoRow
              label="Payment Currency"
              value={currency}
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Service Fee includes the ticket amount. No separate ticket
            amount is recorded.
          </div>
        </DetailSection>

        {/* DOCUMENT */}
        <DetailSection
          icon={<FileText className="h-5 w-5" />}
          title="Candidate Documents"
          description="All candidate documents are stored in one PDF."
        >
          {candidate.other_file ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    All Candidate Documents
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    Single PDF document
                  </p>
                </div>
              </div>

              {documentUrl ? (
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open PDF
                </a>
              ) : (
                <span className="text-sm text-slate-400">
                  Preparing document...
                </span>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 font-semibold text-slate-700">
                No document uploaded
              </p>

              <p className="mt-1 text-sm text-slate-500">
                A single PDF can be uploaded from the edit page.
              </p>
            </div>
          )}
        </DetailSection>

        {/* QUICK CONTACT */}
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
          {candidate.mobile && (
            <a
              href={`tel:${candidate.mobile}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Phone className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Call
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {candidate.mobile}
                </p>
              </div>
            </a>
          )}

          {candidate.email && (
            <a
              href={`mailto:${candidate.email}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {candidate.email}
                </p>
              </div>
            </a>
          )}

          {(candidate.city || candidate.state) && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <MapPin className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Location
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {[candidate.city, candidate.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* FOOTER INFO */}
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Candidate ID: {candidate.id}</span>

          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Created {formatDate(candidate.created_at)}
          </span>
        </div>
      </div>
    </main>
  );
}

function DetailSection({
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
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          {icon}
        </div>

        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>

          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function InfoGrid({
  items,
}: {
  items: [string, string | number | null | undefined, boolean?][];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value, wide]) => (
        <InfoRow
          key={label}
          label={label}
          value={
            value === null ||
            value === undefined ||
            value === ""
              ? "—"
              : String(value)
          }
          wide={wide}
        />
      ))}
    </div>
  );
}

function InfoRow({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function MoneyCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-t border-white/10 px-5 py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}