"use client";
import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "@/components/AuthContext";

export default function RegisterProfilePage() {
  const [form, setForm] = useState({
    email: "",
    phoneNumber: "",
    secondaryPhoneNumber: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    lastName: "",
    ssnLast4: "",
    hasLicense: false,
    licenseNumber: "",
    birthDate: "",
    sex: "M",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [birthDateObj, setBirthDateObj] = useState<Date | null>(null);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();
  const [showInvalidModal, setShowInvalidModal] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === "hasLicense" && type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({
        ...form,
        hasLicense: checked,
        licenseNumber: checked ? form.licenseNumber : "",
      });
    } else if (name === "sex") {
      setForm({ ...form, sex: value });
    } else if (name === "birthDate") {
      setForm({ ...form, birthDate: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleDateChange = (date: Date | null) => {
    setBirthDateObj(date);
    setForm({
      ...form,
      birthDate: date ? date.toISOString().split("T")[0] : "",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA.");
      setLoading(false);
      return;
    }
    const requiredFields = [
      "email",
      "phoneNumber",
      "secondaryPhoneNumber",
      "password",
      "confirmPassword",
      "firstName",
      "middleName",
      "lastName",
      "ssnLast4",
      "birthDate",
      "sex",
    ];
    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        setError(`Please fill in the ${field} field.`);
        setLoading(false);
        return;
      }
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      const payload = { ...form, recaptchaToken };
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error sending verification code");
        setLoading(false);
        return;
      }
      setStep("verify");
      setLoading(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError("Error sending verification code: " + errorMessage);
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShowInvalidModal(true);
        setLoading(false);
        return;
      }
      setUser({
        _id: data.user._id,
        name:
          data.user.firstName +
          (data.user.lastName ? " " + data.user.lastName : ""),
        email: data.user.email,
        photo: data.user.photo || null,
        type: "student",
      });
      router.replace("/");
    } catch (error: unknown) {
      setError(
        "Verification failed: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-2xl w-full bg-white p-10 rounded-2xl shadow-2xl border border-blue-100 mt-16">
        <h2 className="text-center text-2xl font-extrabold text-blue-700 mb-8 drop-shadow-lg tracking-wide mt-8">
          Sign Up & Complete Your Profile
        </h2>
        {step === "form" && (
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={handleSubmit}
          >
            {/* Email ocupa dos columnas */}
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="col-span-1 md:col-span-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            {/* Phone Numbers ocupan dos columnas */}
            <input
              name="phoneNumber"
              placeholder="Phone Number 1"
              value={form.phoneNumber || ""}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            <input
              name="secondaryPhoneNumber"
              placeholder="Phone Number 2"
              value={form.secondaryPhoneNumber || ""}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            {/* Password y Confirm Password */}
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            {/* First and Middle Name */}
            <input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            <input
              name="middleName"
              placeholder="Middle Name"
              value={form.middleName}
              onChange={handleChange}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            {/* Last Name and SSN */}
            <input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            <input
              name="ssnLast4"
              placeholder="SSN Last 4"
              value={form.ssnLast4}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            {/* Birth Date */}
            {/* License Checkbox and License Number */}
            <div className="flex items-center gap-2 col-span-1">
              <input
                id="hasLicense"
                name="hasLicense"
                type="checkbox"
                checked={form.hasLicense}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="hasLicense"
                className="text-gray-700 font-medium select-none cursor-pointer"
              >
                With License
              </label>
            </div>
            <input
              name="licenseNumber"
              placeholder="License Number"
              value={form.licenseNumber}
              onChange={handleChange}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              disabled={!form.hasLicense}
            />
            {/* Birth Date and Sex */}
            <div>
              <DatePicker
                selected={birthDateObj}
                onChange={handleDateChange}
                dateFormat="MM/dd/yyyy"
                placeholderText="Birth Date"
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900 w-full"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
                isClearable
                required
                locale="en"
              />
            </div>
            <select
              name="sex"
              value={form.sex}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900 bg-white"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
            {/* Google reCAPTCHA */}
            <div className="col-span-1 md:col-span-2 flex justify-center mt-2">
              <ReCAPTCHA
                sitekey={
                  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                  "YOUR_RECAPTCHA_SITE_KEY"
                }
                onChange={(token) => setRecaptchaToken(token)}
              />
            </div>
            {/* Error message (ocupa dos columnas) */}
            {error && (
              <div className="col-span-1 md:col-span-2 text-red-600 text-center mt-2">
                {error}
              </div>
            )}
            {/* Register button (ocupa dos columnas) */}
            <button
              type="submit"
              disabled={loading}
              className="col-span-1 md:col-span-2 w-full py-3 mt-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}
        {step === "verify" && (
          <form className="flex flex-col gap-6" onSubmit={handleVerify}>
            <div className="text-center text-gray-700 mb-2">
              A verification code was sent to <b>{form.email}</b>. Please enter
              it below.
            </div>
            <input
              type="text"
              placeholder="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-center tracking-widest text-xl font-mono"
              maxLength={6}
              required
              autoFocus
            />
            {error && <div className="text-red-600 text-center">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md mt-2"
            >
              {loading ? "Verifying..." : "Verify & Register"}
            </button>
          </form>
        )}
        {showInvalidModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl border-2 border-red-600 text-center max-w-md w-full">
              <div className="flex flex-col items-center">
                <svg
                  className="w-16 h-16 text-red-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="white"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 9l-6 6M9 9l6 6"
                  />
                </svg>
                <h3 className="text-2xl font-bold mb-2 text-black">
                  Invalid Code
                </h3>
                <p className="mb-6 text-black">
                  The verification code is incorrect or expired. Please try
                  again.
                </p>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow transition"
                  onClick={() => setShowInvalidModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
