"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Plane,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";

type Candidate = {
  id: number;
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
  last_payment_date: string | null;
  payment_method: string | null;
  exchange_rate_to_inr: number | null;
  service_fee_inr: number | null;
  total_amount_inr: number | null;

  passport_file: string | null;
  photo_file: string | null;
  cv_file: string | null;
  offer_letter_file: string | null;
  contract_file: string | null;
  invitation_file: string | null;
  visa_file: string | null;
  ticket_file: string | null;
  medical_file: string | null;
  insurance_file: string | null;
  other_file: string | null;

  created_at: string;
  updated_at: string;
};

const statuses = [
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

const documentFields: Array<{
  key: keyof Candidate;
  label: string;
}> = [
  { key: "passport_file", label: "Passport" },
  { key: "photo_file", label: "Photo" },
  { key: "cv_file", label: "CV / Resume" },
  { key: "offer_letter_file", label: "Offer Letter" },
  { key: "contract_file", label: "Employment Contract" },
  { key: "invitation_file", label: "Invitation Letter" },
  { key: "visa_file", label: "Visa" },
  { key: "ticket_file", label: "Flight Ticket" },
  { key: "medical_file", label: "Medical" },
  { key: "insurance_file", label: "Insurance" },
  { key: "other_file", label: "Other Document" },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function CandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [openId, setOpenId] = useState<number | null>(null);

  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [editRateLoading, setEditRateLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editDocumentFile, setEditDocumentFile] = useState<File | null>(null);

  const [documentsCandidate, setDocumentsCandidate] =
    useState<Candidate | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    void fetchCandidates();
  }, []);

  async function fetchCandidates() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("job_candidates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setCandidates([]);
      setErrorMessage(error.message || "Unable to load candidates.");
    } else {
      setCandidates((data || []) as Candidate[]);
    }

    setLoading(false);
  }

  const countries = useMemo(
    () =>
      Array.from(
        new Set(
          candidates
            .map((candidate) => candidate.country)
            .filter(Boolean) as string[]
        )
      ).sort(),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const text = search.toLowerCase().trim();

    return candidates.filter((candidate) => {
      const matchesSearch =
        !text ||
        candidate.full_name?.toLowerCase().includes(text) ||
        candidate.mobile?.toLowerCase().includes(text) ||
        candidate.job_position?.toLowerCase().includes(text) ||
        candidate.employer_name?.toLowerCase().includes(text) ||
        candidate.passport_number?.toLowerCase().includes(text);

      const matchesStatus =
        statusFilter === "All Status" || candidate.status === statusFilter;

      const matchesCountry =
        countryFilter === "All Countries" ||
        candidate.country === countryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    });
  }, [candidates, search, statusFilter, countryFilter]);

  const stats = {
    total: candidates.length,
    newLead: candidates.filter((c) => c.status === "New Lead").length,
    visaProcessing: candidates.filter(
      (c) => c.status === "Visa Processing"
    ).length,
    travelled: candidates.filter((c) => c.status === "Travelled").length,
  };

  function formatDate(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatMoney(value: number | null, currency = "INR") {
    if (value === null || value === undefined) return "—";

    return `${currency} ${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  function serviceFee(candidate: Candidate) {
    return candidate.registration_fee ?? 0;
  }

  function totalServiceFee(candidate: Candidate) {
    return candidate.total_amount ?? serviceFee(candidate);
  }

  function balance(candidate: Candidate) {
    return Math.max(
      0,
      totalServiceFee(candidate) - (candidate.amount_paid ?? 0)
    );
  }

  useEffect(() => {
    if (!editCandidate) return;

    const currency = editCandidate.payment_currency || "INR";
    if (currency === "INR") {
      setEditCandidate((current) =>
        current
          ? {
              ...current,
              exchange_rate_to_inr: 1,
              service_fee_inr: Number(current.registration_fee ?? 0),
              total_amount_inr: Number(current.registration_fee ?? 0),
            }
          : current
      );
      return;
    }

    let cancelled = false;

    async function loadEditRate() {
      setEditRateLoading(true);
      try {
        const response = await fetch(
          `/api/exchange-rate?from=${encodeURIComponent(currency)}&to=INR`
        );
        const data = await response.json();
        const rate = Number(data?.rate);

        if (!cancelled && response.ok && Number.isFinite(rate) && rate > 0) {
          setEditCandidate((current) => {
            if (!current) return current;
            const fee = Number(current.registration_fee ?? 0);
            return {
              ...current,
              exchange_rate_to_inr: rate,
              service_fee_inr: fee * rate,
              total_amount_inr: fee * rate,
            };
          });
        }
      } catch {
        // Keep the last saved conversion if the rate service is unavailable.
      } finally {
        if (!cancelled) setEditRateLoading(false);
      }
    }

    void loadEditRate();

    return () => {
      cancelled = true;
    };
  }, [editCandidate?.id, editCandidate?.payment_currency]);

  function openEdit(candidate: Candidate) {
    setEditError("");
    setEditDocumentFile(null);
    setEditCandidate({ ...candidate });
  }

  function closeEdit() {
    if (editSaving) return;
    setEditCandidate(null);
    setEditDocumentFile(null);
    setEditError("");
  }

  function handleEditDocument(event: ChangeEvent<HTMLInputElement>) {
    setEditError("");

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setEditError("Candidate Documents must be a PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setEditError("Candidate Documents PDF must be 20 MB or smaller.");
      event.target.value = "";
      return;
    }

    setEditDocumentFile(file);
  }

  async function saveEdit() {
    if (!editCandidate) return;

    setEditError("");

    if (!editCandidate.full_name.trim()) {
      setEditError("Candidate name is required.");
      return;
    }

    if (!editCandidate.mobile?.trim()) {
      setEditError("Mobile number is required.");
      return;
    }

    if (!editCandidate.country?.trim()) {
      setEditError("Country is required.");
      return;
    }

    if (!editCandidate.job_position?.trim()) {
      setEditError("Job position is required.");
      return;
    }

    if (
      editCandidate.going_date &&
      editCandidate.return_date &&
      editCandidate.return_date < editCandidate.going_date
    ) {
      setEditError("Return date cannot be before going date.");
      return;
    }

    setEditSaving(true);

    let uploadedNewPath: string | null = null;
    const existingDocument = editCandidate.other_file
      ? getStoragePath(editCandidate.other_file)
      : null;

    const fee = Number(editCandidate.registration_fee ?? 0);
    const paid = Number(editCandidate.amount_paid ?? 0);
    const total = Math.max(0, Number.isFinite(fee) ? fee : 0);
    const safePaid = Math.max(0, Number.isFinite(paid) ? paid : 0);

    try {
      if (editDocumentFile) {
        const safeName = editDocumentFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

        uploadedNewPath = `${editCandidate.id}/documents-${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("candidate-documents")
          .upload(uploadedNewPath, editDocumentFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: "application/pdf",
          });

        if (uploadError) {
          throw new Error(`Document upload failed: ${uploadError.message}`);
        }
      }

      const { data, error } = await supabase
        .from("job_candidates")
        .update({
        full_name: editCandidate.full_name.trim(),
        father_name: editCandidate.father_name || null,
        mobile: editCandidate.mobile || null,
        whatsapp: editCandidate.whatsapp || null,
        email: editCandidate.email || null,
        address: editCandidate.address || null,
        city: editCandidate.city || null,
        state: editCandidate.state || null,
        date_of_birth: editCandidate.date_of_birth || null,

        passport_number: editCandidate.passport_number || null,
        passport_expiry: editCandidate.passport_expiry || null,

        country: editCandidate.country || null,
        job_position: editCandidate.job_position || null,
        employer_name: editCandidate.employer_name || null,
        salary: editCandidate.salary,
        salary_currency: editCandidate.salary_currency || null,
        contract_duration: editCandidate.contract_duration || null,
        job_location: editCandidate.job_location || null,
        joining_date: editCandidate.joining_date || null,
        status: editCandidate.status || "New Lead",

        visa_type: editCandidate.visa_type || null,
        visa_number: editCandidate.visa_number || null,
        visa_valid_till: editCandidate.visa_valid_till || null,
        going_date: editCandidate.going_date || null,
        return_date: editCandidate.return_date || null,
        flight_number: editCandidate.flight_number || null,
        departure_airport: editCandidate.departure_airport || null,
        arrival_airport: editCandidate.arrival_airport || null,

        registration_fee: total,
        visa_fee: null,
        ticket_amount: null,
        other_charges: null,
        total_amount: total,
        amount_paid: safePaid,
        balance_amount: Math.max(0, total - safePaid),
        payment_currency: editCandidate.payment_currency || "USD",
        last_payment_date: editCandidate.last_payment_date || null,
        payment_method: editCandidate.payment_method || null,

        exchange_rate_to_inr: editCandidate.exchange_rate_to_inr,
        service_fee_inr: editCandidate.service_fee_inr,
        total_amount_inr: editCandidate.total_amount_inr,
        other_file: uploadedNewPath || editCandidate.other_file || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editCandidate.id)
      .select("*")
      .single();

      if (error || !data) {
        if (uploadedNewPath) {
          await supabase.storage
            .from("candidate-documents")
            .remove([uploadedNewPath]);
        }

        throw new Error(error?.message || "Unable to update candidate.");
      }

      if (uploadedNewPath && existingDocument) {
        await supabase.storage
          .from("candidate-documents")
          .remove([existingDocument]);
      }

      setCandidates((current) =>
        current.map((candidate) =>
          candidate.id === editCandidate.id ? (data as Candidate) : candidate
        )
      );

      setOpenId(editCandidate.id);
      setEditDocumentFile(null);
      setEditSaving(false);
      closeEdit();
    } catch (saveError) {
      if (uploadedNewPath) {
        await supabase.storage
          .from("candidate-documents")
          .remove([uploadedNewPath]);
      }

      setEditError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update candidate."
      );
      setEditSaving(false);
    }
  }

  async function openDocument(filePath: string | null, title: string) {
    if (!filePath) {
      window.alert(`${title} is not uploaded.`);
      return;
    }

    const storagePath = getStoragePath(filePath);

    const { data, error } = await supabase.storage
      .from("candidate-documents")
      .createSignedUrl(storagePath, 60 * 10);

    if (error || !data?.signedUrl) {
      window.alert(error?.message || "Unable to open document.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  function getStoragePath(value: string) {
    const marker =
      "/storage/v1/object/public/candidate-documents/";

    if (value.includes(marker)) {
      return decodeURIComponent(value.split(marker)[1]);
    }

    return value;
  }

  async function deleteCandidate(candidate: Candidate) {
    const confirmed = window.confirm(
      `Delete candidate "${candidate.full_name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(candidate.id);

    const files = documentFields
      .map((field) => candidate[field.key])
      .filter((file): file is string => typeof file === "string" && Boolean(file))
      .map(getStoragePath);

    if (files.length) {
      await supabase.storage.from("candidate-documents").remove(files);
    }

    const { error } = await supabase
      .from("job_candidates")
      .delete()
      .eq("id", candidate.id);

    if (error) {
      window.alert(error.message);
      setDeletingId(null);
      return;
    }

    setCandidates((current) =>
      current.filter((item) => item.id !== candidate.id)
    );

    if (openId === candidate.id) setOpenId(null);
    if (editCandidate?.id === candidate.id) setEditCandidate(null);

    setDeletingId(null);
  }

  function printCandidate(candidate: Candidate) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Job Candidate Record", 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("World Global Manpower Pvt. Ltd.", 20, 27);

    doc.setTextColor(0);

    const rows = [
      ["Name", candidate.full_name],
      ["Father Name", candidate.father_name || "—"],
      ["Mobile", candidate.mobile || "—"],
      ["Country", candidate.country || "—"],
      ["Job Position", candidate.job_position || "—"],
      ["Employer", candidate.employer_name || "—"],
      ["Salary", formatMoney(candidate.salary, candidate.salary_currency || "RUB")],
      ["Status", candidate.status || "—"],
      ["Passport", candidate.passport_number || "—"],
      ["Visa", candidate.visa_number || "—"],
      ["Visa Valid Till", formatDate(candidate.visa_valid_till)],
      ["Going Date", formatDate(candidate.going_date)],
      ["Return Date", formatDate(candidate.return_date)],
      [
        "Service Fee",
        formatMoney(candidate.registration_fee, candidate.payment_currency || "USD"),
      ],
      [
        "Amount Paid",
        formatMoney(candidate.amount_paid, candidate.payment_currency || "USD"),
      ],
      [
        "Balance",
        formatMoney(balance(candidate), candidate.payment_currency || "USD"),
      ],
    ];

    let y = 42;

    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 70, y);
      y += 8;

      if (y > 275) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(
      `${candidate.full_name.replace(/\s+/g, "-")}-candidate.pdf`
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 sm:h-11 sm:w-11">
              <BriefcaseBusiness size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Recruitment
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Job Candidates
              </h1>
              <p className="text-xs text-slate-500">
                Simple candidate management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/candidates/add")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 sm:w-auto sm:py-2.5"
          >
            <Plus size={17} />
            Add Candidate
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard title="Total Candidates" value={stats.total} icon={<UserRound size={19} />} />
          <StatCard title="New Leads" value={stats.newLead} icon={<UserRound size={19} />} />
          <StatCard title="Visa Processing" value={stats.visaProcessing} icon={<FileText size={19} />} />
          <StatCard title="Travelled" value={stats.travelled} icon={<Plane size={19} />} />
        </div>

        {errorMessage && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">Unable to load candidates</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchCandidates()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white"
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_170px_auto] lg:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, mobile, job, employer or passport..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <select
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 lg:w-auto"
            >
              <option>All Countries</option>
              {countries.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 lg:w-auto"
            >
              <option>All Status</option>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void fetchCandidates()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 lg:w-auto"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="font-bold text-slate-900">Candidates</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Click a candidate to see the complete recruitment record.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500">
              <Loader2 size={20} className="mr-2 animate-spin" />
              Loading candidates...
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <UserRound size={25} />
              </div>
              <h3 className="mt-4 font-bold">No candidates found</h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {search || statusFilter !== "All Status" || countryFilter !== "All Countries"
                  ? "Try changing your search or filters."
                  : "Add your first candidate to start recruitment tracking."}
              </p>
              {!search && statusFilter === "All Status" && countryFilter === "All Countries" && (
                <button
                  type="button"
                  onClick={() => router.push("/candidates/add")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"
                >
                  <Plus size={16} />
                  Add Candidate
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCandidates.map((candidate) => {
                const isOpen = openId === candidate.id;
                const documentCount = documentFields.filter(
                  (field) => Boolean(candidate[field.key])
                ).length;

                return (
                  <div key={candidate.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenId(isOpen ? null : candidate.id)
                      }
                      className="w-full px-3.5 py-4 text-left transition hover:bg-slate-50 sm:px-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                          {candidate.full_name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-bold text-slate-900">
                              {candidate.full_name}
                            </h3>
                            <StatusBadge status={candidate.status || "New Lead"} />
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                            <span>{candidate.country || "Country not set"}</span>
                            <span>•</span>
                            <span>{candidate.job_position || "Job not selected"}</span>
                            <span>•</span>
                            <span>{candidate.mobile || "No mobile"}</span>
                          </div>
                        </div>

                        <div className="hidden text-right sm:block">
                          <p className="text-xs text-slate-400">Documents</p>
                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {documentCount} / {documentFields.length}
                          </p>
                        </div>

                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-5 sm:px-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                          <InfoCard
                            title="Personal"
                            icon={<UserRound size={17} />}
                            items={[
                              ["Father Name", candidate.father_name],
                              ["Mobile", candidate.mobile],
                              ["WhatsApp", candidate.whatsapp],
                              ["Email", candidate.email],
                              ["City", candidate.city],
                              ["State", candidate.state],
                            ]}
                          />

                          <InfoCard
                            title="Job"
                            icon={<BriefcaseBusiness size={17} />}
                            items={[
                              ["Country", candidate.country],
                              ["Position", candidate.job_position],
                              ["Employer", candidate.employer_name],
                              ["Location", candidate.job_location],
                              [
                                "Salary",
                                candidate.salary
                                  ? formatMoney(
                                      candidate.salary,
                                      candidate.salary_currency || "RUB"
                                    )
                                  : "—",
                              ],
                              ["Contract", candidate.contract_duration],
                              ["Joining", formatDate(candidate.joining_date)],
                            ]}
                          />

                          <InfoCard
                            title="Passport & Visa"
                            icon={<FileText size={17} />}
                            items={[
                              ["Passport", candidate.passport_number],
                              ["Passport Expiry", formatDate(candidate.passport_expiry)],
                              ["Visa Type", candidate.visa_type],
                              ["Visa Number", candidate.visa_number],
                              ["Visa Valid Till", formatDate(candidate.visa_valid_till)],
                            ]}
                          />

                          <InfoCard
                            title="Travel"
                            icon={<Plane size={17} />}
                            items={[
                              ["Going Date", formatDate(candidate.going_date)],
                              ["Return Date", formatDate(candidate.return_date)],
                              ["Flight", candidate.flight_number],
                              ["Departure", candidate.departure_airport],
                              ["Arrival", candidate.arrival_airport],
                            ]}
                          />

                          <InfoCard
                            title="Payment"
                            icon={<Wallet size={17} />}
                            items={[
                              [
                                "Service Fee",
                                formatMoney(
                                  serviceFee(candidate),
                                  candidate.payment_currency || "USD"
                                ),
                              ],
                              [
                                "Paid",
                                formatMoney(
                                  candidate.amount_paid,
                                  candidate.payment_currency || "USD"
                                ),
                              ],
                              [
                                "Balance",
                                formatMoney(
                                  balance(candidate),
                                  candidate.payment_currency || "USD"
                                ),
                              ],
                              ["Last Payment", formatDate(candidate.last_payment_date)],
                              ["Method", candidate.payment_method],
                            ]}
                          />

                          <InfoCard
                            title="Contact"
                            icon={<Mail size={17} />}
                            items={[
                              ["Email", candidate.email],
                              ["Mobile", candidate.mobile],
                              ["Address", candidate.address],
                              ["City", candidate.city],
                              ["State", candidate.state],
                            ]}
                          />
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Documents
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {documentCount} of {documentFields.length} uploaded
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                              <button
                                type="button"
                                onClick={() => setDocumentsCandidate(candidate)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:w-auto sm:px-3.5"
                              >
                                <FileText size={15} />
                                View Documents
                              </button>

                              <button
                                type="button"
                                onClick={() => openEdit(candidate)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 sm:w-auto sm:px-3.5"
                              >
                                <Pencil size={15} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => printCandidate(candidate)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:w-auto sm:px-3.5"
                              >
                                <Printer size={15} />
                                Print
                              </button>

                              <button
                                type="button"
                                disabled={deletingId === candidate.id}
                                onClick={() => void deleteCandidate(candidate)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 sm:w-auto sm:px-3.5"
                              >
                                {deletingId === candidate.id ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {documentsCandidate && (
        <ModalOverlay onClose={() => setDocumentsCandidate(null)}>
          <div className="mx-auto max-h-[100dvh] w-full max-w-2xl overflow-y-auto rounded-none bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Documents
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  {documentsCandidate.full_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDocumentsCandidate(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
              {documentFields.map((field) => {
                const file = documentsCandidate[field.key] as string | null;

                return (
                  <button
                    key={String(field.key)}
                    type="button"
                    disabled={!file}
                    onClick={() => void openDocument(file, field.label)}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {field.label}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {file ? "Uploaded" : "Not uploaded"}
                        </p>
                      </div>
                    </div>
                    {file && (
                      <span className="text-xs font-bold text-indigo-600">
                        Open
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </ModalOverlay>
      )}

      {editCandidate && (
        <ModalOverlay onClose={closeEdit}>
          <div className="mx-auto flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:max-h-[94vh] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Edit Candidate
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  {editCandidate.full_name}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={editSaving}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
              {editError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {editError}
                </div>
              )}

              <div className="grid gap-5 lg:grid-cols-2">
                <EditSection title="Personal Information" icon={<UserRound size={17} />}>
                  <EditInput label="Full Name" value={editCandidate.full_name} onChange={(value) => setEditCandidate({ ...editCandidate, full_name: value })} />
                  <EditInput label="Father Name" value={editCandidate.father_name || ""} onChange={(value) => setEditCandidate({ ...editCandidate, father_name: value })} />
                  <EditInput label="Mobile" value={editCandidate.mobile || ""} onChange={(value) => setEditCandidate({ ...editCandidate, mobile: value })} />
                  <EditInput label="WhatsApp" value={editCandidate.whatsapp || ""} onChange={(value) => setEditCandidate({ ...editCandidate, whatsapp: value })} />
                  <EditInput label="Email" value={editCandidate.email || ""} onChange={(value) => setEditCandidate({ ...editCandidate, email: value })} />
                  <EditInput label="City" value={editCandidate.city || ""} onChange={(value) => setEditCandidate({ ...editCandidate, city: value })} />
                  <EditInput label="State" value={editCandidate.state || ""} onChange={(value) => setEditCandidate({ ...editCandidate, state: value })} />
                </EditSection>

                <EditSection title="Job Information" icon={<BriefcaseBusiness size={17} />}>
                  <EditInput label="Country" value={editCandidate.country || ""} onChange={(value) => setEditCandidate({ ...editCandidate, country: value })} />
                  <EditInput label="Job Position" value={editCandidate.job_position || ""} onChange={(value) => setEditCandidate({ ...editCandidate, job_position: value })} />
                  <EditInput label="Employer" value={editCandidate.employer_name || ""} onChange={(value) => setEditCandidate({ ...editCandidate, employer_name: value })} />
                  <EditInput label="Job Location" value={editCandidate.job_location || ""} onChange={(value) => setEditCandidate({ ...editCandidate, job_location: value })} />
                  <EditInput label="Salary" type="number" value={editCandidate.salary?.toString() || ""} onChange={(value) => setEditCandidate({ ...editCandidate, salary: value ? Number(value) : null })} />
                  <EditInput label="Contract Duration" value={editCandidate.contract_duration || ""} onChange={(value) => setEditCandidate({ ...editCandidate, contract_duration: value })} />
                  <EditSelect label="Status" value={editCandidate.status || "New Lead"} options={statuses} onChange={(value) => setEditCandidate({ ...editCandidate, status: value })} />
                </EditSection>

                <EditSection title="Passport & Visa" icon={<FileText size={17} />}>
                  <EditInput label="Passport Number" value={editCandidate.passport_number || ""} onChange={(value) => setEditCandidate({ ...editCandidate, passport_number: value })} />
                  <EditInput label="Passport Expiry" type="date" value={editCandidate.passport_expiry || ""} onChange={(value) => setEditCandidate({ ...editCandidate, passport_expiry: value })} />
                  <EditInput label="Visa Type" value={editCandidate.visa_type || ""} onChange={(value) => setEditCandidate({ ...editCandidate, visa_type: value })} />
                  <EditInput label="Visa Number" value={editCandidate.visa_number || ""} onChange={(value) => setEditCandidate({ ...editCandidate, visa_number: value })} />
                  <EditInput label="Visa Valid Till" type="date" value={editCandidate.visa_valid_till || ""} onChange={(value) => setEditCandidate({ ...editCandidate, visa_valid_till: value })} />
                </EditSection>

                <EditSection title="Travel" icon={<Plane size={17} />}>
                  <EditInput label="Going Date" type="date" value={editCandidate.going_date || ""} onChange={(value) => setEditCandidate({ ...editCandidate, going_date: value })} />
                  <EditInput label="Return Date" type="date" value={editCandidate.return_date || ""} onChange={(value) => setEditCandidate({ ...editCandidate, return_date: value })} />
                  <EditInput label="Flight Number" value={editCandidate.flight_number || ""} onChange={(value) => setEditCandidate({ ...editCandidate, flight_number: value })} />
                  <EditInput label="Departure Airport" value={editCandidate.departure_airport || ""} onChange={(value) => setEditCandidate({ ...editCandidate, departure_airport: value })} />
                  <EditInput label="Arrival Airport" value={editCandidate.arrival_airport || ""} onChange={(value) => setEditCandidate({ ...editCandidate, arrival_airport: value })} />
                </EditSection>

                <EditSection title="Service Fee & Payment" icon={<Wallet size={17} />}>
                  <EditInput
                    label="Service Fee"
                    type="number"
                    value={editCandidate.registration_fee?.toString() || ""}
                    onChange={(value) => {
                      const fee = value ? Number(value) : 0;
                      const rate = Number(editCandidate.exchange_rate_to_inr ?? 0);
                      setEditCandidate({
                        ...editCandidate,
                        registration_fee: fee,
                        total_amount: fee,
                        service_fee_inr: rate > 0 ? fee * rate : null,
                        total_amount_inr: rate > 0 ? fee * rate : null,
                      });
                    }}
                  />

                  <EditSelect
                    label="Currency"
                    value={editCandidate.payment_currency || "INR"}
                    options={["USD", "EUR", "RUB", "GBP", "AED", "SAR", "CAD", "AUD", "INR"]}
                    onChange={(value) =>
                      setEditCandidate({
                        ...editCandidate,
                        payment_currency: value,
                      })
                    }
                  />

                  <EditInput
                    label="Amount Paid"
                    type="number"
                    value={editCandidate.amount_paid?.toString() || ""}
                    onChange={(value) =>
                      setEditCandidate({
                        ...editCandidate,
                        amount_paid: value ? Number(value) : 0,
                      })
                    }
                  />

                  <EditInput
                    label="Last Payment Date"
                    type="date"
                    value={editCandidate.last_payment_date || ""}
                    onChange={(value) =>
                      setEditCandidate({ ...editCandidate, last_payment_date: value })
                    }
                  />

                  <EditInput
                    label="Payment Method"
                    value={editCandidate.payment_method || ""}
                    onChange={(value) =>
                      setEditCandidate({ ...editCandidate, payment_method: value })
                    }
                  />

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                      Automatic INR Conversion
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {editRateLoading
                        ? "Fetching exchange rate..."
                        : `1 ${editCandidate.payment_currency || "INR"} = ₹ ${Number(editCandidate.exchange_rate_to_inr || 0).toLocaleString("en-IN", { maximumFractionDigits: 4 })}`}
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Service Fee INR
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          ₹ {Number(editCandidate.service_fee_inr || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Paid INR
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          ₹ {(Number(editCandidate.amount_paid || 0) * Number(editCandidate.exchange_rate_to_inr || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Balance INR
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          ₹ {(Math.max(0, Number(editCandidate.registration_fee || 0) - Number(editCandidate.amount_paid || 0)) * Number(editCandidate.exchange_rate_to_inr || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </EditSection>

                <EditSection title="Documents" icon={<FileText size={17} />}>
                  <div className="sm:col-span-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800">
                            {editDocumentFile
                              ? "New document selected"
                              : editCandidate.other_file
                                ? "Current document uploaded"
                                : "No document uploaded"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Keep all candidate documents in one PDF. Maximum 20 MB.
                          </p>
                        </div>

                        <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">
                          <FileText size={15} />
                          {editDocumentFile
                            ? "Choose Different PDF"
                            : editCandidate.other_file
                              ? "Replace Document"
                              : "Upload Document"}
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleEditDocument}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {editDocumentFile && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-emerald-800">
                              {editDocumentFile.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-emerald-700">
                              {(editDocumentFile.size / 1024 / 1024).toFixed(2)} MB • PDF
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditDocumentFile(null)}
                            className="shrink-0 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {editCandidate.other_file && !editDocumentFile && (
                        <button
                          type="button"
                          onClick={() =>
                            void openDocument(editCandidate.other_file, "Candidate Documents")
                          }
                          className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          Open current document
                        </button>
                      )}
                    </div>
                  </div>
                </EditSection>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={closeEdit}
                disabled={editSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={editSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {editSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Update Candidate
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:h-10 sm:w-10">
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let classes = "bg-slate-100 text-slate-600";

  if (
    status === "Visa Processing" ||
    status === "Offer Letter" ||
    status === "Contract Signed"
  ) {
    classes = "bg-amber-50 text-amber-700";
  } else if (
    status === "Visa Approved" ||
    status === "Ticket Booked"
  ) {
    classes = "bg-blue-50 text-blue-700";
  } else if (
    status === "Travelled" ||
    status === "Working in Russia" ||
    status === "Completed"
  ) {
    classes = "bg-emerald-50 text-emerald-700";
  } else if (status === "Rejected") {
    classes = "bg-red-50 text-red-700";
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${classes}`}>
      {status}
    </span>
  );
}

function InfoCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<[string, string | null | undefined]>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>

      <div className="space-y-2">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
          >
            <span className="text-xs text-slate-400">{label}</span>
            <span className="max-w-[60%] break-words text-right text-xs font-semibold text-slate-700">
              {value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function EditInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
    </label>
  );
}

function EditSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-0 w-full sm:my-auto">{children}</div>
    </div>
  );
}
