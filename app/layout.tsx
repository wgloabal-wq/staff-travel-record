import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./app-shell";

export const metadata: Metadata = {
  title: "World Global Manpower",
  description: "Recruitment & Staff Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 antialiased"
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}