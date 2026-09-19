"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plane,
  Users,
  CalendarDays,
  Clock3,
  FileText,
  BriefcaseBusiness,
  ArrowRight,
  MapPin,
  UserRound,
  Globe2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TravelRecord = {
  id: number;
  staff_name: string;
  country: string;
  going_date: string;
  coming_date: string | null;
  visa_valid_till: string | null;
  ticket_amount: number | null;
};

export default function DashboardPage() {
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [travelResult, candidateResult] = await Promise.all([
        supabase
          .from("travel_records")
          .select(
            "id, staff_name, country, going_date, coming_date, visa_valid_till, ticket_amount"
          )
          .order("going_date", { ascending: true }),

        supabase
          .from("job_candidates")
          .select("id", { count: "exact", head: true }),
      ]);

      if (!travelResult.error) {
        setRecords(travelResult.data || []);
      }

      if (!candidateResult.error) {
        setCandidateCount(candidateResult.count || 0);
      }
    } finally {
      setLoading(false);
    }
  }

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const in30Days = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 30);
    return d;
  }, [today]);

  const currentlyAbroad = records.filter((record) => {
    if (!record.going_date || !record.coming_date) return false;

    const going = new Date(record.going_date);
    const coming = new Date(record.coming_date);

    going.setHours(0, 0, 0, 0);
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

    const visa = new Date(record.visa_valid_till);
    visa.setHours(0, 0, 0, 0);

    return visa >= today && visa <= in30Days;
  }).length;

  /*
   * VISA ALERTS
   * Shows expired visas and visas expiring within 30 days.
   */
  const visaAlerts = records
    .filter((record) => {
      if (!record.visa_valid_till) return false;

      const visa = new Date(record.visa_valid_till);
      visa.setHours(0, 0, 0, 0);

      return visa <= in30Days;
    })
    .sort((a, b) => {
      if (!a.visa_valid_till) return 1;
      if (!b.visa_valid_till) return -1;

      return (
        new Date(a.visa_valid_till).getTime() -
        new Date(b.visa_valid_till).getTime()
      );
    })
    .slice(0, 5);

  const countries = new Set(
    records.map((record) => record.country).filter(Boolean)
  ).size;

  const recentRecords = [...records]
    .sort(
      (a, b) =>
        new Date(b.going_date).getTime() -
        new Date(a.going_date).getTime()
    )
    .slice(0, 5);

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white sm:h-11 sm:w-11">
              <LayoutIcon />
            </div>

            <div>
              <h1 className="text-base font-bold sm:text-lg">
                Dashboard
              </h1>

              <p className="text-xs text-slate-500">
                World Global Manpower Pvt. Ltd.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plane size={17} />
              Staff Travel Records
            </Link>

            <Link
              href="/candidates"
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <BriefcaseBusiness size={17} />
              Job Candidates
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="mb-6 sm:mb-7">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Management Overview
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Quick overview of staff travel and recruitment operations.
          </p>
        </div>

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Staff Travel Records"
            value={loading ? "—" : String(records.length)}
            icon={<Users size={21} />}
          />

          <DashboardCard
            title="Currently Abroad"
            value={loading ? "—" : String(currentlyAbroad)}
            icon={<MapPin size={21} />}
          />

          <DashboardCard
            title="Upcoming Trips"
            value={loading ? "—" : String(upcomingTrips)}
            icon={<CalendarDays size={21} />}
          />

          <DashboardCard
            title="Job Candidates"
            value={loading ? "—" : String(candidateCount)}
            icon={<UserRound size={21} />}
          />
        </div>

        {/* SECONDARY STATS */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SmallCard
            title="Visa Expiring Soon"
            value={loading ? "—" : String(visaExpiringSoon)}
            subtitle="Within the next 30 days"
            icon={<Clock3 size={19} />}
          />

          <SmallCard
            title="Countries Covered"
            value={loading ? "—" : String(countries)}
            subtitle="Countries in staff records"
            icon={<Globe2 size={19} />}
          />

          <SmallCard
            title="System Status"
            value="Active"
            subtitle="Records management system"
            icon={<TrendingUp size={19} />}
          />
        </div>

        {/* VISA ALERTS */}
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold">
                Visa Expiry Alerts
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Staff visas requiring attention.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <AlertTriangle size={15} />
              {loading ? "—" : visaExpiringSoon} Expiring Soon
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Loading visa alerts...
              </div>
            ) : visaAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  ✓
                </div>

                <h4 className="font-semibold">
                  No visa alerts
                </h4>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  No staff visas are expiring within the next 30 days.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visaAlerts.map((record) => {
                  const visaDate = record.visa_valid_till
                    ? new Date(record.visa_valid_till)
                    : null;

                  const daysLeft = visaDate
                    ? Math.ceil(
                        (visaDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  const isExpired =
                    daysLeft !== null && daysLeft < 0;

                  const isCritical =
                    daysLeft !== null && daysLeft <= 15;

                  return (
                    <div
                      key={record.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            isExpired || isCritical
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          <AlertTriangle size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {record.staff_name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {record.country} • Visa till{" "}
                            {formatDate(record.visa_valid_till)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isExpired
                              ? "bg-red-100 text-red-700"
                              : isCritical
                                ? "bg-orange-100 text-orange-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isExpired
                            ? "Expired"
                            : daysLeft === 0
                              ? "Expires Today"
                              : `${daysLeft} days left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-6 sm:mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-bold">
              Quick Access
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Open the section you want to manage.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <QuickAction
              href="/"
              icon={<Plane size={22} />}
              title="Staff Travel Records"
              description="View staff travel, visa, ticket and document records."
            />

            <QuickAction
              href="/candidates"
              icon={<BriefcaseBusiness size={22} />}
              title="Job Candidates"
              description="Manage recruitment candidates and deployment records."
            />
          </div>
        </section>

        {/* RECENT TRAVEL */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h3 className="font-semibold">
                Recent Staff Travel
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Latest travel records
              </p>
            </div>

            <Link
              href="/"
              className="flex items-center gap-1 self-start text-sm font-semibold text-slate-700 hover:text-slate-900 sm:self-auto"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading dashboard...
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <FileText
                size={36}
                className="mb-3 text-slate-300"
              />

              <h4 className="font-semibold">
                No travel records yet
              </h4>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Staff travel records will appear here.
              </p>

              <Link
                href="/add"
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Add Travel Record
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
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
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-3 py-4 text-sm font-semibold sm:px-5">
                        {record.staff_name}
                      </td>

                      <td className="px-3 py-4 text-sm sm:px-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                          {record.country}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-sm sm:px-5">
                        {formatDate(record.going_date)}
                      </td>

                      <td className="px-3 py-4 text-sm sm:px-5">
                        {formatDate(record.coming_date)}
                      </td>

                      <td className="px-3 py-4 text-sm sm:px-5">
                        {formatDate(record.visa_valid_till)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* COMPANY STRIP */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="break-words">
            <span className="font-semibold text-slate-700">
              World Global Manpower Pvt. Ltd.
            </span>{" "}
            • Rohini Sector 7, New Delhi, India
          </p>

          <p className="break-words sm:text-right">
            hello@wgmanpower.com • wgmanpower.com
          </p>
        </div>
      </div>
    </main>
  );
}

function LayoutIcon() {
  return <BriefcaseBusiness size={22} />;
}

function DashboardCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SmallCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <p className="shrink-0 text-xl font-bold sm:text-2xl">
          {value}
        </p>
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
      className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:items-center sm:gap-4 sm:p-5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white sm:h-12 sm:w-12">
        {icon}
      </div>

      <div className="min-w-0">
        <h4 className="font-semibold">
          {title}
        </h4>

        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
          {description}
        </p>
      </div>

      <ArrowRight
        size={18}
        className="ml-auto shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700"
      />
    </Link>
  );
}