"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Ticket,
  Upload,
  X,
  Search,
  UserRound,
  Plane,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TravelRecord = {
  id: string;
  staff_name: string;
  country: string | null;
  going_date: string | null;
  coming_date: string | null;
  visa_valid_till: string | null;
  ticket_file: string | null;
  return_ticket_file: string | null;
  created_at: string | null;
};

type TravelStatus = "Upcoming" | "Return Pending" | "Returned" | "Pending";

type EmployeeGroup = {
  name: string;
  records: TravelRecord[];
  latest: TravelRecord;
};

type EditForm = {
  id: string;
  staff_name: string;
  country: string;
  going_date: string;
  coming_date: string;
  visa_valid_till: string;
  ticket_file: string | null;
  return_ticket_file: string | null;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dateValue(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string | null) {
  const date = dateValue(value);
  if (!date) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatus(record: TravelRecord): TravelStatus {
  const today = getToday();
  const going = dateValue(record.going_date);
  const coming = dateValue(record.coming_date);

  if (!going) return "Pending";
  if (going > today) return "Upcoming";
  if (!coming || coming >= today) return "Return Pending";

  return "Returned";
}

function getStatusClass(status: TravelStatus) {
  const styles: Record<TravelStatus, string> = {
    Upcoming: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    "Return Pending": "bg-amber-50 text-amber-700 ring-amber-100",
    Returned: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Pending: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return styles[status];
}

function isVisaExpiringSoon(value: string | null) {
  if (!value) return false;

  const today = getToday();
  const expiry = dateValue(value);

  if (!expiry) return false;

  const limit = new Date(today);
  limit.setDate(limit.getDate() + 30);

  return expiry >= today && expiry <= limit;
}

function getLatestRecord(records: TravelRecord[]) {
  return [...records].sort((a, b) => {
    const aDate = dateValue(a.going_date)?.getTime() ?? 0;
    const bDate = dateValue(b.going_date)?.getTime() ?? 0;
    return bDate - aDate;
  })[0];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function StaffTravelRecordsPage() {
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [openEmployee, setOpenEmployee] = useState<string | null>(null);

  const [editRecord, setEditRecord] = useState<EditForm | null>(null);
  const [editGoingFile, setEditGoingFile] = useState<File | null>(null);
  const [editReturnFile, setEditReturnFile] = useState<File | null>(null);
  const [editSameTicket, setEditSameTicket] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  async function loadRecords(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const { data, error: fetchError } = await supabase
        .from("travel_records")
        .select(
          "id, staff_name, country, going_date, coming_date, visa_valid_till, ticket_file, return_ticket_file, created_at"
        )
        .order("going_date", { ascending: false });

      if (fetchError) throw fetchError;

      setRecords((data || []) as TravelRecord[]);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load staff travel records."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  const countries = useMemo(() => {
    const values = records
      .map((record) => record.country?.trim())
      .filter(Boolean) as string[];

    return ["All Countries", ...Array.from(new Set(values)).sort()];
  }, [records]);

  const employees = useMemo<EmployeeGroup[]>(() => {
    const map = new Map<string, TravelRecord[]>();

    records.forEach((record) => {
      const key = record.staff_name.trim().toLowerCase();

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(record);
    });

    return Array.from(map.values())
      .map((employeeRecords) => {
        const sorted = [...employeeRecords].sort(
          (a, b) =>
            (dateValue(b.going_date)?.getTime() ?? 0) -
            (dateValue(a.going_date)?.getTime() ?? 0)
        );

        return {
          name: sorted[0].staff_name,
          records: sorted,
          latest: getLatestRecord(sorted),
        };
      })
      .sort(
        (a, b) =>
          (dateValue(b.latest.going_date)?.getTime() ?? 0) -
          (dateValue(a.latest.going_date)?.getTime() ?? 0)
      );
  }, [records]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !query ||
        employee.name.toLowerCase().includes(query) ||
        employee.records.some((record) =>
          (record.country || "").toLowerCase().includes(query)
        );

      const matchesCountry =
        countryFilter === "All Countries" ||
        employee.records.some((record) => record.country === countryFilter);

      return matchesSearch && matchesCountry;
    });
  }, [employees, search, countryFilter]);

  const stats = useMemo(() => {
    const abroad = employees.filter(
      (employee) => getStatus(employee.latest) === "Return Pending"
    ).length;

    const upcoming = employees.filter(
      (employee) => getStatus(employee.latest) === "Upcoming"
    ).length;

    const visaExpiring = employees.filter((employee) =>
      isVisaExpiringSoon(employee.latest.visa_valid_till)
    ).length;

    return {
      employees: employees.length,
      abroad,
      upcoming,
      visaExpiring,
    };
  }, [employees]);

  function getStoragePath(value: string | null) {
    if (!value) return null;
    const marker = "/storage/v1/object/public/travel-documents/";
    if (value.includes(marker)) {
      return decodeURIComponent(value.split(marker)[1]);
    }
    return value;
  }

  function openEditModal(record: TravelRecord) {
    setEditError("");
    setEditGoingFile(null);
    setEditReturnFile(null);

    const same =
      Boolean(record.ticket_file && record.return_ticket_file) &&
      getStoragePath(record.ticket_file) ===
        getStoragePath(record.return_ticket_file);

    setEditSameTicket(same);

    setEditRecord({
      id: record.id,
      staff_name: record.staff_name,
      country: record.country || "",
      going_date: record.going_date || "",
      coming_date: record.coming_date || "",
      visa_valid_till: record.visa_valid_till || "",
      ticket_file: record.ticket_file,
      return_ticket_file: record.return_ticket_file,
    });
  }

  function closeEditModal() {
    if (editSaving) return;
    setEditRecord(null);
    setEditGoingFile(null);
    setEditReturnFile(null);
    setEditError("");
    setEditSameTicket(false);
  }

  function validateEditPdf(file: File) {
    if (file.type !== "application/pdf") {
      setEditError("Only PDF files are allowed.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setEditError("PDF file size must be 10 MB or less.");
      return false;
    }

    return true;
  }

  function isSupabaseStoragePath(value: string | null) {
    if (!value) return false;

    return value.includes("/storage/v1/object/");
  }

  async function uploadEditPdf(
    file: File,
    recordId: string,
    type: "going" | "return"
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", `travel/${recordId}`);

    const response = await fetch("/api/r2-upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Unable to upload ${type} ticket.`);
    }

    return { path: result.key as string };
  }

  async function removeEditFiles(values: Array<string | null>) {
    const uniqueValues = Array.from(
      new Set(values.filter(Boolean) as string[])
    );

    if (!uniqueValues.length) return;

    const supabasePaths = uniqueValues
      .filter(isSupabaseStoragePath)
      .map(getStoragePath)
      .filter(Boolean) as string[];

    const r2Keys = uniqueValues.filter(
      (value) => !isSupabaseStoragePath(value)
    );

    if (supabasePaths.length) {
      const { error } = await supabase.storage
        .from("travel-documents")
        .remove(supabasePaths);

      if (error) {
        console.warn("Old Supabase ticket cleanup failed:", error.message);
      }
    }

    if (r2Keys.length) {
      const response = await fetch("/api/r2-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keys: r2Keys }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.warn(
          "R2 ticket cleanup failed:",
          result.message || "Unable to delete R2 files."
        );
      }
    }
  }

  async function openTicket(path: string | null) {
    if (!path) return;

    if (isSupabaseStoragePath(path)) {
      const storagePath = getStoragePath(path);

      if (!storagePath) return;

      const { data, error: signedUrlError } = await supabase.storage
        .from("travel-documents")
        .createSignedUrl(storagePath, 60 * 10);

      if (signedUrlError) {
        setError(signedUrlError.message);
        return;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      }

      return;
    }

    try {
      const response = await fetch("/api/r2-signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: path }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.signedUrl) {
        throw new Error(result.message || "Unable to open ticket PDF.");
      }

      window.open(result.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to open ticket PDF."
      );
    }
  }

  async function saveEdit() {
    if (!editRecord) return;

    setEditError("");

    if (!editRecord.staff_name.trim()) {
      setEditError("Please enter staff name.");
      return;
    }

    if (!editRecord.country.trim()) {
      setEditError("Please enter country.");
      return;
    }

    if (!editRecord.going_date) {
      setEditError("Please select going date.");
      return;
    }

    if (editRecord.coming_date && editRecord.going_date > editRecord.coming_date) {
      setEditError("Return date cannot be before going date.");
      return;
    }

    if (!editRecord.visa_valid_till) {
      setEditError("Please select visa valid till date.");
      return;
    }

    if (editSameTicket && editReturnFile) {
      setEditError("Remove the separate return PDF when Same PDF is selected.");
      return;
    }

    if (editSameTicket && !editGoingFile && !editRecord.ticket_file) {
      setEditError("Upload a Going Ticket first.");
      return;
    }

    setEditSaving(true);
    const newPaths: string[] = [];

    try {
      let goingUrl = editRecord.ticket_file;
      let returnUrl = editRecord.return_ticket_file;

      if (editGoingFile) {
        const uploaded = await uploadEditPdf(
          editGoingFile,
          editRecord.id,
          "going"
        );
        goingUrl = uploaded.path;
        newPaths.push(uploaded.path);
      }

      if (editSameTicket) {
        returnUrl = goingUrl;
      } else if (editReturnFile) {
        const uploaded = await uploadEditPdf(
          editReturnFile,
          editRecord.id,
          "return"
        );
        returnUrl = uploaded.path;
        newPaths.push(uploaded.path);
      }

      const { error: updateError } = await supabase
        .from("travel_records")
        .update({
          staff_name: editRecord.staff_name.trim(),
          country: editRecord.country.trim(),
          going_date: editRecord.going_date || null,
          coming_date: editRecord.coming_date || null,
          visa_valid_till: editRecord.visa_valid_till || null,
          ticket_file: goingUrl,
          return_ticket_file: returnUrl,
        })
        .eq("id", editRecord.id);

      if (updateError) {
        await removeEditFiles(newPaths);
        throw new Error(updateError.message);
      }

      const oldFiles: string[] = [];

      if (
        editGoingFile &&
        editRecord.ticket_file &&
        getStoragePath(editRecord.ticket_file) !== getStoragePath(goingUrl)
      ) {
        oldFiles.push(editRecord.ticket_file);
      }

      if (
        (editSameTicket || editReturnFile) &&
        editRecord.return_ticket_file &&
        getStoragePath(editRecord.return_ticket_file) !==
          getStoragePath(returnUrl)
      ) {
        oldFiles.push(editRecord.return_ticket_file);
      }

      await removeEditFiles(oldFiles);

      setRecords((current) =>
        current.map((record) =>
          record.id === editRecord.id
            ? {
                ...record,
                staff_name: editRecord.staff_name.trim(),
                country: editRecord.country.trim(),
                going_date: editRecord.going_date || null,
                coming_date: editRecord.coming_date || null,
                visa_valid_till: editRecord.visa_valid_till || null,
                ticket_file: goingUrl,
                return_ticket_file: returnUrl,
              }
            : record
        )
      );

      closeEditModal();
    } catch (err: unknown) {
      setEditError(
        err instanceof Error ? err.message : "Unable to update travel record."
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteTravelRecord(record: TravelRecord) {
    const confirmed = window.confirm(
      `Delete this travel record for ${record.staff_name}?\\n\\nThis will permanently remove the travel record and its uploaded ticket PDFs.`
    );

    if (!confirmed) return;

    setDeletingRecordId(record.id);
    setError("");

    try {
      const storagePaths = Array.from(
        new Set(
          [record.ticket_file, record.return_ticket_file]
            .map(getStoragePath)
            .filter(Boolean) as string[]
        )
      );

      const { error: deleteError } = await supabase
        .from("travel_records")
        .delete()
        .eq("id", record.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      if (storagePaths.length) {
        const supabasePaths = storagePaths
          .filter(isSupabaseStoragePath)
          .map(getStoragePath)
          .filter(Boolean) as string[];

        const r2Keys = storagePaths.filter(
          (value) => !isSupabaseStoragePath(value)
        );

        if (supabasePaths.length) {
          const { error: storageError } = await supabase.storage
            .from("travel-documents")
            .remove(supabasePaths);

          if (storageError) {
            console.warn(
              "Travel record deleted, but old Supabase ticket cleanup failed:",
              storageError.message
            );
          }
        }

        if (r2Keys.length) {
          const response = await fetch("/api/r2-delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ keys: r2Keys }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            console.warn(
              "Travel record deleted, but R2 ticket cleanup failed:",
              result.message || "Unable to delete R2 files."
            );
          }
        }
      }

      setRecords((current) =>
        current.filter((item) => item.id !== record.id)
      );
    } catch (err: unknown) {
      console.error("DELETE TRAVEL RECORD FAILED:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete travel record."
      );
    } finally {
      setDeletingRecordId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setCountryFilter("All Countries");
  }

  const hasFilters =
    search.trim() !== "" || countryFilter !== "All Countries";

  return (
    <main className="min-h-screen min-h-[100dvh] overflow-x-hidden bg-[#f5f7fb]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Staff Travel
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 sm:flex">
                  <Plane size={23} />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl lg:text-3xl">
                    Staff Travel Records
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500">
                    Click an employee to see all of their travel history.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/staff/add"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 sm:w-auto"
            >
              <Plus size={18} />
              Add Travel
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-0.5 break-words">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <StatCard
            label="Total Employees"
            value={loading ? "—" : stats.employees}
            icon={<UserRound size={20} />}
            tone="indigo"
          />
          <StatCard
            label="Currently Abroad"
            value={loading ? "—" : stats.abroad}
            icon={<Plane size={20} />}
            tone="amber"
          />
          <StatCard
            label="Upcoming Travel"
            value={loading ? "—" : stats.upcoming}
            icon={<CalendarDays size={20} />}
            tone="emerald"
          />
          <StatCard
            label="Visa Expiring Soon"
            value={loading ? "—" : stats.visaExpiring}
            icon={<AlertTriangle size={20} />}
            tone="rose"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee name or country..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <select
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white md:w-auto md:min-w-[190px]"
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 md:w-auto"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => void loadRecords(true)}
              disabled={refreshing}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 md:w-auto"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-bold text-slate-900">Employees</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredEmployees.length} employee
              {filteredEmployees.length === 1 ? "" : "s"} found
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Plane size={24} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                {hasFilters ? "No matching employees" : "No travel records yet"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {hasFilters
                  ? "Try changing your search or country filter."
                  : "Add the first travel record to start tracking employee trips."}
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  href="/staff/add"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus size={16} />
                  Add Travel
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEmployees.map((employee) => {
                const employeeKey = employee.name.toLowerCase();
                const isOpen = openEmployee === employeeKey;
                const latestStatus = getStatus(employee.latest);

                return (
                  <div key={employeeKey}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenEmployee(isOpen ? null : employeeKey)
                      }
                      className="w-full px-3.5 py-4 text-left transition hover:bg-slate-50 sm:px-6 sm:py-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                          {getInitials(employee.name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                              {employee.name}
                            </h3>
                            <span
                              className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${getStatusClass(
                                latestStatus
                              )}`}
                            >
                              {latestStatus}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>
                              {employee.latest.country ||
                                "Country not specified"}
                            </span>
                            <span>•</span>
                            <span>
                              {employee.records.length} travel{" "}
                              {employee.records.length === 1
                                ? "trip"
                                : "trips"}
                            </span>
                            {isVisaExpiringSoon(
                              employee.latest.visa_valid_till
                            ) && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-amber-600">
                                  Visa expiring soon
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <ChevronDown
                          size={20}
                          className={`shrink-0 text-slate-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Travel History
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Going and return dates can each have their own
                              ticket PDF.
                            </p>
                          </div>

                          <Link
                            href={`/staff/add?staff_name=${encodeURIComponent(
                              employee.name
                            )}`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
                          >
                            <Plus size={15} />
                            Add Trip
                          </Link>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[1080px] text-left">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  <th className="px-4 py-3">Trip</th>
                                  <th className="px-4 py-3">Country</th>
                                  <th className="px-4 py-3">Going</th>
                                  <th className="px-4 py-3">Return</th>
                                  <th className="px-4 py-3">Visa</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-4 py-3 text-right">
                                    Action
                                  </th>
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-slate-100">
                                {employee.records.map((record, index) => {
                                  const status = getStatus(record);
                                  const hasGoingTicket =
                                    Boolean(record.ticket_file);
                                  const hasReturnTicket =
                                    Boolean(record.return_ticket_file);

                                  return (
                                    <tr
                                      key={record.id}
                                      className="transition hover:bg-slate-50"
                                    >
                                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                        Trip {employee.records.length - index}
                                      </td>

                                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                        {record.country || "—"}
                                      </td>

                                      <td className="px-4 py-4">
                                        {hasGoingTicket ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void openTicket(record.ticket_file)
                                            }
                                            className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                            title="Open going ticket PDF"
                                          >
                                            {formatDate(record.going_date)}
                                          </button>
                                        ) : (
                                          <div>
                                            <p className="text-sm font-semibold text-slate-700">
                                              {formatDate(record.going_date)}
                                            </p>
                                            <button
                                              type="button"
                                              onClick={() => openEditModal(record)}
                                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                                            >
                                              <Upload size={11} />
                                              Upload PDF
                                            </button>
                                          </div>
                                        )}
                                      </td>

                                      <td className="px-4 py-4">
                                        {record.coming_date ? (
                                          hasReturnTicket ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                void openTicket(
                                                  record.return_ticket_file
                                                )
                                              }
                                              className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                              title="Open return ticket PDF"
                                            >
                                              {formatDate(record.coming_date)}
                                            </button>
                                          ) : (
                                            <div>
                                              <p className="text-sm font-semibold text-slate-700">
                                                {formatDate(record.coming_date)}
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => openEditModal(record)}
                                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:underline"
                                              >
                                                <Upload size={11} />
                                                Upload PDF
                                              </button>
                                            </div>
                                          )
                                        ) : (
                                          <span className="text-sm font-medium text-slate-400">
                                            Not returned
                                          </span>
                                        )}
                                      </td>

                                      <td className="px-4 py-4">
                                        <span
                                          className={`text-sm font-semibold ${
                                            isVisaExpiringSoon(
                                              record.visa_valid_till
                                            )
                                              ? "text-amber-600"
                                              : "text-slate-700"
                                          }`}
                                        >
                                          {formatDate(record.visa_valid_till)}
                                        </span>
                                      </td>

                                      <td className="px-4 py-4">
                                        <span
                                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${getStatusClass(
                                            status
                                          )}`}
                                        >
                                          {status}
                                        </span>
                                      </td>

                                      <td className="px-4 py-4">
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                          {hasGoingTicket && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                void openTicket(
                                                  record.ticket_file
                                                )
                                              }
                                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                            >
                                              <FileText size={14} />
                                              Going
                                            </button>
                                          )}

                                          {record.coming_date &&
                                            hasReturnTicket && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  void openTicket(
                                                    record.return_ticket_file
                                                  )
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                              >
                                                <FileText size={14} />
                                                Return
                                              </button>
                                            )}

                                          <button
                                            type="button"
                                            onClick={() => openEditModal(record)}
                                            disabled={deletingRecordId === record.id}
                                            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            Edit
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => void deleteTravelRecord(record)}
                                            disabled={deletingRecordId === record.id}
                                            title="Delete travel record"
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            <Trash2 size={14} />
                                            {deletingRecordId === record.id ? "Deleting..." : "Delete"}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="divide-y divide-slate-100 md:hidden">
                            {employee.records.map((record, index) => {
                              const status = getStatus(record);
                              const hasGoingTicket =
                                Boolean(record.ticket_file);
                              const hasReturnTicket =
                                Boolean(record.return_ticket_file);

                              return (
                                <div key={record.id} className="p-4">
                                  <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Trip {employee.records.length - index}
                                      </p>
                                      <p className="mt-1 text-sm font-bold text-slate-900">
                                        {record.country || "Country not specified"}
                                      </p>
                                    </div>

                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${getStatusClass(
                                        status
                                      )}`}
                                    >
                                      {status}
                                    </span>
                                  </div>

                                  <div className="mt-4 grid grid-cols-2 gap-2">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        Country
                                      </p>
                                      <p className="mt-1 text-sm font-bold text-slate-700">
                                        {record.country || "—"}
                                      </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        Going Ticket
                                      </p>

                                      {hasGoingTicket ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void openTicket(record.ticket_file)
                                          }
                                          className="mt-1 text-left text-sm font-bold text-indigo-600"
                                        >
                                          {formatDate(record.going_date)}
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => openEditModal(record)}
                                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"
                                        >
                                          <Upload size={12} />
                                          Upload
                                        </button>
                                      )}
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        Return Ticket
                                      </p>

                                      {!record.coming_date ? (
                                        <p className="mt-1 text-sm font-bold text-slate-400">
                                          Not returned
                                        </p>
                                      ) : hasReturnTicket ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void openTicket(
                                              record.return_ticket_file
                                            )
                                          }
                                          className="mt-1 text-left text-sm font-bold text-indigo-600"
                                        >
                                          {formatDate(record.coming_date)}
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => openEditModal(record)}
                                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-600"
                                        >
                                          <Upload size={12} />
                                          Upload
                                        </button>
                                      )}
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        Visa
                                      </p>
                                      <p
                                        className={`mt-1 text-sm font-bold ${
                                          isVisaExpiringSoon(
                                            record.visa_valid_till
                                          )
                                            ? "text-amber-600"
                                            : "text-slate-700"
                                        }`}
                                      >
                                        {formatDate(record.visa_valid_till)}
                                      </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        Tickets
                                      </p>
                                      <p className="mt-1 text-sm font-bold text-slate-700">
                                        {Number(hasGoingTicket) +
                                          Number(hasReturnTicket)}{" "}
                                        / 2
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
                                    {hasGoingTicket && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void openTicket(record.ticket_file)
                                        }
                                        className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"
                                      >
                                        <FileText size={14} />
                                        Going
                                      </button>
                                    )}

                                    {record.coming_date && hasReturnTicket && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void openTicket(
                                            record.return_ticket_file
                                          )
                                        }
                                        className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"
                                      >
                                        <FileText size={14} />
                                        Return
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => openEditModal(record)}
                                      disabled={deletingRecordId === record.id}
                                      className="inline-flex min-w-0 items-center justify-center rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Edit Trip
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => void deleteTravelRecord(record)}
                                      disabled={deletingRecordId === record.id}
                                      className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Trash2 size={14} />
                                      {deletingRecordId === record.id ? "Deleting..." : "Delete"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
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

      {editRecord && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditModal();
          }}
        >
          <div className="flex max-h-[95dvh] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Edit Travel
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  {editRecord.staff_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
              {editError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p className="font-semibold">Please check this</p>
                  <p className="mt-0.5">{editError}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Staff Name
                  </label>
                  <input
                    value={editRecord.staff_name}
                    onChange={(e) =>
                      setEditRecord({
                        ...editRecord,
                        staff_name: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Country
                  </label>
                  <input
                    value={editRecord.country}
                    onChange={(e) =>
                      setEditRecord({
                        ...editRecord,
                        country: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Going Date
                  </label>
                  <input
                    type="date"
                    value={editRecord.going_date}
                    onChange={(e) =>
                      setEditRecord({
                        ...editRecord,
                        going_date: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={editRecord.coming_date}
                    onChange={(e) =>
                      setEditRecord({
                        ...editRecord,
                        coming_date: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Leave blank if still abroad.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Visa Valid Till
                  </label>
                  <input
                    type="date"
                    value={editRecord.visa_valid_till}
                    onChange={(e) =>
                      setEditRecord({
                        ...editRecord,
                        visa_valid_till: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Ticket size={18} className="text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Tickets
                    </h3>
                    <p className="text-xs text-slate-500">
                      Going and return PDFs can be separate or the same file.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ModalTicket
                    title="Going Ticket"
                    existing={editRecord.ticket_file}
                    selected={editGoingFile}
                    onOpen={() => void openTicket(editRecord.ticket_file)}
                    onRemove={() => setEditGoingFile(null)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (validateEditPdf(file)) setEditGoingFile(file);
                      e.target.value = "";
                    }}
                  />

                  <ModalTicket
                    title="Return Ticket"
                    existing={editRecord.return_ticket_file}
                    selected={editReturnFile}
                    disabled={editSameTicket}
                    onOpen={() => void openTicket(editRecord.return_ticket_file)}
                    onRemove={() => setEditReturnFile(null)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (validateEditPdf(file)) setEditReturnFile(file);
                      e.target.value = "";
                    }}
                  />
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-indigo-50 p-3">
                  <input
                    type="checkbox"
                    checked={editSameTicket}
                    onChange={(e) => {
                      setEditSameTicket(e.target.checked);
                      if (e.target.checked) setEditReturnFile(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <span>
                    <span className="block text-xs font-bold text-slate-900">
                      Return ticket is the same PDF
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      Use this when both tickets are in one PDF.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200 bg-slate-50 px-4 py-3.5 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={editSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60"
              >
                {editSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Update Travel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


function ModalTicket({
  title,
  existing,
  selected,
  disabled,
  onOpen,
  onChange,
  onRemove,
}: {
  title: string;
  existing: string | null;
  selected: File | null;
  disabled?: boolean;
  onOpen: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 p-3 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-slate-800">{title}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            PDF • Max 10 MB
          </p>
        </div>

        {existing && !selected && (
          <button
            type="button"
            onClick={onOpen}
            disabled={disabled}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed"
          >
            Open
          </button>
        )}
      </div>

      {selected ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-indigo-50 p-2.5">
          <p className="min-w-0 truncate text-[11px] font-semibold text-slate-700">
            {selected.name}
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-md p-1 text-red-500 hover:bg-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50">
          <Upload size={13} className="text-indigo-600" />
          {existing ? "Replace PDF" : "Upload PDF"}
          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={disabled}
            onChange={onChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: "indigo" | "emerald" | "amber" | "rose";
}) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
