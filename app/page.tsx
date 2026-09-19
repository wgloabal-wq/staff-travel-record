"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Plane,
  Plus,
  Search,
  FileText,
  CalendarDays,
  MapPin,
  Users,
  Clock3,
  MoreVertical,
  Eye,
  Trash2,
  Printer,
  Loader2,
  X,
  BriefcaseBusiness,
  Mail,
  Globe,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

type TravelRecord = {
  id: number;
  staff_name: string;
  country: string;
  going_date: string;
  coming_date: string | null;
  visa_valid_till: string | null;
  ticket_amount: number | null;
  passport_file: string | null;
  visa_file: string | null;
  ticket_file: string | null;
  other_file: string | null;
  created_at: string;
};

export default function Home() {
  const router = useRouter();

  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [statusFilter, setStatusFilter] = useState("All Records");

  const [actionRecord, setActionRecord] =
    useState<TravelRecord | null>(null);

  const [selectedRecord, setSelectedRecord] =
    useState<TravelRecord | null>(null);

  const [deleting, setDeleting] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError("");

      const { data, error } = await supabase
        .from("travel_records")
        .select("*")
        .order("going_date", { ascending: false });

      if (error) {
        console.error(error);
        setFetchError(error.message || "Unable to load travel records.");
        return;
      }

      setRecords((data as TravelRecord[]) || []);
    } catch (error) {
      console.error(error);
      setFetchError(
        error instanceof Error
          ? error.message
          : "Unable to load travel records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (!actionRecord && !selectedRecord) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActionRecord(null);
        setSelectedRecord(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [actionRecord, selectedRecord]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);

  const totalRecords = records.length;

  const currentlyAbroad = records.filter((record) => {
    if (!record.going_date) return false;

    const going = new Date(record.going_date);
    going.setHours(0, 0, 0, 0);

    if (!record.coming_date) {
      return going <= today;
    }

    const coming = new Date(record.coming_date);
    coming.setHours(0, 0, 0, 0);

    return going <= today && today <= coming;
  }).length;

  const upcomingTrips = records.filter((record) => {
    if (!record.going_date) return false;

    const going = new Date(record.going_date);
    going.setHours(0, 0, 0, 0);

    return going > today;
  }).length;

  const visaExpiringSoon = records.filter((record) => {
    if (!record.visa_valid_till) return false;

    const visaDate = new Date(record.visa_valid_till);
    visaDate.setHours(0, 0, 0, 0);

    return visaDate >= today && visaDate <= in30Days;
  }).length;

  const countries = useMemo(() => {
    return Array.from(
      new Set(records.map((record) => record.country).filter(Boolean))
    ).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        record.staff_name?.toLowerCase().includes(searchText) ||
        record.country?.toLowerCase().includes(searchText);

      const matchesCountry =
        countryFilter === "All Countries" ||
        record.country === countryFilter;

      let matchesStatus = true;

      if (statusFilter === "Upcoming") {
        if (!record.going_date) {
          matchesStatus = false;
        } else {
          const going = new Date(record.going_date);
          going.setHours(0, 0, 0, 0);
          matchesStatus = going > today;
        }
      }

      if (statusFilter === "Currently Abroad") {
        if (!record.going_date) {
          matchesStatus = false;
        } else {
          const going = new Date(record.going_date);
          going.setHours(0, 0, 0, 0);

          if (!record.coming_date) {
            matchesStatus = going <= today;
          } else {
            const coming = new Date(record.coming_date);
            coming.setHours(0, 0, 0, 0);
            matchesStatus = going <= today && today <= coming;
          }
        }
      }

      if (statusFilter === "Returned") {
        if (!record.coming_date) {
          matchesStatus = false;
        } else {
          const coming = new Date(record.coming_date);
          coming.setHours(0, 0, 0, 0);

          matchesStatus = coming < today;
        }
      }

      return matchesSearch && matchesCountry && matchesStatus;
    });
  }, [records, search, countryFilter, statusFilter]);

  function formatDate(date: string | null) {
    if (!date) return "—";

    const d = new Date(date);

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatAmount(amount: number | null) {
    if (amount === null || amount === undefined) return "—";

    return `₹${Number(amount).toLocaleString("en-IN")}`;
  }

  function getStatus(record: TravelRecord) {
    if (!record.going_date) return "Unknown";

    const going = new Date(record.going_date);
    going.setHours(0, 0, 0, 0);

    if (record.coming_date) {
      const coming = new Date(record.coming_date);
      coming.setHours(0, 0, 0, 0);

      if (going <= today && today <= coming) {
        return "Currently Abroad";
      }

      if (coming < today) {
        return "Returned";
      }
    }

    if (going > today) {
      return "Upcoming";
    }

    return "Traveling";
  }

  async function deleteRecord(record: TravelRecord) {
    const confirmDelete = window.confirm(
      `Delete travel record for ${record.staff_name}?`
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      const files = [
        record.passport_file,
        record.visa_file,
        record.ticket_file,
        record.other_file,
      ].filter(Boolean) as string[];

      if (files.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("travel-documents")
          .remove(files);

        if (storageError) {
          console.error(storageError);
          alert(
            "The record could not be fully deleted because one or more documents could not be removed."
          );
          return;
        }
      }

      const { error } = await supabase
        .from("travel_records")
        .delete()
        .eq("id", record.id);

      if (error) {
        alert(error.message || "Unable to delete travel record.");
        return;
      }

      setRecords((prev) =>
        prev.filter((item) => item.id !== record.id)
      );

      setActionRecord(null);
    } finally {
      setDeleting(false);
    }
  }

  function printPDF(record: TravelRecord) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Staff Travel Record", 20, 20);

    doc.setFontSize(11);

    let y = 40;

    const rows = [
      ["Company", "World Global Manpower Pvt. Ltd."],
      ["Staff Name", record.staff_name],
      ["Country", record.country],
      ["Going Date", formatDate(record.going_date)],
      ["Coming Date", formatDate(record.coming_date)],
      ["Visa Valid Till", formatDate(record.visa_valid_till)],
      ["Ticket Amount", formatAmount(record.ticket_amount)],
      ["Status", getStatus(record)],
      [
        "Passport",
        record.passport_file ? "Uploaded" : "Not Uploaded",
      ],
      [
        "Visa",
        record.visa_file ? "Uploaded" : "Not Uploaded",
      ],
      [
        "Ticket",
        record.ticket_file ? "Uploaded" : "Not Uploaded",
      ],
      [
        "Other Document",
        record.other_file ? "Uploaded" : "Not Uploaded",
      ],
    ];

    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20);
      doc.text(`${label}:`, 20, y);

      doc.setFont("helvetica", "normal");
      const wrappedValue = doc.splitTextToSize(String(value), 115);
      doc.text(wrappedValue, 75, y);

      y += Math.max(10, wrappedValue.length * 6 + 4);

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(100);

    doc.text(
      `Generated on ${new Date().toLocaleDateString("en-GB")}`,
      20,
      y
    );

    doc.save(
      `${record.staff_name.replace(/\s+/g, "-")}-travel-record.pdf`
    );
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
      .from("travel-documents")
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      alert("Unable to open document.");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
      {/* Hidden on mobile because AppShell already provides the mobile header. */}
      <header className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Plane size={22} />
            </div>

            <div>
              <h1 className="text-base font-bold sm:text-lg">
                Staff Travel Records
              </h1>

              <p className="text-xs text-slate-500">
                World Global Manpower Pvt. Ltd.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={() => router.push("/candidates")}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex sm:px-4"
            >
              <BriefcaseBusiness size={18} />
              <span>Job Candidates</span>
            </button>

            <button
              onClick={() => router.push("/add")}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white sm:px-4 transition hover:bg-slate-800"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Travel Record</span>
            </button>

          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7">

        {/* HEADING */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Travel Dashboard
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Keep track of staff travel, visas, tickets and documents.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchRecords()}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {fetchError && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{fetchError}</span>
            </div>

            <button
              type="button"
              onClick={() => void fetchRecords()}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 sm:shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Records"
            value={String(totalRecords)}
            icon={<FileText size={21} />}
          />

          <StatCard
            title="Currently Abroad"
            value={String(currentlyAbroad)}
            icon={<MapPin size={21} />}
          />

          <StatCard
            title="Upcoming Trips"
            value={String(upcomingTrips)}
            icon={<CalendarDays size={21} />}
          />

          <StatCard
            title="Visa Expiring Soon"
            value={String(visaExpiringSoon)}
            icon={<Clock3 size={21} />}
          />

        </div>

        {/* SEARCH / FILTER */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3 sm:mt-8 sm:p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative w-full lg:max-w-md">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff or country..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />

            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">

              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none sm:w-auto"
              >
                <option>All Countries</option>

                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none sm:w-auto"
              >
                <option>All Records</option>
                <option>Upcoming</option>
                <option>Currently Abroad</option>
                <option>Returned</option>
              </select>

            </div>
          </div>
        </div>

        {/* RECORDS */}
        <div className="mt-4 overflow-hidden rounded-xl sm:mt-5 border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-4 sm:px-5">

            <div>
              <h3 className="font-semibold">
                Travel Records
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Staff travel information
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
              <Users size={17} />
              {filteredRecords.length} records
            </div>

          </div>

          {loading ? (

            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2
                size={22}
                className="mr-2 animate-spin"
              />
              Loading records...
            </div>

          ) : filteredRecords.length === 0 ? (

            <div className="flex flex-col items-center justify-center py-16 text-center">

              <FileText
                size={38}
                className="mb-3 text-slate-300"
              />

              <h3 className="font-semibold">
                No travel records found
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Add a travel record to see it here.
              </p>

              <button
                onClick={() => router.push("/add")}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add Travel Record
              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px] text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>

                    <th className="px-3 py-3 font-semibold sm:px-5">
                      Staff
                    </th>

                    <th className="px-3 py-3 font-semibold sm:px-5">
                      Country
                    </th>

                    <th className="px-3 py-3 font-semibold sm:px-5">
                      Going
                    </th>

                    <th className="px-3 py-3 font-semibold sm:px-5">
                      Coming
                    </th>

                    <th className="px-3 py-3 font-semibold sm:px-5">
                      Visa Till
                    </th>

                    <th className="px-3 py-3 font-semibold sm:px-5">
                      Ticket
                    </th>

                    <th className="px-3 py-3 font-semibold sm:px-5">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-semibold">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredRecords.map((record) => {

                    const status = getStatus(record);

                    return (
                      <tr
                        key={record.id}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-3 py-4 sm:px-5">

                          <div className="font-semibold">
                            {record.staff_name}
                          </div>

                          <div className="mt-0.5 text-xs text-slate-400">
                            Staff Travel
                          </div>

                        </td>

                        <td className="px-3 py-4 sm:px-5">

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                            {record.country}
                          </span>

                        </td>

                        <td className="px-3 py-4 sm:px-5 text-sm">
                          {formatDate(record.going_date)}
                        </td>

                        <td className="px-3 py-4 sm:px-5 text-sm">
                          {formatDate(record.coming_date)}
                        </td>

                        <td className="px-3 py-4 sm:px-5 text-sm">
                          {formatDate(record.visa_valid_till)}
                        </td>

                        <td className="px-3 py-4 sm:px-5 text-sm font-semibold">
                          {formatAmount(record.ticket_amount)}
                        </td>

                        <td className="px-3 py-4 sm:px-5">
                          <StatusBadge status={status} />
                        </td>

                        <td className="px-3 py-4 sm:px-5 text-right">

                          <button
                            onClick={() => setActionRecord(record)}
                            className="rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            aria-label={`Actions for ${record.staff_name}`}
                          >
                            <MoreVertical size={19} />
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* COMPANY FOOTER */}
        <footer className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-8">

          <div className="grid md:grid-cols-2 lg:grid-cols-4">

            {/* COMPANY */}
            <div className="bg-[#0f7c86] px-5 py-6 sm:px-6 sm:py-7 text-white">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <BriefcaseBusiness size={22} />
              </div>

              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Company
              </p>

              <h3 className="mt-2 text-lg font-bold leading-6">
                World Global Manpower Pvt. Ltd.
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/75">
                Overseas recruitment and manpower services for
                international employment opportunities.
              </p>

            </div>

            {/* ADDRESS */}
            <div className="border-t border-white/10 bg-[#0f7c86] px-5 py-6 sm:px-6 sm:py-7 text-white md:border-l md:border-t-0">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <MapPin size={23} />
              </div>

              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Office Address
              </p>

              <h3 className="mt-2 text-base font-bold leading-6">
                Rohini Sector 7,
                <br />
                New Delhi, India
              </h3>

            </div>

            {/* EMAIL */}
            <div className="border-t border-white/10 bg-[#0f7c86] px-5 py-6 sm:px-6 sm:py-7 text-white lg:border-l lg:border-t-0">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Mail size={23} />
              </div>

              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Email
              </p>

              <a
                href="mailto:hello@wgmanpower.com"
                className="mt-2 block break-all text-base font-bold hover:underline"
              >
                hello@wgmanpower.com
              </a>

            </div>

            {/* WEBSITE */}
            <div className="border-t border-white/10 bg-[#0f7c86] px-5 py-6 sm:px-6 sm:py-7 text-white md:border-l lg:border-t-0">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Globe size={23} />
              </div>

              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Website
              </p>

              <a
                href="https://wgmanpower.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-base font-bold hover:underline"
              >
                wgmanpower.com
              </a>

            </div>

          </div>

          {/* FOOTER BOTTOM */}
          <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:px-6 sm:py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

            <p>
              © {new Date().getFullYear()} World Global Manpower Pvt. Ltd.
              All rights reserved.
            </p>

            <p>
              Staff Travel & Recruitment Management System
            </p>

          </div>

        </footer>

      </div>

      {/* ACTION POPUP */}
      {actionRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="travel-record-actions-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onClick={() => setActionRecord(null)}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >

            <div className="flex items-start justify-between border-b border-slate-100 px-3 py-4 sm:px-5">

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Travel Record
                </p>

                <h2
                  id="travel-record-actions-title"
                  className="mt-1 text-base font-bold text-slate-900 sm:text-lg"
                >
                  {actionRecord.staff_name}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {actionRecord.country}
                </p>

              </div>

              <button
                onClick={() => setActionRecord(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            <div className="space-y-2 p-4">

              {/* VIEW DOCUMENTS */}
              <button
                onClick={() => {
                  setSelectedRecord(actionRecord);
                  setActionRecord(null);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left transition hover:bg-slate-50"
              >

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Eye size={17} />
                </span>

                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    View Documents
                  </span>

                  <span className="block text-xs text-slate-500">
                    Passport, visa, ticket & other documents
                  </span>
                </span>

              </button>

              {/* PDF */}
              <button
                onClick={() => {
                  printPDF(actionRecord);
                  setActionRecord(null);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left transition hover:bg-slate-50"
              >

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Printer size={17} />
                </span>

                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Print / Download PDF
                  </span>

                  <span className="block text-xs text-slate-500">
                    Generate a travel record PDF
                  </span>
                </span>

              </button>

              {/* DELETE */}
              <button
                disabled={deleting}
                onClick={() => {
                  setActionRecord(null);
                  deleteRecord(actionRecord);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-red-100 px-4 py-3.5 text-left text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                  <Trash2 size={17} />
                </span>

                <span>
                  <span className="block text-sm font-semibold">
                    Delete Record
                  </span>

                  <span className="block text-xs text-red-400">
                    Permanently remove this travel record
                  </span>
                </span>

              </button>

            </div>

            <div className="border-t border-slate-100 px-4 py-3">

              <button
                onClick={() => setActionRecord(null)}
                className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* DOCUMENTS MODAL */}
      {selectedRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="travel-documents-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedRecord(null)}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
          >

            <div className="mb-5 flex items-start justify-between">

              <div>

                <h2
                  id="travel-documents-title"
                  className="text-base font-bold sm:text-lg"
                >
                  {selectedRecord.staff_name}
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedRecord.country} • Travel Documents
                </p>

              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

            </div>

            <div className="space-y-2">

              <DocumentButton
                label="Passport"
                uploaded={!!selectedRecord.passport_file}
                onClick={() =>
                  openDocument(
                    selectedRecord.passport_file,
                    "Passport"
                  )
                }
              />

              <DocumentButton
                label="Visa"
                uploaded={!!selectedRecord.visa_file}
                onClick={() =>
                  openDocument(
                    selectedRecord.visa_file,
                    "Visa"
                  )
                }
              />

              <DocumentButton
                label="Ticket"
                uploaded={!!selectedRecord.ticket_file}
                onClick={() =>
                  openDocument(
                    selectedRecord.ticket_file,
                    "Ticket"
                  )
                }
              />

              <DocumentButton
                label="Other Document"
                uploaded={!!selectedRecord.other_file}
                onClick={() =>
                  openDocument(
                    selectedRecord.other_file,
                    "Other Document"
                  )
                }
              />

            </div>

            <button
              onClick={() => printPDF(selectedRecord)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Printer size={17} />
              Print / Download PDF
            </button>

          </div>

        </div>
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
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {value}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>

      </div>

    </div>
  );
}

function StatusBadge({ status }: { status: string }) {

  let className =
    "rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600";

  if (status === "Currently Abroad") {
    className =
      "rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700";
  }

  if (status === "Upcoming") {
    className =
      "rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700";
  }

  if (status === "Returned") {
    className =
      "rounded-full px-3 py-1 text-xs font-medium bg-green-50 text-green-700";
  }

  return <span className={className}>{status}</span>;
}

function DocumentButton({
  label,
  uploaded,
  onClick,
}: {
  label: string;
  uploaded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!uploaded}
      className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >

      <div className="flex items-center gap-3">

        <FileText size={18} className="text-slate-500" />

        <span className="text-sm font-medium">
          {label}
        </span>

      </div>

      <span
        className={`text-xs font-medium ${
          uploaded ? "text-green-600" : "text-slate-400"
        }`}
      >
        {uploaded ? "View" : "Not Uploaded"}
      </span>

    </button>
  );
}