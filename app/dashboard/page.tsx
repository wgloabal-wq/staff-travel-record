"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Staff = {
  id: string;
  staff_id: string;
  full_name: string;
  passport_number: string | null;
  passport_document: string | null;
  created_at: string;
  updated_at: string;
};

type StaffForm = {
  staff_id: string;
  full_name: string;
  passport_number: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function validateDocument(file: File) {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (!allowedTypes.includes(file.type)) {
    return "Only PDF, JPG and PNG files are allowed.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File size must be 10 MB or less.";
  }

  return null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "ST";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function DashboardPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [form, setForm] = useState<StaffForm>({
    staff_id: "",
    full_name: "",
    passport_number: "",
  });

  const [saving, setSaving] = useState(false);

  async function loadStaff(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data, error: fetchError } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("SUPABASE STAFF ERROR:", {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code,
        });

        const parts = [
          fetchError.message,
          fetchError.details,
          fetchError.hint,
          fetchError.code ? `Code: ${fetchError.code}` : "",
        ].filter(Boolean);

        throw new Error(
          parts.length
            ? parts.join(" | ")
            : "Unable to load staff records from Supabase."
        );
      }

      setStaff((data || []) as Staff[]);
    } catch (err: unknown) {
      console.error("LOAD STAFF FAILED:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          `Unable to load staff records. ${JSON.stringify(err)}`
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadStaff();
  }, []);

  function openAddModal() {
    setEditingStaff(null);

    setForm({
      staff_id: "",
      full_name: "",
      passport_number: "",
      });

    setError("");
    setFormOpen(true);
  }

  function openEditModal(person: Staff) {
    setEditingStaff(person);

    setForm({
      staff_id: person.staff_id,
      full_name: person.full_name,
      passport_number: person.passport_number || "",
    });

    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;

    setFormOpen(false);
    setEditingStaff(null);
    setError("");
  }

  async function saveStaff() {
    setError("");
    setSuccess("");

    if (!form.staff_id.trim()) {
      setError("Please enter Staff ID.");
      return;
    }

    if (!form.full_name.trim()) {
      setError("Please enter staff name.");
      return;
    }

    setSaving(true);

    try {
      if (editingStaff) {
        const { data, error: updateError } = await supabase
          .from("staff")
          .update({
            staff_id: form.staff_id.trim(),
            full_name: form.full_name.trim(),
            passport_number:
              form.passport_number.trim() || null,
          })
          .eq("id", editingStaff.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        setStaff((current) =>
          current.map((item) =>
            item.id === editingStaff.id
              ? (data as Staff)
              : item
          )
        );

        setSuccess("Staff details updated successfully.");
      } else {
        const { data, error: insertError } = await supabase
          .from("staff")
          .insert({
            staff_id: form.staff_id.trim(),
            full_name: form.full_name.trim(),
            passport_number:
              form.passport_number.trim() || null,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setStaff((current) => [data as Staff, ...current]);

        setSuccess("Staff added successfully.");
      }

      setFormOpen(false);
      setEditingStaff(null);
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save staff."
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument(
    person: Staff,
    type: "passport",
    file: File
  ) {
    setError("");
    setSuccess("");

    const validationError = validateDocument(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `staff/${person.id}`);

      const uploadResponse = await fetch("/api/r2-upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(
          uploadResult.message ||
            "Unable to upload document to Cloudflare R2."
        );
      }

      const r2Path = uploadResult.key as string;

      const oldDocument = person.passport_document;
      const updatePayload = { passport_document: r2Path };

      const { error: updateError } = await supabase
        .from("staff")
        .update(updatePayload)
        .eq("id", person.id);

      if (updateError) {
        await fetch("/api/r2-delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keys: [r2Path],
          }),
        });

        throw updateError;
      }

      if (oldDocument) {
        await fetch("/api/r2-delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keys: [oldDocument],
          }),
        });
      }

      setStaff((current) =>
        current.map((item) =>
          item.id === person.id
            ? {
                ...item,
                passport_document: r2Path,
              }
            : item
        )
      );

      setSuccess("Passport document uploaded successfully.");
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload document."
      );
    }
  }

  async function handleDocumentChange(
    event: ChangeEvent<HTMLInputElement>,
    person: Staff,
    type: "passport"
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    await uploadDocument(person, type, file);
  }

  async function viewDocument(path: string | null) {
    if (!path) return;

    try {
      setError("");

      const response = await fetch(
        `/api/r2-signed-url?key=${encodeURIComponent(path)}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to create document URL."
        );
      }

      if (result.signedUrl) {
        window.open(
          result.signedUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to open document."
      );
    }
  }

  async function deleteStaff(person: Staff) {
    const confirmed = window.confirm(
      `Delete ${person.full_name}? This will also remove their uploaded documents.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const filesToRemove = [person.passport_document].filter(
        Boolean
      ) as string[];

      if (filesToRemove.length) {
        const response = await fetch("/api/r2-delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keys: filesToRemove,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to delete staff documents from Cloudflare R2."
          );
        }
      }

      const { error: deleteError } = await supabase
        .from("staff")
        .delete()
        .eq("id", person.id);

      if (deleteError) {
        throw deleteError;
      }

      setStaff((current) =>
        current.filter((item) => item.id !== person.id)
      );

      setSuccess("Staff deleted successfully.");
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete staff."
      );
    }
  }

  const filteredStaff = staff.filter((person) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      person.full_name.toLowerCase().includes(query) ||
      person.staff_id.toLowerCase().includes(query) ||
      (person.passport_number || "")
        .toLowerCase()
        .includes(query)
    );
  });

  const passportCount = staff.filter(
    (person) => person.passport_document
  ).length;


  return (
    <main className="min-h-screen min-h-[100dvh] overflow-x-hidden bg-[#f5f7fb]">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Management Dashboard
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 sm:flex">
                  <Users size={23} />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    Staff Documents
                  </h1>

                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                    Manage staff identity and passport documents.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 sm:w-auto"
            >
              <UserPlus size={18} />
              Add Staff
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-0.5 break-words">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-700"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
            <CheckCircle2 size={18} />

            <span className="flex-1">
              {success}
            </span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-emerald-500 hover:text-emerald-700"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <StatCard
            label="Total Staff"
            value={loading ? "—" : staff.length}
            icon={<Users size={20} />}
            tone="indigo"
          />

          <StatCard
            label="Passport Documents"
            value={loading ? "—" : `${passportCount}/${staff.length}`}
            icon={<ShieldCheck size={20} />}
            tone="emerald"
          />

        </section>

        {/* Search */}
        <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search staff name, ID or passport..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <button
              type="button"
              onClick={() => void loadStaff(true)}
              disabled={refreshing}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </section>

        {/* Staff table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">
                All Staff
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {filteredStaff.length} staff member
                {filteredStaff.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} />
              Secure document storage
            </div>
          </div>

          {loading ? (
            <LoadingRows />
          ) : filteredStaff.length === 0 ? (
            <EmptyState
              search={Boolean(search.trim())}
              onAdd={openAddModal}
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1050px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">
                        Staff
                      </th>

                      <th className="px-4 py-3">
                        Staff ID
                      </th>

                      <th className="px-4 py-3">
                        Passport
                      </th>

                      <th className="px-4 py-3">
                        Documents
                      </th>

                      <th className="px-5 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((person) => (
                      <StaffRow
                        key={person.id}
                        person={person}
                        onView={viewDocument}
                        onUpload={handleDocumentChange}
                        onEdit={openEditModal}
                        onDelete={deleteStaff}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredStaff.map((person) => (
                  <MobileStaffCard
                    key={person.id}
                    person={person}
                    onView={viewDocument}
                    onUpload={handleDocumentChange}
                    onEdit={openEditModal}
                    onDelete={deleteStaff}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Add / Edit Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {editingStaff ? "Edit Staff" : "New Staff"}
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  {editingStaff
                    ? editingStaff.full_name
                    : "Add Staff Member"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="Staff ID"
                  value={form.staff_id}
                  placeholder="WG-001"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      staff_id: value,
                    }))
                  }
                />

                <FormInput
                  label="Full Name"
                  value={form.full_name}
                  placeholder="Staff full name"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      full_name: value,
                    }))
                  }
                />

                <FormInput
                  label="Passport Number"
                  value={form.passport_number}
                  placeholder="Passport number"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      passport_number: value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveStaff()}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    {editingStaff
                      ? "Update Staff"
                      : "Create Staff"}
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

/* =========================================================
   DESKTOP STAFF ROW
========================================================= */

function StaffRow({
  person,
  onView,
  onUpload,
  onEdit,
  onDelete,
}: {
  person: Staff;
  onView: (path: string | null) => Promise<void>;
  onUpload: (
    event: ChangeEvent<HTMLInputElement>,
    person: Staff,
    type: "passport"
  ) => Promise<void>;
  onEdit: (person: Staff) => void;
  onDelete: (person: Staff) => Promise<void>;
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">
            {getInitials(person.full_name)}
          </div>

          <div className="min-w-0">
            <p className="max-w-[220px] truncate text-sm font-bold text-slate-900">
              {person.full_name}
            </p>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Added {formatDate(person.created_at)}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">
          {person.staff_id}
        </span>
      </td>

      <td className="px-4 py-4">
        <DocumentCell
          number={person.passport_number}
          document={person.passport_document}
          label="Passport"
          type="passport"
          person={person}
          onView={onView}
          onUpload={onUpload}
        />
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <DocumentStatus
            uploaded={Boolean(person.passport_document)}
            label="Passport"
          />
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(person)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Pencil size={13} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => void onDelete(person)}
            className="inline-flex items-center justify-center rounded-lg border border-red-100 p-2 text-red-500 transition hover:bg-red-50"
            title="Delete staff"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE STAFF CARD
========================================================= */

function MobileStaffCard({
  person,
  onView,
  onUpload,
  onEdit,
  onDelete,
}: {
  person: Staff;
  onView: (path: string | null) => Promise<void>;
  onUpload: (
    event: ChangeEvent<HTMLInputElement>,
    person: Staff,
    type: "passport"
  ) => Promise<void>;
  onEdit: (person: Staff) => void;
  onDelete: (person: Staff) => Promise<void>;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
          {getInitials(person.full_name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-900">
                {person.full_name}
              </h3>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                ID: {person.staff_id}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MobileDocument
          title="Passport"
          number={person.passport_number}
          document={person.passport_document}
          type="passport"
          person={person}
          onView={onView}
          onUpload={onUpload}
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(person)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white"
        >
          <Pencil size={14} />
          Edit Staff
        </button>

        <button
          type="button"
          onClick={() => void onDelete(person)}
          className="inline-flex items-center justify-center rounded-xl border border-red-100 px-4 py-2.5 text-red-500"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   DOCUMENT CELL
========================================================= */

function DocumentCell({
  number,
  document,
  label,
  type,
  person,
  onView,
  onUpload,
}: {
  number: string | null;
  document: string | null;
  label: string;
  type: "passport";
  person: Staff;
  onView: (path: string | null) => Promise<void>;
  onUpload: (
    event: ChangeEvent<HTMLInputElement>,
    person: Staff,
    type: "passport"
  ) => Promise<void>;
}) {
  return (
    <div className="min-w-[170px]">
      <p className="text-xs font-bold text-slate-800">
        {number || "Number not added"}
      </p>

      <div className="mt-2">
        {document ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onView(document)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50"
            >
              <Eye size={13} />
              View
            </button>

            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
              <Upload size={13} />
              Replace

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(event) =>
                  void onUpload(event, person, type)
                }
              />
            </label>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 px-3 py-2 text-[11px] font-bold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50">
            <Upload size={13} />
            Upload {label}

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(event) =>
                void onUpload(event, person, type)
              }
            />
          </label>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MOBILE DOCUMENT
========================================================= */

function MobileDocument({
  title,
  number,
  document,
  type,
  person,
  onView,
  onUpload,
}: {
  title: string;
  number: string | null;
  document: string | null;
  type: "passport";
  person: Staff;
  onView: (path: string | null) => Promise<void>;
  onUpload: (
    event: ChangeEvent<HTMLInputElement>,
    person: Staff,
    type: "passport"
  ) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>

        {document ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
            <CheckCircle2 size={11} />
            Uploaded
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">
            Pending
          </span>
        )}
      </div>

      <p className="mt-2 text-sm font-bold text-slate-800">
        {number || "Number not added"}
      </p>

      <div className="mt-3">
        {document ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void onView(document)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-indigo-600"
            >
              <Eye size={14} />
              View
            </button>

            <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600">
              <Upload size={14} />
              Replace

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(event) =>
                  void onUpload(event, person, type)
                }
              />
            </label>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-white px-3 py-3 text-xs font-bold text-indigo-700">
            <Upload size={15} />
            Upload {title}

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(event) =>
                void onUpload(event, person, type)
              }
            />
          </label>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   DOCUMENT STATUS
========================================================= */

function DocumentStatus({
  uploaded,
  label,
}: {
  uploaded: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${
        uploaded
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {uploaded ? (
        <CheckCircle2 size={11} />
      ) : (
        <Upload size={10} />
      )}

      {label}
    </span>
  );
}

/* =========================================================
   FORM INPUT
========================================================= */

function FormInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: "indigo" | "emerald" | "amber";
}) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

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

/* =========================================================
   LOADING
========================================================= */

function LoadingRows() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="h-20 animate-pulse rounded-2xl bg-slate-100"
        />
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  search,
  onAdd,
}: {
  search: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {search ? (
          <Search size={24} />
        ) : (
          <UserPlus size={24} />
        )}
      </div>

      <h3 className="mt-4 font-bold text-slate-900">
        {search
          ? "No matching staff found"
          : "No staff added yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {search
          ? "Try a different name, Staff ID or passport number."
          : "Add your first staff member to start managing documents."}
      </p>

      {!search && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus size={16} />
          Add Staff
        </button>
      )}
    </div>
  );
}