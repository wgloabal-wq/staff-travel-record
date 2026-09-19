"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Users,
  BriefcaseBusiness,
  Plane,
  FileText,
  MoreVertical,
  Eye,
  Pencil,
  Printer,
  Trash2,
  X,
  Loader2,
  Phone,
  RefreshCw,
  Building2,
  MapPin,
  Mail,
  Globe,
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

export default function CandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [countryFilter, setCountryFilter] = useState("All Countries");

  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);

  const [popup, setPopup] = useState<
    "actions" | "details" | "documents" | null
  >(null);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    try {
      setLoading(true);
      setErrorMessage("");

      const result = await supabase
        .from("job_candidates")
        .select("*")
        .order("created_at", { ascending: false });

      if (result.error) {
        setCandidates([]);
        setErrorMessage(
          result.error.message ||
            "Unable to load job candidates."
        );
        return;
      }

      setCandidates((result.data || []) as Candidate[]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load job candidates.";

      setCandidates([]);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  const countries = useMemo(() => {
    const list = candidates
      .map((candidate) => candidate.country)
      .filter(
        (country): country is string =>
          Boolean(country)
      );

    return Array.from(new Set(list)).sort();
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    const text = search.toLowerCase().trim();

    return candidates.filter((candidate) => {
      const matchesSearch =
        !text ||
        candidate.full_name
          ?.toLowerCase()
          .includes(text) ||
        candidate.mobile
          ?.toLowerCase()
          .includes(text) ||
        candidate.job_position
          ?.toLowerCase()
          .includes(text) ||
        candidate.employer_name
          ?.toLowerCase()
          .includes(text) ||
        candidate.passport_number
          ?.toLowerCase()
          .includes(text);

      const matchesStatus =
        statusFilter === "All Status" ||
        candidate.status === statusFilter;

      const matchesCountry =
        countryFilter === "All Countries" ||
        candidate.country === countryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCountry
      );
    });
  }, [
    candidates,
    search,
    statusFilter,
    countryFilter,
  ]);

  const stats = {
    total: candidates.length,

    newLead: candidates.filter(
      (c) => c.status === "New Lead"
    ).length,

    visaProcessing: candidates.filter(
      (c) => c.status === "Visa Processing"
    ).length,

    visaApproved: candidates.filter(
      (c) => c.status === "Visa Approved"
    ).length,

    travelled: candidates.filter(
      (c) => c.status === "Travelled"
    ).length,

    working: candidates.filter(
      (c) => c.status === "Working in Russia"
    ).length,
  };

  function formatDate(date: string | null) {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatMoney(
    amount: number | null,
    currency = "INR"
  ) {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return `${currency} ${Number(amount).toLocaleString(
      "en-IN"
    )}`;
  }

  function openActions(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setPopup("actions");
  }

  function closePopup() {
    setSelectedCandidate(null);
    setPopup(null);
  }

  async function openDocument(
    filePath: string | null,
    title: string
  ) {
    if (!filePath) {
      alert(`${title} document is not uploaded.`);
      return;
    }

    const { data, error } = await supabase.storage
      .from("candidate-documents")
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      alert(
        error?.message ||
          "Unable to open document."
      );
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function deleteCandidate(candidate: Candidate) {
    const confirmed = window.confirm(
      `Delete candidate "${candidate.full_name}"?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const files = [
        candidate.passport_file,
        candidate.photo_file,
        candidate.cv_file,
        candidate.offer_letter_file,
        candidate.contract_file,
        candidate.invitation_file,
        candidate.visa_file,
        candidate.ticket_file,
        candidate.medical_file,
        candidate.insurance_file,
        candidate.other_file,
      ].filter(
        (file): file is string => Boolean(file)
      );

      if (files.length > 0) {
        await supabase.storage
          .from("candidate-documents")
          .remove(files);
      }

      const { error } = await supabase
        .from("job_candidates")
        .delete()
        .eq("id", candidate.id);

      if (error) {
        alert(error.message);
        return;
      }

      setCandidates((prev) =>
        prev.filter(
          (item) => item.id !== candidate.id
        )
      );

      closePopup();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete candidate."
      );
    } finally {
      setDeleting(false);
    }
  }

  function printPDF(candidate: Candidate) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Job Candidate Record", 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      "World Global Manpower Private Limited",
      20,
      27
    );

    doc.setTextColor(0);
    doc.setFontSize(11);

    let y = 42;

    const rows = [
      ["Full Name", candidate.full_name],
      ["Father's Name", candidate.father_name || "—"],
      ["Mobile", candidate.mobile || "—"],
      ["WhatsApp", candidate.whatsapp || "—"],
      ["Email", candidate.email || "—"],
      ["Country", candidate.country || "—"],
      ["Job Position", candidate.job_position || "—"],
      ["Employer", candidate.employer_name || "—"],
      [
        "Salary",
        candidate.salary
          ? formatMoney(
              candidate.salary,
              candidate.salary_currency || "RUB"
            )
          : "—",
      ],
      ["Job Location", candidate.job_location || "—"],
      ["Status", candidate.status || "—"],
      [
        "Passport",
        candidate.passport_number || "—",
      ],
      [
        "Passport Expiry",
        formatDate(candidate.passport_expiry),
      ],
      ["Visa Type", candidate.visa_type || "—"],
      ["Visa Number", candidate.visa_number || "—"],
      [
        "Visa Valid Till",
        formatDate(candidate.visa_valid_till),
      ],
      [
        "Going Date",
        formatDate(candidate.going_date),
      ],
      [
        "Return Date",
        formatDate(candidate.return_date),
      ],
      [
        "Total Amount",
        formatMoney(
          candidate.total_amount,
          candidate.payment_currency || "INR"
        ),
      ],
      [
        "Amount Paid",
        formatMoney(
          candidate.amount_paid,
          candidate.payment_currency || "INR"
        ),
      ],
      [
        "Balance",
        formatMoney(
          candidate.balance_amount,
          candidate.payment_currency || "INR"
        ),
      ],
    ];

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

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Generated on ${new Date().toLocaleDateString(
        "en-GB"
      )}`,
      20,
      285
    );

    doc.save(
      `${candidate.full_name.replace(
        /\s+/g,
        "-"
      )}-candidate.pdf`
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">

            <button
              onClick={() => router.push("/")}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <BriefcaseBusiness size={21} />
            </div>

            <div>
              <h1 className="text-lg font-bold">
                Job Candidates
              </h1>

              <p className="text-xs text-slate-500">
                World Global Manpower Pvt. Ltd.
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              router.push("/candidates/add")
            }
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={18} />
            Add Candidate
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-7">

        {/* TITLE */}
        <div className="mb-7">
          <h2 className="text-2xl font-bold tracking-tight">
            Recruitment Dashboard
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage candidates, jobs, visas, payments and deployments.
          </p>
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="font-semibold text-red-700">
                Unable to load candidates
              </p>

              <p className="mt-1 text-sm text-red-600">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={fetchCandidates}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Retry
            </button>

          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          <StatCard
            title="Total Candidates"
            value={stats.total}
            icon={<Users size={20} />}
          />

          <StatCard
            title="New Leads"
            value={stats.newLead}
            icon={<Users size={20} />}
          />

          <StatCard
            title="Visa Processing"
            value={stats.visaProcessing}
            icon={<FileText size={20} />}
          />

          <StatCard
            title="Visa Approved"
            value={stats.visaApproved}
            icon={<FileText size={20} />}
          />

          <StatCard
            title="Travelled"
            value={stats.travelled}
            icon={<Plane size={20} />}
          />

          <StatCard
            title="Working in Russia"
            value={stats.working}
            icon={<BriefcaseBusiness size={20} />}
          />

        </div>

        {/* FILTERS */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative w-full lg:max-w-lg">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search name, mobile, job, employer or passport..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
              />

            </div>

            <div className="flex flex-col gap-2 sm:flex-row">

              <select
                value={countryFilter}
                onChange={(e) =>
                  setCountryFilter(e.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
              >
                <option>All Countries</option>

                {countries.map((country) => (
                  <option
                    key={country}
                    value={country}
                  >
                    {country}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
              >
                <option>All Status</option>

                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

            </div>

          </div>

        </div>

        {/* TABLE */}
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

            <div>
              <h3 className="font-semibold">
                Candidates
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Recruitment and deployment records
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users size={17} />
              {filteredCandidates.length} candidates
            </div>

          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2
                size={22}
                className="mr-2 animate-spin"
              />
              Loading candidates...
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">

              <FileText
                size={40}
                className="mb-3 text-red-300"
              />

              <h3 className="font-semibold">
                Candidates could not be loaded
              </h3>

              <button
                onClick={fetchCandidates}
                className="mt-4 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                <RefreshCw size={16} />
                Try Again
              </button>

            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">

              <Users
                size={40}
                className="mb-3 text-slate-300"
              />

              <h3 className="font-semibold">
                No candidates found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add a candidate to start recruitment tracking.
              </p>

              <button
                onClick={() =>
                  router.push("/candidates/add")
                }
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add Candidate
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px] text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>

                    <th className="px-5 py-3 font-semibold">
                      Candidate
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Job
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Employer
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Country
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Total
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Balance
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Travel
                    </th>

                    <th className="px-5 py-3 text-right font-semibold">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredCandidates.map((candidate) => (

                    <tr
                      key={candidate.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <div className="font-semibold">
                          {candidate.full_name}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Phone size={12} />
                          {candidate.mobile || "No mobile"}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <div className="text-sm font-medium">
                          {candidate.job_position || "—"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {candidate.job_location || "Location not set"}
                        </div>

                      </td>

                      <td className="px-5 py-4 text-sm">
                        {candidate.employer_name || "—"}
                      </td>

                      <td className="px-5 py-4">

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                          {candidate.country || "—"}
                        </span>

                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            candidate.status ||
                            "New Lead"
                          }
                        />
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold">
                        {formatMoney(
                          candidate.total_amount,
                          candidate.payment_currency ||
                            "INR"
                        )}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`text-sm font-semibold ${
                            Number(
                              candidate.balance_amount || 0
                            ) > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {formatMoney(
                            candidate.balance_amount,
                            candidate.payment_currency ||
                              "INR"
                          )}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-sm">
                        {formatDate(
                          candidate.going_date
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">

                        <button
                          onClick={() =>
                            openActions(candidate)
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <MoreVertical size={19} />
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
          <FileText size={14} />
          Candidate passport, visa, job and payment records are stored securely.
        </div>

        {/* COMPANY INFORMATION */}
        <section className="mt-8 overflow-hidden rounded-2xl shadow-sm">
          <div className="grid bg-[#13838c] text-white md:grid-cols-2 lg:grid-cols-4">
            <CompanyInfo
              icon={<Building2 size={22} />}
              label="COMPANY"
              title="World Global Manpower Pvt. Ltd."
              description="Overseas recruitment and manpower services for international employment opportunities."
            />

            <CompanyInfo
              icon={<MapPin size={22} />}
              label="OFFICE ADDRESS"
              title="Rohini Sector 7, New Delhi, India"
            />

            <CompanyInfo
              icon={<Mail size={22} />}
              label="EMAIL"
              title="hello@wgmanpower.com"
            />

            <CompanyInfo
              icon={<Globe size={22} />}
              label="WEBSITE"
              title="wgmanpower.com"
            />
          </div>

          <div className="flex flex-col gap-3 bg-white px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} World Global Manpower Pvt. Ltd. All rights reserved.
            </p>

            <p>
              Staff Travel &amp; Recruitment Management System
            </p>
          </div>
        </section>

      </div>

      {/* ACTION MODAL */}
      {popup === "actions" &&
        selectedCandidate && (
          <ModalOverlay onClose={closePopup}>

            <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

              <div className="mb-5 flex items-start justify-between">

                <div>
                  <h2 className="text-lg font-bold">
                    {selectedCandidate.full_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCandidate.job_position ||
                      "Job Candidate"}{" "}
                    •{" "}
                    {selectedCandidate.country ||
                      "Country not set"}
                  </p>
                </div>

                <button
                  onClick={closePopup}
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="space-y-2">

                <ActionButton
                  icon={<Eye size={17} />}
                  label="View Candidate Details"
                  onClick={() =>
                    setPopup("details")
                  }
                />

                <ActionButton
                  icon={<FileText size={17} />}
                  label="View Documents"
                  onClick={() =>
                    setPopup("documents")
                  }
                />

                <ActionButton
                  icon={<Pencil size={17} />}
                  label="Edit Candidate"
                  onClick={() =>
                    router.push(
                      `/candidates/${selectedCandidate.id}/edit`
                    )
                  }
                />

                <ActionButton
                  icon={<Printer size={17} />}
                  label="Print / Download PDF"
                  onClick={() => {
                    printPDF(selectedCandidate);
                    closePopup();
                  }}
                />

                <button
                  disabled={deleting}
                  onClick={() =>
                    deleteCandidate(
                      selectedCandidate
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={17} />
                  )}

                  Delete Candidate
                </button>

              </div>

            </div>

          </ModalOverlay>
        )}

      {/* DETAILS MODAL */}
      {popup === "details" &&
        selectedCandidate && (
          <ModalOverlay onClose={closePopup}>

            <div className="mx-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>
                  <h2 className="text-xl font-bold">
                    {selectedCandidate.full_name}
                  </h2>

                  <p className="text-sm text-slate-500">
                    Candidate Details
                  </p>
                </div>

                <button
                  onClick={closePopup}
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">

                <InfoBlock
                  title="Personal"
                  items={[
                    [
                      "Father's Name",
                      selectedCandidate.father_name,
                    ],
                    [
                      "Mobile",
                      selectedCandidate.mobile,
                    ],
                    [
                      "WhatsApp",
                      selectedCandidate.whatsapp,
                    ],
                    [
                      "Email",
                      selectedCandidate.email,
                    ],
                    [
                      "City",
                      selectedCandidate.city,
                    ],
                    [
                      "State",
                      selectedCandidate.state,
                    ],
                  ]}
                />

                <InfoBlock
                  title="Job"
                  items={[
                    [
                      "Country",
                      selectedCandidate.country,
                    ],
                    [
                      "Position",
                      selectedCandidate.job_position,
                    ],
                    [
                      "Employer",
                      selectedCandidate.employer_name,
                    ],
                    [
                      "Location",
                      selectedCandidate.job_location,
                    ],
                    [
                      "Salary",
                      selectedCandidate.salary
                        ? formatMoney(
                            selectedCandidate.salary,
                            selectedCandidate.salary_currency ||
                              "RUB"
                          )
                        : null,
                    ],
                    [
                      "Contract",
                      selectedCandidate.contract_duration,
                    ],
                    [
                      "Status",
                      selectedCandidate.status,
                    ],
                  ]}
                />

                <InfoBlock
                  title="Passport / Visa"
                  items={[
                    [
                      "Passport",
                      selectedCandidate.passport_number,
                    ],
                    [
                      "Passport Expiry",
                      formatDate(
                        selectedCandidate.passport_expiry
                      ),
                    ],
                    [
                      "Visa Type",
                      selectedCandidate.visa_type,
                    ],
                    [
                      "Visa Number",
                      selectedCandidate.visa_number,
                    ],
                    [
                      "Visa Valid Till",
                      formatDate(
                        selectedCandidate.visa_valid_till
                      ),
                    ],
                  ]}
                />

                <InfoBlock
                  title="Travel"
                  items={[
                    [
                      "Going Date",
                      formatDate(
                        selectedCandidate.going_date
                      ),
                    ],
                    [
                      "Return Date",
                      formatDate(
                        selectedCandidate.return_date
                      ),
                    ],
                    [
                      "Flight",
                      selectedCandidate.flight_number,
                    ],
                    [
                      "Departure",
                      selectedCandidate.departure_airport,
                    ],
                    [
                      "Arrival",
                      selectedCandidate.arrival_airport,
                    ],
                  ]}
                />

                <InfoBlock
                  title="Payment"
                  items={[
                    [
                      "Total",
                      formatMoney(
                        selectedCandidate.total_amount,
                        selectedCandidate.payment_currency ||
                          "INR"
                      ),
                    ],
                    [
                      "Paid",
                      formatMoney(
                        selectedCandidate.amount_paid,
                        selectedCandidate.payment_currency ||
                          "INR"
                      ),
                    ],
                    [
                      "Balance",
                      formatMoney(
                        selectedCandidate.balance_amount,
                        selectedCandidate.payment_currency ||
                          "INR"
                      ),
                    ],
                    [
                      "Last Payment",
                      formatDate(
                        selectedCandidate.last_payment_date
                      ),
                    ],
                    [
                      "Method",
                      selectedCandidate.payment_method,
                    ],
                  ]}
                />

                <InfoBlock
                  title="Address"
                  items={[
                    [
                      "Address",
                      selectedCandidate.address,
                    ],
                    [
                      "City",
                      selectedCandidate.city,
                    ],
                    [
                      "State",
                      selectedCandidate.state,
                    ],
                  ]}
                />

              </div>

            </div>

          </ModalOverlay>
        )}

      {/* DOCUMENTS MODAL */}
      {popup === "documents" &&
        selectedCandidate && (
          <ModalOverlay onClose={closePopup}>

            <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">

              <div className="mb-5 flex items-start justify-between">

                <div>
                  <h2 className="text-lg font-bold">
                    Documents
                  </h2>

                  <p className="text-sm text-slate-500">
                    {selectedCandidate.full_name}
                  </p>
                </div>

                <button
                  onClick={closePopup}
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="space-y-2">

                <DocumentButton
                  label="Passport"
                  file={
                    selectedCandidate.passport_file
                  }
                  onClick={() =>
                    openDocument(
                      selectedCandidate.passport_file,
                      "Passport"
                    )
                  }
                />

                <DocumentButton
                  label="Photo"
                  file={
                    selectedCandidate.photo_file
                  }
                  onClick={() =>
                    openDocument(
                      selectedCandidate.photo_file,
                      "Photo"
                    )
                  }
                />

                <DocumentButton
                  label="CV / Resume"
                  file={selectedCandidate.cv_file}
                  onClick={() =>
                    openDocument(
                      selectedCandidate.cv_file,
                      "CV"
                    )
                  }
                />

                <DocumentButton
                  label="Offer Letter"
                  file={
                    selectedCandidate.offer_letter_file
                  }
                  onClick={() =>
                    openDocument(
                      selectedCandidate.offer_letter_file,
                      "Offer Letter"
                    )
                  }
                />

                <DocumentButton
                  label="Employment Contract"
                  file={
                    selectedCandidate.contract_file
                  }
                  onClick={() =>
                    openDocument(
                      selectedCandidate.contract_file,
                      "Contract"
                    )
                  }
                />

                <DocumentButton
                  label="Invitation Letter"
                  file={
                    selectedCandidate.invitation_file
                  }
                  onClick={() =>
                    openDocument(
                      selectedCandidate.invitation_file,
                      "Invitation Letter"
                    )
                  }
                />

                <DocumentButton
                  label="Visa"
                  file={selectedCandidate.visa_file}
                  onClick={() =>
                    openDocument(
                      selectedCandidate.visa_file,
                      "Visa"
                    )
                  }
                />

                <DocumentButton
                  label="Flight Ticket"
                  file={
                    selectedCandidate.ticket_file
                  }
                  onClick={() =>
                    openDocument(
                      selectedCandidate.ticket_file,
                      "Flight Ticket"
                    )
                  }
                />

                <DocumentButton
                  label="Medical"
                  file={
                    selectedCandidate.medical_file
                  }
                  onClick={() =>
                    openDocument(
                      selectedCandidate.medical_file,
                      "Medical"
                    )
                  }
                />

                <DocumentButton
                  label="Insurance"
                  file={
                    selectedCandidate.insurance_file
                  }
                  onClick={() =>
                    openDocument(
                      selectedCandidate.insurance_file,
                      "Insurance"
                    )
                  }
                />

                <DocumentButton
                  label="Other Document"
                  file={
                    selectedCandidate.other_file
                  }
                  onClick={() =>
                    openDocument(
                      selectedCandidate.other_file,
                      "Other Document"
                    )
                  }
                />

              </div>

            </div>

          </ModalOverlay>
        )}

    </main>
  );
}

/* ================= COMPONENTS ================= */

function CompanyInfo({
  icon,
  label,
  title,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-white/15 px-6 py-7 md:border-r lg:border-b-0 last:border-r-0">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>

      <p className="text-xs font-medium tracking-wide text-white/75">
        {label}
      </p>

      <p className="mt-2 text-base font-bold leading-6 text-white">
        {title}
      </p>

      {description && (
        <p className="mt-3 text-sm leading-6 text-white/80">
          {description}
        </p>
      )}
    </div>
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>

      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let className =
    "rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600";

  if (
    status === "Visa Approved" ||
    status === "Ticket Booked"
  ) {
    className =
      "rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700";
  }

  if (
    status === "Visa Processing" ||
    status === "Offer Letter" ||
    status === "Contract Signed"
  ) {
    className =
      "rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700";
  }

  if (
    status === "Travelled" ||
    status === "Working in Russia" ||
    status === "Completed"
  ) {
    className =
      "rounded-full px-3 py-1 text-xs font-medium bg-green-50 text-green-700";
  }

  if (status === "Rejected") {
    className =
      "rounded-full px-3 py-1 text-xs font-medium bg-red-50 text-red-700";
  }

  return (
    <span className={className}>
      {status}
    </span>
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-auto w-full"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {children}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-slate-50"
    >
      {icon}
      {label}
    </button>
  );
}

function DocumentButton({
  label,
  file,
  onClick,
}: {
  label: string;
  file: string | null;
  onClick: () => void;
}) {
  const uploaded = Boolean(file);

  return (
    <button
      onClick={onClick}
      disabled={!uploaded}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex items-center gap-3">

        <FileText
          size={18}
          className="text-slate-500"
        />

        <span className="text-sm font-medium">
          {label}
        </span>

      </div>

      <span
        className={`text-xs font-medium ${
          uploaded
            ? "text-green-600"
            : "text-slate-400"
        }`}
      >
        {uploaded
          ? "View"
          : "Not Uploaded"}
      </span>

    </button>
  );
}

function InfoBlock({
  title,
  items,
}: {
  title: string;
  items: [
    string,
    string | null | undefined
  ][];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <h3 className="mb-3 text-sm font-bold">
        {title}
      </h3>

      <div className="space-y-2">

        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 border-b border-slate-200 pb-2 last:border-0"
          >

            <span className="text-xs text-slate-500">
              {label}
            </span>

            <span className="max-w-[60%] text-right text-xs font-medium text-slate-800">
              {value || "—"}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}