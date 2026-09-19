"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  X,
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

type FileState = File | null;

export default function EditCandidatePage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  // Existing documents
  const [existingPassport, setExistingPassport] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [existingCv, setExistingCv] = useState<string | null>(null);
  const [existingOffer, setExistingOffer] = useState<string | null>(null);
  const [existingContract, setExistingContract] = useState<string | null>(null);
  const [existingInvitation, setExistingInvitation] = useState<string | null>(null);
  const [existingVisa, setExistingVisa] = useState<string | null>(null);
  const [existingTicket, setExistingTicket] = useState<string | null>(null);
  const [existingMedical, setExistingMedical] = useState<string | null>(null);
  const [existingInsurance, setExistingInsurance] = useState<string | null>(null);
  const [existingOther, setExistingOther] = useState<string | null>(null);

  // New documents
  const [passportFile, setPassportFile] = useState<FileState>(null);
  const [photoFile, setPhotoFile] = useState<FileState>(null);
  const [cvFile, setCvFile] = useState<FileState>(null);
  const [offerLetterFile, setOfferLetterFile] = useState<FileState>(null);
  const [contractFile, setContractFile] = useState<FileState>(null);
  const [invitationFile, setInvitationFile] = useState<FileState>(null);
  const [visaFile, setVisaFile] = useState<FileState>(null);
  const [ticketFile, setTicketFile] = useState<FileState>(null);
  const [medicalFile, setMedicalFile] = useState<FileState>(null);
  const [insuranceFile, setInsuranceFile] = useState<FileState>(null);
  const [otherFile, setOtherFile] = useState<FileState>(null);

  useEffect(() => {
    if (id) {
      fetchCandidate();
    }
  }, [id]);

  async function fetchCandidate() {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("job_candidates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("Candidate not found.");
      }

      setFullName(data.full_name || "");
      setFatherName(data.father_name || "");
      setDob(data.date_of_birth || "");
      setMobile(data.mobile || "");
      setWhatsapp(data.whatsapp || "");
      setEmail(data.email || "");
      setAddress(data.address || "");
      setCity(data.city || "");
      setState(data.state || "");

      setPassportNumber(data.passport_number || "");
      setPassportExpiry(data.passport_expiry || "");

      setCountry(data.country || "Russia");
      setJobPosition(data.job_position || "");
      setEmployerName(data.employer_name || "");
      setSalary(
        data.salary !== null && data.salary !== undefined
          ? String(data.salary)
          : ""
      );
      setSalaryCurrency(data.salary_currency || "RUB");
      setContractDuration(data.contract_duration || "");
      setJobLocation(data.job_location || "");
      setJoiningDate(data.joining_date || "");
      setStatus(data.status || "New Lead");

      setVisaType(data.visa_type || "");
      setVisaNumber(data.visa_number || "");
      setVisaValidTill(data.visa_valid_till || "");
      setGoingDate(data.going_date || "");
      setReturnDate(data.return_date || "");
      setFlightNumber(data.flight_number || "");
      setDepartureAirport(data.departure_airport || "");
      setArrivalAirport(data.arrival_airport || "");

      setRegistrationFee(
        data.registration_fee !== null
          ? String(data.registration_fee)
          : ""
      );

      setVisaFee(
        data.visa_fee !== null
          ? String(data.visa_fee)
          : ""
      );

      setTicketAmount(
        data.ticket_amount !== null
          ? String(data.ticket_amount)
          : ""
      );

      setOtherCharges(
        data.other_charges !== null
          ? String(data.other_charges)
          : ""
      );

      setAmountPaid(
        data.amount_paid !== null
          ? String(data.amount_paid)
          : ""
      );

      setPaymentCurrency(data.payment_currency || "INR");
      setLastPaymentDate(data.last_payment_date || "");
      setPaymentMethod(data.payment_method || "");

      setExistingPassport(data.passport_file || null);
      setExistingPhoto(data.photo_file || null);
      setExistingCv(data.cv_file || null);
      setExistingOffer(data.offer_letter_file || null);
      setExistingContract(data.contract_file || null);
      setExistingInvitation(data.invitation_file || null);
      setExistingVisa(data.visa_file || null);
      setExistingTicket(data.ticket_file || null);
      setExistingMedical(data.medical_file || null);
      setExistingInsurance(data.insurance_file || null);
      setExistingOther(data.other_file || null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load candidate.");
    } finally {
      setLoading(false);
    }
  }

  const totalAmount =
    Number(registrationFee || 0) +
    Number(visaFee || 0) +
    Number(ticketAmount || 0) +
    Number(otherCharges || 0);

  const balanceAmount =
    totalAmount - Number(amountPaid || 0);

  async function uploadFile(
    file: File | null,
    folder: string
  ) {
    if (!file) return null;

    const extension =
      file.name.split(".").pop() || "file";

    const fileName = `${folder}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("candidate-documents")
      .upload(fileName, file);

    if (error) throw error;

    return fileName;
  }

  async function replaceDocument(
    newFile: File | null,
    oldFile: string | null,
    folder: string
  ) {
    if (!newFile) {
      return oldFile;
    }

    const uploaded = await uploadFile(
      newFile,
      folder
    );

    if (oldFile) {
      await supabase.storage
        .from("candidate-documents")
        .remove([oldFile]);
    }

    return uploaded;
  }

  async function updateCandidate(
    e: React.FormEvent
  ) {
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
      setSaving(true);
      setError("");

      const updatedPassport = await replaceDocument(
        passportFile,
        existingPassport,
        "passport"
      );

      const updatedPhoto = await replaceDocument(
        photoFile,
        existingPhoto,
        "photo"
      );

      const updatedCv = await replaceDocument(
        cvFile,
        existingCv,
        "cv"
      );

      const updatedOffer = await replaceDocument(
        offerLetterFile,
        existingOffer,
        "offer-letter"
      );

      const updatedContract = await replaceDocument(
        contractFile,
        existingContract,
        "contract"
      );

      const updatedInvitation = await replaceDocument(
        invitationFile,
        existingInvitation,
        "invitation"
      );

      const updatedVisa = await replaceDocument(
        visaFile,
        existingVisa,
        "visa"
      );

      const updatedTicket = await replaceDocument(
        ticketFile,
        existingTicket,
        "ticket"
      );

      const updatedMedical = await replaceDocument(
        medicalFile,
        existingMedical,
        "medical"
      );

      const updatedInsurance = await replaceDocument(
        insuranceFile,
        existingInsurance,
        "insurance"
      );

      const updatedOther = await replaceDocument(
        otherFile,
        existingOther,
        "other"
      );

      const { error } = await supabase
        .from("job_candidates")
        .update({
          full_name: fullName,
          father_name: fatherName || null,
          date_of_birth: dob || null,
          mobile,
          whatsapp: whatsapp || null,
          email: email || null,
          address: address || null,
          city: city || null,
          state: state || null,

          passport_number:
            passportNumber || null,
          passport_expiry:
            passportExpiry || null,

          country,
          job_position:
            jobPosition || null,
          employer_name:
            employerName || null,

          salary: salary
            ? Number(salary)
            : null,

          salary_currency:
            salaryCurrency,

          contract_duration:
            contractDuration || null,

          job_location:
            jobLocation || null,

          joining_date:
            joiningDate || null,

          status,

          visa_type:
            visaType || null,

          visa_number:
            visaNumber || null,

          visa_valid_till:
            visaValidTill || null,

          going_date:
            goingDate || null,

          return_date:
            returnDate || null,

          flight_number:
            flightNumber || null,

          departure_airport:
            departureAirport || null,

          arrival_airport:
            arrivalAirport || null,

          registration_fee:
            registrationFee
              ? Number(registrationFee)
              : null,

          visa_fee:
            visaFee
              ? Number(visaFee)
              : null,

          ticket_amount:
            ticketAmount
              ? Number(ticketAmount)
              : null,

          other_charges:
            otherCharges
              ? Number(otherCharges)
              : null,

          total_amount:
            totalAmount,

          amount_paid:
            amountPaid
              ? Number(amountPaid)
              : 0,

          balance_amount:
            balanceAmount,

          payment_currency:
            paymentCurrency,

          last_payment_date:
            lastPaymentDate || null,

          payment_method:
            paymentMethod || null,

          passport_file:
            updatedPassport,

          photo_file:
            updatedPhoto,

          cv_file:
            updatedCv,

          offer_letter_file:
            updatedOffer,

          contract_file:
            updatedContract,

          invitation_file:
            updatedInvitation,

          visa_file:
            updatedVisa,

          ticket_file:
            updatedTicket,

          medical_file:
            updatedMedical,

          insurance_file:
            updatedInsurance,

          other_file:
            updatedOther,

          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      router.push("/candidates");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Unable to update candidate."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Loading candidate...
        </div>
      </main>
    );
  }

  if (error && !fullName) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">

          <h2 className="font-bold text-red-600">
            Unable to load candidate
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() =>
              router.push("/candidates")
            }
            className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Candidates
          </button>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">

          <button
            type="button"
            onClick={() =>
              router.push("/candidates")
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white sm:h-11 sm:w-11">
            <BriefcaseBusiness size={21} />
          </div>

          <div>
            <h1 className="text-base font-bold sm:text-lg">
              Edit Candidate
            </h1>

            <p className="max-w-[calc(100vw-7rem)] truncate text-xs text-slate-500 sm:max-w-none">
              {fullName} • World Global Manpower Pvt. Ltd.
            </p>
          </div>

        </div>

      </header>

      <form
        onSubmit={updateCandidate}
        className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8"
      >

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700 sm:mb-6">
            {error}
          </div>
        )}

        {/* PERSONAL */}
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
              placeholder="Full address"
            />
          </div>

        </Section>

        {/* PASSPORT */}
        <Section
          icon={<FileText size={20} />}
          title="Passport Details"
          description="Candidate passport information"
        >

          <Input
            label="Passport Number"
            value={passportNumber}
            onChange={setPassportNumber}
            placeholder="Passport number"
          />

          <Input
            label="Passport Expiry"
            type="date"
            value={passportExpiry}
            onChange={setPassportExpiry}
          />

        </Section>

        {/* JOB */}
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
            placeholder="Welder / Electrician"
          />

          <Input
            label="Employer / Company"
            value={employerName}
            onChange={setEmployerName}
            placeholder="Employer name"
          />

          <Input
            label="Salary"
            type="number"
            value={salary}
            onChange={setSalary}
            placeholder="Salary"
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

        {/* VISA / TRAVEL */}
        <Section
          icon={<Plane size={20} />}
          title="Visa & Travel"
          description="Visa and flight information"
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

        {/* PAYMENT */}
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

          <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">

            <SummaryBox
              label="Total Amount"
              value={`${paymentCurrency} ${totalAmount.toLocaleString(
                "en-IN"
              )}`}
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

        {/* DOCUMENTS */}
        <Section
          icon={<Upload size={20} />}
          title="Candidate Documents"
          description="Upload a new file only when you want to replace the existing document"
        >

          <EditFileInput
            label="Passport"
            existing={existingPassport}
            file={passportFile}
            onChange={setPassportFile}
          />

          <EditFileInput
            label="Photo"
            existing={existingPhoto}
            file={photoFile}
            onChange={setPhotoFile}
          />

          <EditFileInput
            label="CV / Resume"
            existing={existingCv}
            file={cvFile}
            onChange={setCvFile}
          />

          <EditFileInput
            label="Job Offer Letter"
            existing={existingOffer}
            file={offerLetterFile}
            onChange={setOfferLetterFile}
          />

          <EditFileInput
            label="Employment Contract"
            existing={existingContract}
            file={contractFile}
            onChange={setContractFile}
          />

          <EditFileInput
            label="Invitation Letter"
            existing={existingInvitation}
            file={invitationFile}
            onChange={setInvitationFile}
          />

          <EditFileInput
            label="Visa"
            existing={existingVisa}
            file={visaFile}
            onChange={setVisaFile}
          />

          <EditFileInput
            label="Flight Ticket"
            existing={existingTicket}
            file={ticketFile}
            onChange={setTicketFile}
          />

          <EditFileInput
            label="Medical"
            existing={existingMedical}
            file={medicalFile}
            onChange={setMedicalFile}
          />

          <EditFileInput
            label="Insurance"
            existing={existingInsurance}
            file={insuranceFile}
            onChange={setInsuranceFile}
          />

          <EditFileInput
            label="Other Document"
            existing={existingOther}
            file={otherFile}
            onChange={setOtherFile}
          />

        </Section>

        {/* ACTIONS */}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:mt-6 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() =>
              router.push("/candidates")
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99] sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Updating Candidate...
              </>
            ) : (
              <>
                <Save size={18} />
                Update Candidate
              </>
            )}
          </button>

        </div>

      </form>
    </main>
  );
}

/* ================= COMPONENTS ================= */

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
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mb-6">

      <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-4 sm:items-center sm:px-6 sm:py-5">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 sm:h-10 sm:w-10">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-bold sm:text-base">
            {title}
          </h2>

          <p className="text-[11px] leading-4 text-slate-500 sm:text-xs">
            {description}
          </p>
        </div>

      </div>

      <div className="grid gap-4 p-4 sm:gap-5 sm:p-6 md:grid-cols-2">
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
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white sm:px-4"
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
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full min-w-0 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white sm:px-4"
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
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white sm:px-4"
      >

        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

    </label>
  );
}

function EditFileInput({
  label,
  existing,
  file,
  onChange,
}: {
  label: string;
  existing: string | null;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>

      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <label className="block cursor-pointer">

        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 hover:bg-slate-100 sm:px-4">

          <Upload
            size={18}
            className="text-slate-500"
          />

          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-medium text-slate-700">
              {file
                ? file.name
                : existing
                ? "Existing document uploaded"
                : "Choose document"}
            </p>

            <p className="text-xs text-slate-400">
              {file
                ? "New file selected"
                : existing
                ? "Select a new file to replace it"
                : "PDF, JPG, PNG"}
            </p>

          </div>

        </div>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) =>
            onChange(
              e.target.files?.[0] || null
            )
          }
        />

      </label>

      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 flex items-center gap-1 text-xs text-red-600 hover:underline"
        >
          <X size={12} />
          Remove new file
        </button>
      )}

    </div>
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
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-base font-bold sm:text-lg ${
          danger
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}