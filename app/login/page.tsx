"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!active) return;

      if (data.session) {
        router.replace("/dashboard");
        return;
      }

      setChecking(false);
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Invalid email or password."
          : signInError.message
      );
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          Checking secure session...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* =========================
            LEFT SIDE - DESKTOP
        ========================== */}
        <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-[#06142f] via-[#0a1d42] to-[#092d67] p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          {/* Background glow */}
          <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10">
            {/* Horizontal Company Logo */}
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="World Global Manpower Pvt. Ltd."
                className="h-auto w-[210px] object-contain"
              />
            </div>

            {/* Hero Content */}
            <div className="mt-20 max-w-2xl xl:mt-24">
              <div className="mb-5 inline-flex items-center rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
                  Recruitment Management
                </span>
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white xl:text-5xl">
                Manage staff travel and overseas candidates from one{" "}
                <span className="text-blue-400">secure workspace.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                Access candidate records, staff travel information, documents,
                payments and recruitment operations through your company
                dashboard.
              </p>

              {/* Feature Cards */}
              <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <p className="text-sm font-bold text-white">
                    Secure Access
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Authorized staff only
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <LockKeyhole className="h-5 w-5" />
                  </div>

                  <p className="text-sm font-bold text-white">
                    Centralized Records
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Staff & candidate management
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5">
            <p className="text-xs font-medium text-slate-400">
              Authorized staff only
            </p>

            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} World Global Manpower Pvt. Ltd.
            </p>
          </div>
        </section>

        {/* =========================
            RIGHT SIDE
        ========================== */}
        <section className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            {/* Login Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:p-8">
              {/* =========================
                  VERTICAL COMPANY LOGO
              ========================== */}
              <div className="mb-7 flex justify-center">
                <div className="flex h-36 w-full items-center justify-center">
                  <img
                    src="/vertical-logo.png"
                    alt="World Global Manpower Pvt. Ltd."
                    className="h-32 w-auto max-w-[210px] object-contain"
                  />
                </div>
              </div>

              {/* Login Header */}
              <div className="mb-7">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />

                  <span className="text-xs font-bold text-blue-700">
                    Secure Login
                  </span>
                </div>

                <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in with your authorized company account to continue.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700">
                  {error}
                </div>
              )}

              {/* =========================
                  LOGIN FORM
              ========================== */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-800">
                    Email address
                  </span>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@company.com"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </label>

                {/* Password */}
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-800">
                    Password
                  </span>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Authorized access only
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    This system is restricted to authorized World Global
                    Manpower staff.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Footer */}
            <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
              © {new Date().getFullYear()} World Global Manpower Pvt. Ltd.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}