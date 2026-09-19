"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Plane,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function AddTravelRecord() {
  const router = useRouter();

  const [staffName, setStaffName] = useState("");
  const [country, setCountry] = useState("");
  const [goingDate, setGoingDate] = useState("");
  const [comingDate, setComingDate] = useState("");
  const [visaValidTill, setVisaValidTill] = useState("");

  // Payment details
  const [paymentCurrency, setPaymentCurrency] = useState("RUB");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [convertedCurrency, setConvertedCurrency] = useState("INR");
  const [convertedAmount, setConvertedAmount] = useState("");

  const [converting, setConverting] = useState(false);
  const [conversionError, setConversionError] = useState("");

  // Documents
  const [passport, setPassport] = useState<File | null>(null);
  const [visa, setVisa] = useState<File | null>(null);
  const [ticket, setTicket] = useState<File | null>(null);
  const [other, setOther] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * Automatic Currency Conversion
   */
  useEffect(() => {
    let cancelled = false;

    async function convertCurrency() {
      setConversionError("");

      const amount = Number(paymentAmount);

      if (!paymentAmount || !Number.isFinite(amount) || amount <= 0) {
        setConvertedAmount("");
        return;
      }

      if (paymentCurrency === convertedCurrency) {
        setConvertedAmount(amount.toFixed(2));
        return;
      }

      try {
        setConverting(true);

        const response = await fetch(
          `https://api.frankfurter.dev/v2/rate/${paymentCurrency}/${convertedCurrency}`
        );

        if (!response.ok) {
          throw new Error("Unable to fetch exchange rate.");
        }

        const data = await response.json();

        if (!data?.rate) {
          throw new Error("Exchange rate not available.");
        }

        const result = amount * Number(data.rate);

        if (!cancelled) {
          setConvertedAmount(result.toFixed(2));
        }
      } catch (err: any) {
        if (!cancelled) {
          setConvertedAmount("");
          setConversionError(
            err?.message || "Unable to convert currency."
          );
        }
      } finally {
        if (!cancelled) {
          setConverting(false);
        }
      }
    }

    convertCurrency();

    return () => {
      cancelled = true;
    };
  }, [paymentAmount, paymentCurrency, convertedCurrency]);

  async function uploadFile(file: File | null, folder: string) {
    if (!file) return null;

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "file";

    const fileName = `${folder}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("travel-documents")
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    return fileName;
  }

  async function saveRecord(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      if (paymentAmount && !convertedAmount) {
        throw new Error(
          "Please wait for currency conversion to complete."
        );
      }

      // Upload documents
      const passportFile = await uploadFile(passport, "passport");
      const visaFile = await uploadFile(visa, "visa");
      const ticketFile = await uploadFile(ticket, "ticket");
      const otherFile = await uploadFile(other, "other");

      // Save record
      const { error } = await supabase
        .from("travel_records")
        .insert({
          staff_name: staffName.trim(),
          country: country.trim(),

          going_date: goingDate,
          coming_date: comingDate || null,
          visa_valid_till: visaValidTill || null,

          // Old field kept for compatibility
          ticket_amount: paymentAmount
            ? Number(paymentAmount)
            : null,

          // Actual payment
          payment_currency: paymentCurrency,
          payment_amount: paymentAmount
            ? Number(paymentAmount)
            : null,

          // Automatic converted amount
          converted_currency: convertedCurrency,
          converted_amount: convertedAmount
            ? Number(convertedAmount)
            : null,

          // Documents
          passport_file: passportFile,
          visa_file: visaFile,
          ticket_file: ticketFile,
          other_file: otherFile,
        });

      if (error) {
        throw error;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Plane size={20} />
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                Add Travel Record
              </h1>

              <p className="text-xs text-slate-500">
                Staff travel information
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <form
          onSubmit={saveRecord}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {/* Basic Information */}
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Staff Name"
              value={staffName}
              onChange={setStaffName}
              placeholder="Enter staff name"
              required
            />

            <Input
              label="Country"
              value={country}
              onChange={setCountry}
              placeholder="Russia"
              required
            />

            <Input
              label="Going Date"
              type="date"
              value={goingDate}
              onChange={setGoingDate}
              required
            />

            <Input
              label="Coming Date"
              type="date"
              value={comingDate}
              onChange={setComingDate}
            />

            <Input
              label="Visa Valid Till"
              type="date"
              value={visaValidTill}
              onChange={setVisaValidTill}
            />
          </div>

          {/* Payment */}
          <div className="my-8 border-t border-slate-200" />

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Ticket Payment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the actual payment amount. Converted amount
              will be calculated automatically.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Payment Currency */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Payment Currency
              </label>

              <select
                value={paymentCurrency}
                onChange={(e) =>
                  setPaymentCurrency(e.target.value)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                <option value="INR">
                  INR — Indian Rupee
                </option>

                <option value="RUB">
                  RUB — Russian Ruble
                </option>

                <option value="USD">
                  USD — US Dollar
                </option>

                <option value="EUR">
                  EUR — Euro
                </option>

                <option value="BYN">
                  BYN — Belarusian Ruble
                </option>

                <option value="GBP">
                  GBP — British Pound
                </option>
              </select>
            </div>

            {/* Payment Amount */}
            <Input
              label={`Payment Amount (${paymentCurrency})`}
              type="number"
              value={paymentAmount}
              onChange={setPaymentAmount}
              placeholder="45000"
            />

            {/* Converted Currency */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Converted Currency
              </label>

              <select
                value={convertedCurrency}
                onChange={(e) =>
                  setConvertedCurrency(e.target.value)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                <option value="INR">
                  INR — Indian Rupee
                </option>

                <option value="RUB">
                  RUB — Russian Ruble
                </option>

                <option value="USD">
                  USD — US Dollar
                </option>

                <option value="EUR">
                  EUR — Euro
                </option>

                <option value="BYN">
                  BYN — Belarusian Ruble
                </option>

                <option value="GBP">
                  GBP — British Pound
                </option>
              </select>
            </div>

            {/* Converted Amount */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Converted Amount ({convertedCurrency})
              </label>

              <div className="relative">
                <input
                  type="number"
                  value={convertedAmount}
                  readOnly
                  placeholder="Automatically calculated"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-700 outline-none"
                />

                {converting && (
                  <Loader2
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                  />
                )}
              </div>

              {converting && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                  <RefreshCw size={12} />
                  Converting...
                </p>
              )}

              {!converting &&
                convertedAmount &&
                paymentCurrency !== convertedCurrency && (
                  <p className="mt-1.5 text-xs text-green-600">
                    ✓ Automatically converted using the latest
                    available rate
                  </p>
                )}

              {conversionError && (
                <p className="mt-1.5 text-xs text-red-500">
                  {conversionError}
                </p>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="my-8 border-t border-slate-200" />

          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Travel Documents
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <FileInput
              label="Passport"
              file={passport}
              setFile={setPassport}
            />

            <FileInput
              label="Visa"
              file={visa}
              setFile={setVisa}
            />

            <FileInput
              label="Ticket"
              file={ticket}
              setFile={setTicket}
            />

            <FileInput
              label="Other Document"
              file={other}
              setFile={setOther}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Save */}
          <button
            type="submit"
            disabled={loading || converting}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
            ) : (
              <Save size={19} />
            )}

            {loading
              ? "Saving..."
              : converting
                ? "Converting..."
                : "Save Travel Record"}
          </button>
        </form>
      </div>
    </main>
  );
}

/* --------------------------------
   Reusable Input
-------------------------------- */

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

/* --------------------------------
   File Upload
-------------------------------- */

function FileInput({
  label,
  file,
  setFile,
}: {
  label: string;
  file: File | null;
  setFile: (file: File | null) => void;
}) {
  return (
    <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-5 transition hover:border-slate-400 hover:bg-slate-50">
      <div className="flex items-center gap-3">
        <Upload
          size={20}
          className="text-slate-500"
        />

        <div>
          <p className="text-sm font-semibold text-slate-700">
            {label}
          </p>

          <p className="text-xs text-slate-400">
            PDF, JPG, PNG
          </p>
        </div>
      </div>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) =>
          setFile(e.target.files?.[0] || null)
        }
      />

      {file && (
        <p className="mt-3 truncate text-xs font-medium text-green-600">
          ✓ {file.name}
        </p>
      )}
    </label>
  );
}