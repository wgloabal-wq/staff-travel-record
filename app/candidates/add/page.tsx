"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  BriefcaseBusiness,
  Plane,
  CreditCard,
  FileText,
  Upload,
  Save,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const currencies = ["INR", "RUB", "USD", "EUR", "GBP", "BYN"];

const statuses = [
  "New Lead",
  "Documents Pending",
  "Documents Verified",
  "Job Selected",
  "Offer Letter",
  "Contract Signed",
  "Visa Processing",
  "Visa Approved",
  "Ticket Booked",
  "Travelled",
  "Working in Russia",
  "Completed",
  "Rejected",
];

export default function AddCandidatePage() {
  const router = useRouter();

  // Personal
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Passport
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");

  // Job
  const [country, setCountry] = useState("Russia");
  const [jobPosition, setJobPosition] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [salary, setSalary] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("RUB");
  const [contractDuration, setContractDuration] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [status, setStatus] = useState("New Lead");

  // Visa / Travel
  const [visaType, setVisaType] = useState("");
  const [visaNumber, setVisaNumber] = useState("");
  const [visaValidTill, setVisaValidTill] = useState("");
  const [goingDate, setGoingDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [departureAirport, setDepartureAirport] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");

  // Payment
  const [registrationFee, setRegistrationFee] = useState("");
  const [visaFee, setVisaFee] = useState("");
  const [ticketAmount, setTicketAmount] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("INR");
  const [lastPaymentDate, setLastPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Documents
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [invitationFile, setInvitationFile] = useState<File | null>(null);
  const [visaFile, setVisaFile] = useState<File | null>(null);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [otherFile, setOtherFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalAmount =
    Number(registrationFee || 0) +
    Number(visaFee || 0) +
    Number(ticketAmount || 0) +
    Number(otherCharges || 0);

  const balanceAmount =
    totalAmount - Number(amountPaid || 0);

  async function uploadFile(file: File | null, folder: string) {
    if (!file) return null;

    const extension = file.name.split(".").pop() || "file";

    const fileName = `${folder}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("candidate-documents")
      .upload(fileName, file);

    if (error) throw error;

    return fileName;
  }

  async function saveCandidate(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("Full Name is required.");
      return;
    }

    if (!mobile.trim()) {
      setError("Mobile Number is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Upload documents
      const uploadedPassport = await uploadFile(
        passportFile,
        "passport"
      );

      const uploadedPhoto = await uploadFile(
        photoFile,
        "photo"
      );

      const uploadedCv = await uploadFile(
        cvFile,
        "cv"
      );

      const uploadedOffer = await uploadFile(
        offerLetterFile,
        "offer-letter"
      );

      const uploadedContract = await uploadFile(
        contractFile,
        "contract"
      );

      const uploadedInvitation = await uploadFile(
        invitationFile,
        "invitation"
      );

      const uploadedVisa = await uploadFile(
        visaFile,
        "visa"
      );

      const uploadedTicket = await uploadFile(
        ticketFile,
        "ticket"
      );

      const uploadedMedical = await uploadFile(
        medicalFile,
        "medical"
      );

      const uploadedInsurance = await uploadFile(
        insuranceFile,
        "insurance"
      );

      const uploadedOther = await uploadFile(
        otherFile,
        "other"
      );

      const { error: insertError } = await supabase
        .from("job_candidates")
        .insert({
          full_name: fullName,
          father_name: fatherName || null,
          date_of_birth: dob || null,
          mobile,
          whatsapp: whatsapp || null,
          email: email || null,
          address: address || null,
          city: city || null,
          state: state || null,

          passport_number: passportNumber || null,
          passport_expiry: passportExpiry || null,

          country,
          job_position: jobPosition || null,
          employer_name: employerName || null,
          salary: salary ? Number(salary) : null,
          salary_currency: salaryCurrency,
          contract_duration: contractDuration || null,
          job_location: jobLocation || null,
          joining_date: joiningDate || null,
          status,

          visa_type: visaType || null,
          visa_number: visaNumber || null,
          visa_valid_till: visaValidTill || null,
          going_date: goingDate || null,
          return_date: returnDate || null,
          flight_number: flightNumber || null,
          departure_airport: departureAirport || null,
          arrival_airport: arrivalAirport || null,

          registration_fee: registrationFee
            ? Number(registrationFee)
            : null,

          visa_fee: visaFee
            ? Number(visaFee)
            : null,

          ticket_amount: ticketAmount
            ? Number(ticketAmount)
            : null,

          other_charges: otherCharges
            ? Number(otherCharges)
            : null,

          total_amount: totalAmount,
          amount_paid: amountPaid
            ? Number(amountPaid)
            : 0,

          balance_amount: balanceAmount,

          payment_currency: paymentCurrency,
          last_payment_date: lastPaymentDate || null,
          payment_method: paymentMethod || null,

          passport_file: uploadedPassport,
          photo_file: uploadedPhoto,
          cv_file: uploadedCv,
          offer_letter_file: uploadedOffer,
          contract_file: uploadedContract,
          invitation_file: uploadedInvitation,
          visa_file: uploadedVisa,
          ticket_file: uploadedTicket,
          medical_file: uploadedMedical,
          insurance_file: uploadedInsurance,
          other_file: uploadedOther,
        });

      if (insertError) {
        throw insertError;
      }

      router.push("/candidates");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Unable to save candidate."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">

          <button
            onClick={() => router.push("/candidates")}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-lg font-bold">
              Add Job Candidate
            </h1>

            <p className="text-xs text-slate-500">
              World Global Manpower Pvt. Ltd.
            </p>
          </div>

        </div>
      </header>

      <form
        onSubmit={saveCandidate}
        className="mx-auto max-w-6xl px-6 py-8"
      >

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Personal Details */}
        <Section
          icon={<UserRound size={20} />}
          title="Personal Details"
          description="Candidate basic information"
        >

          <Input
            label="Full Name *"
            value={fullName}
            onChange={setFullName}
            placeholder="Enter full name"
          />

          <Input
            label="Father's Name"
            value={fatherName}
            onChange={setFatherName}
            placeholder="Enter father's name"
          />

          <Input
            label="Date of Birth"
            type="date"
            value={dob}
            onChange={setDob}
          />

          <Input
            label="Mobile Number *"
            value={mobile}
            onChange={setMobile}
            placeholder="+91 XXXXX XXXXX"
          />

          <Input
            label="WhatsApp Number"
            value={whatsapp}
            onChange={setWhatsapp}
            placeholder="+91 XXXXX XXXXX"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="candidate@email.com"
          />

          <Input
            label="City"
            value={city}
            onChange={setCity}
            placeholder="City"
          />

          <Input
            label="State"
            value={state}
            onChange={setState}
            placeholder="State"
          />

          <div className="md:col-span-2">
            <Textarea
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="Full residential address"
            />
          </div>

        </Section>

        {/* Passport */}
        <Section
          icon={<FileText size={20} />}
          title="Passport Details"
          description="Candidate passport information"
        >

          <Input
            label="Passport Number"
            value={passportNumber}
            onChange={setPassportNumber}
            placeholder="Enter passport number"
          />

          <Input
            label="Passport Expiry"
            type="date"
            value={passportExpiry}
            onChange={setPassportExpiry}
          />

        </Section>

        {/* Job Details */}
        <Section
          icon={<BriefcaseBusiness size={20} />}
          title="Job Details"
          description="Employment and job information"
        >

          <Input
            label="Country"
            value={country}
            onChange={setCountry}
            placeholder="Russia"
          />

          <Input
            label="Job Position"
            value={jobPosition}
            onChange={setJobPosition}
            placeholder="Welder / Electrician / Driver"
          />

          <Input
            label="Employer / Company"
            value={employerName}
            onChange={setEmployerName}
            placeholder="Russian employer name"
          />

          <Input
            label="Salary"
            type="number"
            value={salary}
            onChange={setSalary}
            placeholder="Enter salary"
          />

          <Select
            label="Salary Currency"
            value={salaryCurrency}
            onChange={setSalaryCurrency}
            options={currencies}
          />

          <Input
            label="Contract Duration"
            value={contractDuration}
            onChange={setContractDuration}
            placeholder="1 Year / 2 Years"
          />

          <Input
            label="Job Location"
            value={jobLocation}
            onChange={setJobLocation}
            placeholder="Moscow"
          />

          <Input
            label="Joining Date"
            type="date"
            value={joiningDate}
            onChange={setJoiningDate}
          />

          <Select
            label="Candidate Status"
            value={status}
            onChange={setStatus}
            options={statuses}
          />

        </Section>

        {/* Visa & Travel */}
        <Section
          icon={<Plane size={20} />}
          title="Visa & Travel"
          description="Visa and flight details"
        >

          <Input
            label="Visa Type"
            value={visaType}
            onChange={setVisaType}
            placeholder="Work Visa"
          />

          <Input
            label="Visa Number"
            value={visaNumber}
            onChange={setVisaNumber}
            placeholder="Visa number"
          />

          <Input
            label="Visa Valid Till"
            type="date"
            value={visaValidTill}
            onChange={setVisaValidTill}
          />

          <Input
            label="Going Date"
            type="date"
            value={goingDate}
            onChange={setGoingDate}
          />

          <Input
            label="Return Date"
            type="date"
            value={returnDate}
            onChange={setReturnDate}
          />

          <Input
            label="Flight Number"
            value={flightNumber}
            onChange={setFlightNumber}
            placeholder="SU123"
          />

          <Input
            label="Departure Airport"
            value={departureAirport}
            onChange={setDepartureAirport}
            placeholder="Delhi"
          />

          <Input
            label="Arrival Airport"
            value={arrivalAirport}
            onChange={setArrivalAirport}
            placeholder="Moscow"
          />

        </Section>

        {/* Payments */}
        <Section
          icon={<CreditCard size={20} />}
          title="Payment Details"
          description="Candidate fees and payment tracking"
        >

          <Select
            label="Payment Currency"
            value={paymentCurrency}
            onChange={setPaymentCurrency}
            options={currencies}
          />

          <Input
            label="Registration Fee"
            type="number"
            value={registrationFee}
            onChange={setRegistrationFee}
            placeholder="0"
          />

          <Input
            label="Visa Fee"
            type="number"
            value={visaFee}
            onChange={setVisaFee}
            placeholder="0"
          />

          <Input
            label="Ticket Amount"
            type="number"
            value={ticketAmount}
            onChange={setTicketAmount}
            placeholder="0"
          />

          <Input
            label="Other Charges"
            type="number"
            value={otherCharges}
            onChange={setOtherCharges}
            placeholder="0"
          />

          <Input
            label="Amount Paid"
            type="number"
            value={amountPaid}
            onChange={setAmountPaid}
            placeholder="0"
          />

          <Input
            label="Last Payment Date"
            type="date"
            value={lastPaymentDate}
            onChange={setLastPaymentDate}
          />

          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={[
              "Cash",
              "Bank Transfer",
              "UPI",
              "Card",
              "Other",
            ]}
            placeholder="Select method"
          />

          {/* Payment Summary */}
          <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">

            <SummaryBox
              label="Total Amount"
              value={`${paymentCurrency} ${totalAmount.toLocaleString("en-IN")}`}
            />

            <SummaryBox
              label="Amount Paid"
              value={`${paymentCurrency} ${Number(
                amountPaid || 0
              ).toLocaleString("en-IN")}`}
            />

            <SummaryBox
              label="Balance"
              value={`${paymentCurrency} ${balanceAmount.toLocaleString(
                "en-IN"
              )}`}
              danger={balanceAmount > 0}
            />

          </div>

        </Section>

        {/* Documents */}
        <Section
          icon={<Upload size={20} />}
          title="Candidate Documents"
          description="Upload candidate documents"
        >

          <FileInput
            label="Passport"
            file={passportFile}
            onChange={setPassportFile}
          />

          <FileInput
            label="Photo"
            file={photoFile}
            onChange={setPhotoFile}
          />

          <FileInput
            label="CV / Resume"
            file={cvFile}
            onChange={setCvFile}
          />

          <FileInput
            label="Job Offer Letter"
            file={offerLetterFile}
            onChange={setOfferLetterFile}
          />

          <FileInput
            label="Employment Contract"
            file={contractFile}
            onChange={setContractFile}
          />

          <FileInput
            label="Invitation Letter"
            file={invitationFile}
            onChange={setInvitationFile}
          />

          <FileInput
            label="Visa"
            file={visaFile}
            onChange={setVisaFile}
          />

          <FileInput
            label="Flight Ticket"
            file={ticketFile}
            onChange={setTicketFile}
          />

          <FileInput
            label="Medical"
            file={medicalFile}
            onChange={setMedicalFile}
          />

          <FileInput
            label="Insurance"
            file={insuranceFile}
            onChange={setInsuranceFile}
          />

          <FileInput
            label="Other Document"
            file={otherFile}
            onChange={setOtherFile}
          />

        </Section>

        {/* Bottom Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() => router.push("/candidates")}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving Candidate...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Candidate
              </>
            )}
          </button>

        </div>

      </form>
    </main>
  );
}

/* ---------------- Components ---------------- */

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>

        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="text-xs text-slate-500">
            {description}
          </p>
        </div>

      </div>

      <div className="grid gap-5 p-6 md:grid-cols-2">
        {children}
      </div>

    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FileInput({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="block cursor-pointer">

      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 hover:bg-slate-100">

        <Upload size={18} className="text-slate-500" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-700">
            {file ? file.name : "Choose document"}
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
          onChange(e.target.files?.[0] || null)
        }
      />

    </label>
  );
}

function SummaryBox({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <p
        className={`mt-1 text-lg font-bold ${
          danger ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}