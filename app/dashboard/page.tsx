"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Plane,
  Plus,
  RefreshCw,
  UsersRound,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TravelRecord = {
  id: string;
  staff_name: string;
  country: string;
  going_date: string | null;
  coming_date: string | null;
  visa_valid_till: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}

function getTravelStatus(record: TravelRecord) {
  const today = getToday();

  const going = record.going_date
    ? new Date(`${record.going_date}T00:00:00`)
    : null;

  const coming = record.coming_date
    ? new Date(`${record.coming_date}T00:00:00`)
    : null;

  if (going && going > today) {
    return "Upcoming";
  }

  if (going && going <= today && (!coming || coming >= today)) {
    return "Currently Abroad";
  }

  if (coming && coming < today) {
    return "Returned";
  }

  return "Pending";
}

export default function DashboardPage() {
  const [travelRecords, setTravelRecords] = useState<TravelRecord[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [travelResponse, candidateResponse] = await Promise.all([
        supabase
          .from("travel_records")
          .select(
            "id, staff_name, country, going_date, coming_date, visa_valid_till"
          )
          .order("going_date", { ascending: false }),
        supabase
          .from("job_candidates")
          .select("id", { count: "exact", head: true }),
      ]);

      if (travelResponse.error) {
        throw travelResponse.error;
      }

      if (candidateResponse.error) {
        throw candidateResponse.error;
      }

      setTravelRecords(travelResponse.data || []);
      setCandidateCount(candidateResponse.count || 0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    // Dashboard data should refresh when the dashboard is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const today = getToday();

    let currentlyAbroad = 0;
    let upcomingTrips = 0;
    let visaExpiringSoon = 0;

    const visaLimit = new Date(today);
    visaLimit.setDate(visaLimit.getDate() + 30);

    for (const record of travelRecords) {
      const status = getTravelStatus(record);

      if (status === "Currently Abroad") {
        currentlyAbroad += 1;
      }

      if (status === "Upcoming") {
        upcomingTrips += 1;
      }

      if (record.visa_valid_till) {
        const expiry = new Date(`${record.visa_valid_till}T00:00:00`);

        if (expiry >= today && expiry <= visaLimit) {
          visaExpiringSoon += 1;
        }
      }
    }

    return {
      totalTravel: travelRecords.length,
      currentlyAbroad,
      upcomingTrips,
      visaExpiringSoon,
    };
  }, [travelRecords]);

  const recentRecords = useMemo(
    () => travelRecords.slice(0, 6),
    [travelRecords]
  );

  const visaAlerts = useMemo(() => {
    const today = getToday();
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);

    return travelRecords
      .filter((record) => {
        if (!record.visa_valid_till) return false;

        const expiry = new Date(`${record.visa_valid_till}T00:00:00`);

        return expiry >= today && expiry <= limit;
      })
      .sort((a, b) => {
        return (
          new Date(`${a.visa_valid_till}T00:00:00`).getTime() -
          new Date(`${b.visa_valid_till}T00:00:00`).getTime()
        );
      })
      .slice(0, 5);
  }, [travelRecords]);

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      {/* Page Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Management Dashboard
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Welcome back
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Monitor staff travel and overseas recruitment activity from one
                place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Dashboard data could not be loaded</p>
              <p className="mt-0.5 text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Staff Travel Records"
            value={loading ? "—" : stats.totalTravel}
            icon={<Plane size={20} />}
            tone="indigo"
          />

          <StatCard
            label="Currently Abroad"
            value={loading ? "—" : stats.currentlyAbroad}
            icon={<CheckCircle2 size={20} />}
            tone="emerald"
          />

          <StatCard
            label="Upcoming Trips"
            value={loading ? "—" : stats.upcomingTrips}
            icon={<CalendarDays size={20} />}
            tone="amber"
          />

          <StatCard
            label="Job Candidates"
            value={loading ? "—" : candidateCount}
            icon={<UsersRound size={20} />}
            tone="violet"
          />
        </section>

        {/* Quick Actions */}
        <section className="grid gap-4 md:grid-cols-2">
          <QuickAction
            href="/staff/add"
            icon={<Plus size={21} />}
            title="Add Staff Travel Record"
            description="Create a new staff travel entry with visa and travel details."
          />

          <QuickAction
            href="/candidates/add"
            icon={<UsersRound size={21} />}
            title="Add Job Candidate"
            description="Register a candidate and start tracking their recruitment process."
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
          {/* Recent Travel */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Staff Travel
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Latest travel records
                </p>
              </div>

              <Link
                href="/staff"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all
                <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <LoadingRows />
            ) : recentRecords.length === 0 ? (
              <EmptyState
                icon={<Plane size={22} />}
                title="No travel records yet"
                description="Start by adding your first staff travel record."
                href="/staff/add"
                action="Add travel record"
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-3">Staff</th>
                        <th className="px-4 py-3">Country</th>
                        <th className="px-4 py-3">Going</th>
                        <th className="px-4 py-3">Return</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {recentRecords.map((record) => (
                        <TravelRow key={record.id} record={record} />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 md:hidden">
                  {recentRecords.map((record) => (
                    <MobileTravelCard key={record.id} record={record} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Visa Monitoring */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Visa Monitoring
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Expiring within 30 days
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock3 size={18} />
                </div>
              </div>
            </div>

            {visaAlerts.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={22} />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  No upcoming visa expiries
                </p>

                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                  There are no recorded visas expiring in the next 30 days.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visaAlerts.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 px-5 py-4 sm:px-6"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <FileText size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {record.staff_name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {record.country}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-amber-600">
                        {formatDate(record.visa_valid_till)}
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Visa expiry
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Bottom Information */}
        <section className="rounded-2xl bg-[#0b1220] p-5 text-white shadow-lg sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
                  <UsersRound size={18} />
                </div>

                <p className="text-sm font-bold">
                  World Global Manpower Pvt. Ltd.
                </p>
              </div>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                Centralized management for staff travel records and overseas
                recruitment candidates.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-400">
              <span className="rounded-full border border-white/10 px-3 py-1.5">
                Staff Management
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1.5">
                Recruitment
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1.5">
                Travel Tracking
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
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
  tone: "indigo" | "emerald" | "amber" | "violet";
}) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <ArrowRight
          size={18}
          className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600"
        />
      </div>
    </Link>
  );
}

function TravelRow({ record }: { record: TravelRecord }) {
  const status = getTravelStatus(record);

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-6 py-4">
        <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
          {record.staff_name}
        </p>
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
        {record.country || "—"}
      </td>

      <td className="px-4 py-4 text-xs text-slate-500">
        {formatDate(record.going_date)}
      </td>

      <td className="px-4 py-4 text-xs text-slate-500">
        {formatDate(record.coming_date)}
      </td>

      <td className="px-6 py-4">
        <StatusBadge status={status} />
      </td>
    </tr>
  );
}

function MobileTravelCard({ record }: { record: TravelRecord }) {
  const status = getTravelStatus(record);

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">
            {record.staff_name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {record.country || "Country not specified"}
          </p>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Going
          </p>
          <p className="mt-1 text-xs font-medium text-slate-700">
            {formatDate(record.going_date)}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Return
          </p>
          <p className="mt-1 text-xs font-medium text-slate-700">
            {formatDate(record.coming_date)}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Upcoming: "bg-indigo-50 text-indigo-700",
    "Currently Abroad": "bg-emerald-50 text-emerald-700",
    Returned: "bg-slate-100 text-slate-600",
    Pending: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-12 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>

      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        <Plus size={15} />
        {action}
      </Link>
    </div>
  );
}
