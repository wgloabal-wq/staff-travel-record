"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Plane,
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  Menu,
  X,
} from "lucide-react";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isDashboard = pathname === "/dashboard";
  const isStaff = pathname === "/";
  const isCandidates = pathname.startsWith("/candidates");

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <>
      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 active:scale-95"
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <div className="ml-3 flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Plane size={18} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              World Global
            </p>

            <p className="truncate text-[10px] text-slate-500">
              Manpower Management
            </p>
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:w-64 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* =================================================
            SIDEBAR LOGO
        ================================================== */}
        <div className="flex h-[73px] items-center justify-between border-b border-slate-200 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Plane size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900">
                World Global
              </h2>

              <p className="truncate text-[10px] text-slate-500">
                Manpower Management
              </p>
            </div>
          </div>

          {/* MOBILE CLOSE */}
          <button
            type="button"
            onClick={closeSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 active:scale-95 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {/* MAIN */}
          <SidebarLabel label="MAIN" />

          <SidebarLink
            href="/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={isDashboard}
            onNavigate={closeSidebar}
          />

          {/* STAFF */}
          <SidebarLabel label="STAFF" />

          <SidebarLink
            href="/"
            icon={<Users size={18} />}
            label="Staff Travel Records"
            active={isStaff}
            onNavigate={closeSidebar}
          />

          {/* CANDIDATES */}
          <SidebarLabel label="CANDIDATES" />

          <SidebarLink
            href="/candidates"
            icon={<BriefcaseBusiness size={18} />}
            label="Job Candidates"
            active={isCandidates}
            onNavigate={closeSidebar}
          />
        </nav>

        {/* =================================================
            SIDEBAR FOOTER
        ================================================== */}
        <div className="border-t border-slate-200 p-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-800">
              World Global Manpower
            </p>

            <p className="mt-1 text-[10px] leading-4 text-slate-500">
              Recruitment & Staff Management System
            </p>
          </div>
        </div>
      </aside>

      {/* =====================================================
          PAGE CONTENT
      ====================================================== */}
      <main className="min-h-screen pt-16 lg:pl-64 lg:pt-0">
        {children}
      </main>
    </>
  );
}

/* =========================================================
   SIDEBAR LABEL
========================================================= */

function SidebarLabel({ label }: { label: string }) {
  return (
    <p className="mb-2 mt-6 px-3 text-[10px] font-bold tracking-wider text-slate-400 first:mt-0">
      {label}
    </p>
  );
}

/* =========================================================
   SIDEBAR LINK
========================================================= */

function SidebarLink({
  href,
  icon,
  label,
  active = false,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className="shrink-0">{icon}</span>

      <span className="truncate">{label}</span>
    </Link>
  );
}