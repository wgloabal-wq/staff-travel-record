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

  /* =========================================================
     AUTH PROTECTION
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
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

  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  function openMobileMenu() {
    setMobileOpen(true);
  }

  /*
   * Close sidebar whenever route changes.
   * This also handles browser back/forward navigation.
   */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /*
   * Prevent background page from scrolling while
   * mobile sidebar is open.
   */
  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  /*
   * Close mobile menu with Escape key.
   */
  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  /* =========================================================
     LOGOUT
  ========================================================= */

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setMobileOpen(false);

    try {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  /* =========================================================
     ACTIVE MENU
  ========================================================= */

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /* =========================================================
     LOGIN PAGE
  ========================================================= */

  if (isLoginPage) {
    return <>{children}</>;
  }

  /* =========================================================
     AUTH CHECK LOADING
  ========================================================= */

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-slate-50 px-5">
        <div className="flex w-full max-w-xs flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="World Global Manpower"
            className="h-14 w-14 rounded-2xl object-contain"
          />

          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
            <Loader2
              size={17}
              className="animate-spin text-indigo-600"
            />
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
    <div className="min-h-screen min-h-[100dvh] overflow-x-hidden bg-slate-50 text-slate-900">
      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <header
        className="
          sticky top-0 z-40
          flex min-h-16 items-center
          border-b border-slate-200
          bg-white/95 px-3
          backdrop-blur-xl
          lg:hidden
          sm:px-4
        "
      >
        <button
          type="button"
          onClick={openMobileMenu}
          className="
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-xl
            text-slate-600
            transition
            hover:bg-slate-100
            active:scale-95
            focus:outline-none
            focus:ring-4
            focus:ring-indigo-500/10
          "
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
        >
          <Menu size={23} strokeWidth={2} />
        </button>

        <Link
          href="/dashboard"
          onClick={closeMobileMenu}
          className="ml-2 flex min-w-0 items-center gap-2.5"
        >
          <img
            src="/logo.png"
            alt="World Global Manpower"
            className="
              h-9 w-9
              shrink-0
              rounded-xl
              object-contain
            "
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-900">
              World Global
            </p>

            <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
              Manpower
            </p>
          </div>
        </Link>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileMenu}
          className="
            fixed inset-0 z-40
            bg-slate-950/50
            backdrop-blur-[2px]
            lg:hidden
          "
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex
          w-[280px] max-w-[88vw]
          flex-col
          bg-[#0b1220]
          text-white
          shadow-2xl

          transition-transform
          duration-300
          ease-out

          lg:translate-x-0

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
        aria-label="Main navigation"
      >
        {/* ===================================================
            BRAND
        ==================================================== */}

        <div
          className="
            flex min-h-20
            items-center justify-between
            border-b border-white/10
            px-4
            sm:px-5
          "
        >
          <Link
            href="/dashboard"
            onClick={closeMobileMenu}
            className="
              flex min-w-0
              items-center gap-3
              rounded-xl
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-400
              focus:ring-offset-2
              focus:ring-offset-[#0b1220]
            "
          >
            <img
              src="/logo.png"
              alt="World Global Manpower"
              className="
                h-10 w-10
                shrink-0
                rounded-xl
                object-contain
                sm:h-11 sm:w-11
              "
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide text-white">
                WORLD GLOBAL
              </p>

              <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Manpower Pvt. Ltd.
              </p>
            </div>
          </Link>

          {/* Mobile close button */}

          <button
            type="button"
            onClick={closeMobileMenu}
            className="
              ml-2 flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-white/10
              hover:text-white
              active:scale-95
              lg:hidden
            "
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* ===================================================
            NAVIGATION
        ==================================================== */}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-4 sm:py-6">
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
                    onClick={closeMobileMenu}
                    aria-current={active ? "page" : undefined}
                    className={`
                      group flex min-h-12
                      items-center gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-sm
                      font-medium
                      transition

                      focus:outline-none
                      focus:ring-2
                      focus:ring-indigo-400
                      focus:ring-offset-2
                      focus:ring-offset-[#0b1220]

                      ${
                        active
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                      }
                    `}
                  >
                    <span
                      className={`
                        flex h-9 w-9 shrink-0
                        items-center justify-center
                        rounded-lg
                        transition

                        ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-white/[0.04] text-slate-400 group-hover:text-white"
                        }
                      `}
                    >
                      <Icon size={18} />
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {active && (
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-white/70"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* =================================================
                MANAGEMENT INFO
            ================================================== */}

            <div className="mt-8">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Management
              </p>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold text-slate-200">
                  Recruitment Management
                </p>

                <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                  Manage staff travel records and overseas job
                  candidates from one place.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              SIDEBAR FOOTER
          ================================================== */}

          <div
            className="
              shrink-0
              border-t border-white/10
              bg-[#0b1220]
              p-3
              sm:p-4
            "
          >
            <div className="rounded-xl bg-white/[0.04] px-3.5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Company
              </p>

              <p className="mt-1 truncate text-xs font-semibold text-slate-300">
                World Global Manpower Pvt. Ltd.
              </p>

              <p className="mt-1 truncate text-[10px] text-slate-500">
                Recruitment & Staff Management
              </p>
            </div>

            {/* Logout */}

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="
                mt-3 flex min-h-12 w-full
                items-center gap-3
                rounded-xl
                border border-white/10
                bg-white/[0.04]
                px-3.5 py-2.5
                text-left
                text-sm font-medium
                text-slate-400
                transition

                hover:bg-red-500/10
                hover:text-red-300

                active:scale-[0.99]

                focus:outline-none
                focus:ring-2
                focus:ring-red-400/50

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                {loggingOut ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <LogOut size={18} />
                )}
              </span>

              <span className="min-w-0 flex-1 truncate">
                {loggingOut ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          PAGE CONTENT
      ====================================================== */}

      <div
        className="
          min-w-0
          lg:pl-[280px]
        "
      >
        <main className="min-h-screen min-h-[100dvh] min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}