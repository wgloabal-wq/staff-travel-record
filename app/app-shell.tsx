"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  UsersRound,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Staff Travel Records",
    href: "/staff",
    icon: Plane,
  },
  {
    label: "Job Candidates",
    href: "/candidates",
    icon: UsersRound,
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const isLoginPage = pathname === "/login";

  // =========================
  // AUTH PROTECTION
  // =========================
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      // Login page is public
      if (isLoginPage) {
        if (mounted) {
          setCheckingAuth(false);
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    }

    void checkAuth();

    // Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && window.location.pathname !== "/login") {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  // =========================
  // LOGOUT
  // =========================
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    await supabase.auth.signOut();

    setMobileOpen(false);
    router.replace("/login");
    router.refresh();
  }

  // =========================
  // ACTIVE MENU
  // =========================
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // =========================
  // LOGIN PAGE
  // =========================
  if (isLoginPage) {
    return <>{children}</>;
  }

  // =========================
  // AUTH CHECK LOADING
  // =========================
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="World Global Manpower"
            className="h-14 w-14 rounded-2xl object-contain"
          />

          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-600">
            <Loader2 size={17} className="animate-spin text-indigo-600" />
            Checking authentication...
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* =========================
          MOBILE HEADER
      ========================== */}
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div className="ml-3 flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="World Global Manpower"
            className="h-9 w-9 rounded-xl object-contain"
          />

          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">
              World Global
            </p>

            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Manpower
            </p>
          </div>
        </div>
      </header>

      {/* =========================
          MOBILE OVERLAY
      ========================== */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* =========================
          SIDEBAR
      ========================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#0b1220] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <img
              src="/logo.png"
              alt="World Global Manpower"
              className="h-11 w-11 rounded-2xl object-contain"
            />

            <div>
              <p className="text-sm font-bold tracking-wide text-white">
                WORLD GLOBAL
              </p>

              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                Manpower Pvt. Ltd.
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-white/[0.04] text-slate-400 group-hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                  </span>

                  <span className="flex-1">{item.label}</span>

                  {active && (
                    <ChevronRight
                      size={16}
                      className="text-white/70"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Management Info */}
          <div className="mt-8">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Management
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-semibold text-slate-200">
                Recruitment Management
              </p>

              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                Manage staff travel records and overseas job candidates from
                one place.
              </p>
            </div>
          </div>
        </div>

        {/* =========================
            SIDEBAR FOOTER
        ========================== */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/[0.04] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Company
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-300">
              World Global Manpower Pvt. Ltd.
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Recruitment & Staff Management
            </p>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
              {loggingOut ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
            </span>

            <span className="flex-1">
              {loggingOut ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </aside>

      {/* =========================
          DESKTOP CONTENT
      ========================== */}
      <div className="lg:pl-[280px]">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}