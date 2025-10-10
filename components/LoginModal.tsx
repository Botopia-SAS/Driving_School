import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  onLoginSuccess?: (user: {
    _id: string;
    name: string;
    email: string;
    photo?: string | null;
    type?: "student" | "instructor";
  }) => void;
}

export default function LoginModal({
  open,
  onClose,
  initialMode = "login",
  onLoginSuccess,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<
    | "login"
    | "verify"
    | "reset-email"
    | "reset-code"
    | "reset-password"
    | "reset-success"
  >("login");
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Para reset
  const [resetEmail, setResetEmail] = useState("");
  const [resetRecaptchaToken, setResetRecaptchaToken] = useState<string | null>(
    null
  );
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPassword2, setResetPassword2] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Estados para el registro
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    secondaryPhoneNumber: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    hasLicense: false,
    licenseNumber: "",
    sex: "M",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [registerStep, setRegisterStep] = useState<
    "credentials" | "personal" | "verify"
  >("credentials");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailValidationMessage, setEmailValidationMessage] = useState("");
  const [emailCheckTimeout, setEmailCheckTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Función para resetear todos los estados del modal
  const resetAllStates = () => {
    // Reset login states
    setEmail("");
    setPassword("");
    setError("");
    setLoading(false);
    setStep("login");
    setMode("login");

    // Reset register states
    setRegisterForm({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      middleName: "",
      lastName: "",
      secondaryPhoneNumber: "",
      phoneNumber: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      hasLicense: false,
      licenseNumber: "",
      sex: "M",
    });
    setRegisterError("");
    setRegisterLoading(false);
    setIsResending(false);
    setRegisterStep("credentials");
    setVerificationCode("");
    setEmailValidationMessage("");

    // Reset password reset states
    setResetEmail("");
    setResetCode("");
    setResetPassword("");
    setResetPassword2("");
    setResetError("");
    setResetSuccess("");
    setResetLoading(false);

    // Clear email check timeout
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
      setEmailCheckTimeout(null);
    }

    setIsTransitioning(false);
  };

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Try again.");
        setLoading(false);
        return;
      }
      // Login exitoso (sin 2FA) - limpiar estados antes de cerrar
      setLoading(false);
      resetAllStates();
      if (onLoginSuccess) onLoginSuccess(data.user);
      onClose();
    } catch {
      setError("Login failed. Try again.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetAllStates();
    onClose();
  };

  // --- RESET PASSWORD FLOW ---
  const handleResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");
    if (!resetRecaptchaToken) {
      setResetError("Please complete the reCAPTCHA.");
      setResetLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          recaptchaToken: resetRecaptchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Could not send code. Try again.");
        setResetLoading(false);
        return;
      }
      setStep("reset-code");
      setResetSuccess("A code was sent to your email.");
    } catch {
      setResetError("Could not send code. Try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    // Solo pasar al siguiente paso, la verificación real es al cambiar la clave
    setStep("reset-password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");
    if (resetPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      setResetLoading(false);
      return;
    }
    if (resetPassword !== resetPassword2) {
      setResetError("Passwords do not match.");
      setResetLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/verify-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          password: resetPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Could not reset password.");
        setResetLoading(false);
        return;
      }
      setResetSuccess("Password changed successfully! You can now log in.");
      setStep("reset-success");
    } catch {
      setResetError("Could not reset password. Try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetBackToLogin = () => {
    setStep("login");
    setResetEmail("");
    setResetCode("");
    setResetPassword("");
    setResetPassword2("");
    setResetError("");
    setResetSuccess("");
  };

  const handleRegisterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === "hasLicense" && type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setRegisterForm({
        ...registerForm,
        hasLicense: checked,
        licenseNumber: checked ? registerForm.licenseNumber : "",
      });
    } else {
      setRegisterForm({ ...registerForm, [name]: value });

      // Validar email cuando se escriba con debounce
      if (name === "email") {
        // Limpiar timeout anterior
        if (emailCheckTimeout) {
          clearTimeout(emailCheckTimeout);
        }

        if (value.includes("@") && value.includes(".")) {
          // Agregar debounce de 500ms
          const timeout = setTimeout(() => {
            checkEmailExists(value);
          }, 500);
          setEmailCheckTimeout(timeout);
        } else {
          setEmailValidationMessage("");
        }
      }
    }
  };

  // Función para verificar si el email ya existe
  const checkEmailExists = async (email: string) => {
    try {
      const res = await fetch(
        `/api/check-email?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (data.exists) {
        setEmailValidationMessage("Email already registered");
      } else {
        setEmailValidationMessage("");
      }
    } catch {
      // Silenciar errores de verificación
      setEmailValidationMessage("");
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");

    // Validaciones básicas del primer paso
    if (
      !registerForm.email ||
      !registerForm.password ||
      !registerForm.confirmPassword
    ) {
      setRegisterError("Please fill in all fields.");
      setRegisterLoading(false);
      return;
    }

    if (registerForm.password.length < 6) {
      setRegisterError("Password must be at least 6 characters.");
      setRegisterLoading(false);
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Passwords do not match.");
      setRegisterLoading(false);
      return;
    }

    // Pasar al siguiente paso
    setRegisterStep("personal");
    setRegisterLoading(false);
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setRegisterError("Sending again...");

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerForm.email }),
      });

      if (!res.ok) {
        setRegisterError("Error sending verification code");
      } else {
        setRegisterError("Code sent again successfully!");
        setTimeout(() => setRegisterError(""), 3000); // Clear message after 3 seconds
      }
    } catch {
      setRegisterError("Error sending verification code");
    } finally {
      setIsResending(false);
    }
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");

    // Validaciones del segundo paso
    if (
      !registerForm.firstName ||
      !registerForm.lastName ||
      !registerForm.secondaryPhoneNumber ||
      !registerForm.phoneNumber ||
      !registerForm.birthYear ||
      !registerForm.birthMonth ||
      !registerForm.birthDay
    ) {
      setRegisterError("Please fill in all required fields.");
      setRegisterLoading(false);
      return;
    }

    if (registerForm.hasLicense && !registerForm.licenseNumber) {
      setRegisterError("License number is required when you have a license.");
      setRegisterLoading(false);
      return;
    }

    // Enviar código de verificación
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerForm.email }),
      });

      if (!res.ok) {
        setRegisterError("Error sending verification code");
        setRegisterLoading(false);
        return;
      }

      // Pasar al paso de verificación
      setRegisterStep("verify");
      setRegisterLoading(false);
    } catch {
      setRegisterError("Error sending verification code");
      setRegisterLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");

    try {
      const formData = {
        ...registerForm,
        birthDate: `${
          registerForm.birthYear
        }-${registerForm.birthMonth.padStart(
          2,
          "0"
        )}-${registerForm.birthDay.padStart(2, "0")}`,
        code: verificationCode,
        // Campos adicionales requeridos
        middleName: registerForm.middleName || "",
        ssnLast4: "0000", // Valor por defecto
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegisterError(data.error || "Invalid or expired code");
        setRegisterLoading(false);
        return;
      }
      // Éxito en el registro - limpiar todos los estados antes de cerrar
      resetAllStates();
      if (onLoginSuccess) onLoginSuccess(data.user);
      onClose();
    } catch {
      setRegisterError("Verification failed");
      setRegisterLoading(false);
    }
  };

  const switchToRegister = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setMode("register");
      setIsTransitioning(false);
    }, 300);
  };

  const switchToLogin = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setMode("login");
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-1 sm:p-2 md:p-4">
      <div
        className={`bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border-2 border-blue-600 w-full max-w-[95vw] sm:max-w-sm md:max-w-md max-h-[95vh] p-2 sm:p-3 md:p-4 lg:p-6 relative ${
          isTransitioning ? "animate-flipTransition" : "animate-flipIn"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-1 right-1 sm:top-2 sm:right-2 text-gray-400 hover:text-blue-700 text-lg sm:text-xl font-bold"
        >
          &times;
        </button>
        <div className="text-center mb-2 sm:mb-3 md:mb-4">
          <h2 className="text-sm sm:text-base md:text-xl lg:text-2xl font-extrabold text-blue-700 drop-shadow-lg">
            {mode === "login"
              ? step === "login" || step === "verify"
                ? "Sign In"
                : step === "reset-email"
                ? "Reset Password"
                : step === "reset-code"
                ? "Enter Code"
                : step === "reset-password"
                ? "Set New Password"
                : "Password Reset"
              : "Sign Up"}
          </h2>
          {mode === "register" && (
            <div className="mt-1 sm:mt-2">
              <div className="text-xs sm:text-sm text-gray-600 font-medium mb-1 sm:mb-2">
                {registerStep === "credentials" && "1 of 3"}
                {registerStep === "personal" && "2 of 3"}
                {registerStep === "verify" && "3 of 3"}
              </div>
              <div className="flex justify-center space-x-1 sm:space-x-2">
                <div
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    registerStep === "credentials"
                      ? "bg-blue-600"
                      : registerStep === "personal" || registerStep === "verify"
                      ? "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    registerStep === "personal"
                      ? "bg-blue-600"
                      : registerStep === "verify"
                      ? "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    registerStep === "verify" ? "bg-blue-600" : "bg-gray-300"
                  }`}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Formulario de login principal - solo mostrar en steps login o verify */}
        {mode === "login" && (step === "login" || step === "verify") && (
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-2 sm:gap-3 md:gap-4"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm md:text-base"
              autoFocus
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-gray-900 w-full focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm md:text-base"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {error && (
              <div className="text-red-600 text-center text-xs sm:text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-1.5 sm:py-2 md:py-3 bg-blue-600 text-white font-bold rounded-md sm:rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md mt-1 sm:mt-2 text-xs sm:text-sm md:text-base"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Formulario de registro */}
        {mode === "register" && (
          <>
            {/* Paso 1: Credenciales */}
            {registerStep === "credentials" && (
              <form
                onSubmit={handleCredentialsSubmit}
                className="flex flex-col gap-1.5 sm:gap-2 md:gap-3"
              >
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm"
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm"
                  required
                />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm md:text-base"
                  required
                />
                {registerError && (
                  <div className="text-red-600 text-center text-xs sm:text-sm">
                    {registerError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={registerLoading || emailValidationMessage !== ""}
                  className="w-full py-1.5 sm:py-2 md:py-3 bg-blue-600 text-white font-bold rounded-md sm:rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md mt-1 sm:mt-2 text-xs sm:text-sm md:text-base"
                >
                  {registerLoading ? "Processing..." : "Continue"}
                </button>
                {emailValidationMessage && (
                  <div className="text-red-600 text-center text-xs mt-1">
                    {emailValidationMessage}
                  </div>
                )}
              </form>
            )}

            {/* Paso 2: Información Personal */}
            {registerStep === "personal" && (
              <form
                onSubmit={handlePersonalInfoSubmit}
                className="flex flex-col gap-1.5 sm:gap-2"
              >
                {/* Name Information */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <input
                    name="firstName"
                    placeholder="First Name"
                    value={registerForm.firstName}
                    onChange={handleRegisterChange}
                    className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm"
                    required
                  />
                  <input
                    name="lastName"
                    placeholder="Last Name"
                    value={registerForm.lastName}
                    onChange={handleRegisterChange}
                    className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm"
                    required
                  />
                </div>
                <input
                  name="middleName"
                  placeholder="Middle Name (optional)"
                  value={registerForm.middleName}
                  onChange={handleRegisterChange}
                  className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm md:text-base"
                />

                {/* Phone Numbers */}
                <input
                  name="phoneNumber"
                  placeholder="Phone Number 1"
                  value={registerForm.phoneNumber}
                  onChange={handleRegisterChange}
                  className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm"
                  required
                />
                <input
                  name="secondaryPhoneNumber"
                  placeholder="Phone Number 2"
                  value={registerForm.secondaryPhoneNumber}
                  onChange={handleRegisterChange}
                  className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm"
                  required
                />

                {/* Birth Date - 3 separate fields */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Birth Date
                  </label>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    <select
                      name="birthYear"
                      value={registerForm.birthYear}
                      onChange={handleRegisterChange}
                      className="rounded-md sm:rounded-lg border border-gray-300 px-1 sm:px-2 py-1.5 sm:py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 bg-white text-xs sm:text-sm"
                      required
                    >
                      <option value="">Year</option>
                      {Array.from(
                        { length: 80 },
                        (_, i) => new Date().getFullYear() - 16 - i
                      ).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <select
                      name="birthMonth"
                      value={registerForm.birthMonth}
                      onChange={handleRegisterChange}
                      className="rounded-md sm:rounded-lg border border-gray-300 px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 md:py-3 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 bg-white text-xs sm:text-sm md:text-base"
                      required
                    >
                      <option value="">Month</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (month) => (
                          <option key={month} value={month}>
                            {month.toString().padStart(2, "0")}
                          </option>
                        )
                      )}
                    </select>
                    <select
                      name="birthDay"
                      value={registerForm.birthDay}
                      onChange={handleRegisterChange}
                      className="rounded-md sm:rounded-lg border border-gray-300 px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 md:py-3 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 bg-white text-xs sm:text-sm md:text-base"
                      required
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (day) => (
                          <option key={day} value={day}>
                            {day.toString().padStart(2, "0")}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* License Checkbox */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    id="hasLicense"
                    name="hasLicense"
                    type="checkbox"
                    checked={registerForm.hasLicense}
                    onChange={handleRegisterChange}
                    className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="hasLicense"
                    className="text-gray-700 font-medium select-none cursor-pointer text-xs sm:text-sm md:text-base"
                  >
                    I have a driver&apos;s license
                  </label>
                </div>

                {/* License Number Field (enabled only if checkbox is checked) */}
                {registerForm.hasLicense && (
                  <input
                    name="licenseNumber"
                    placeholder="License Number"
                    value={registerForm.licenseNumber}
                    onChange={handleRegisterChange}
                    className="rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base"
                    required={registerForm.hasLicense}
                  />
                )}

                {/* Sex Selection */}
                <select
                  name="sex"
                  value={registerForm.sex}
                  onChange={handleRegisterChange}
                  className="rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-sm sm:text-base"
                  required
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>

                {registerError && (
                  <div className="text-red-600 text-center text-sm">
                    {registerError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full py-1.5 sm:py-2 md:py-3 bg-blue-600 text-white font-bold rounded-md sm:rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md mt-1 sm:mt-2 text-xs sm:text-sm md:text-base"
                >
                  {registerLoading ? "Processing..." : "Send Verification Code"}
                </button>
              </form>
            )}

            {/* Paso 3: Verificación */}
            {registerStep === "verify" && (
              <form
                onSubmit={handleVerifyCode}
                className="flex flex-col gap-2 sm:gap-3 md:gap-4"
              >
                <div className="text-center text-gray-700 mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">
                  A verification code was sent to <b>{registerForm.email}</b>.
                  Please enter it below.
                </div>
                <input
                  type="text"
                  placeholder="Verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-center tracking-widest text-sm sm:text-lg md:text-xl font-mono"
                  maxLength={6}
                  required
                  autoFocus
                />
                {registerError && (
                  <div className="text-red-600 text-center text-xs sm:text-sm">
                    {registerError}
                  </div>
                )}

                {/* Resend code option */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-blue-600 hover:underline text-xs sm:text-sm font-medium disabled:opacity-50"
                  >
                    {isResending
                      ? "Sending..."
                      : "Didn\u2019t receive the code? Click here to resend"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full py-1.5 sm:py-2 md:py-3 bg-blue-600 text-white font-bold rounded-md sm:rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md mt-1 sm:mt-2 text-xs sm:text-sm md:text-base"
                >
                  {registerLoading ? "Verifying..." : "Create Account"}
                </button>
              </form>
            )}
          </>
        )}

        {/* Formulario de reset password - paso 1: solicitar email */}
        {mode === "login" && step === "reset-email" && (
          <form
            onSubmit={handleResetEmail}
            className="flex flex-col gap-2 sm:gap-3 md:gap-4"
          >
            <input
              type="email"
              placeholder="Email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm md:text-base"
              required
              autoFocus
            />
            <div className="flex justify-center pt-1">
              <ReCAPTCHA
                sitekey={
                  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                  "YOUR_RECAPTCHA_SITE_KEY"
                }
                onChange={(token) => setResetRecaptchaToken(token)}
              />
            </div>
            {resetError && (
              <div className="text-red-600 text-center text-xs sm:text-sm">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="text-green-600 text-center text-xs sm:text-sm">
                {resetSuccess}
              </div>
            )}
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full py-1.5 sm:py-2 md:py-3 bg-blue-600 text-white font-bold rounded-md sm:rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md mt-1 sm:mt-2 text-xs sm:text-sm md:text-base"
            >
              {resetLoading ? "Sending..." : "Send Code"}
            </button>
            <button
              type="button"
              className="text-blue-600 hover:underline text-xs sm:text-sm mt-1 sm:mt-2"
              onClick={handleResetBackToLogin}
            >
              Back to login
            </button>
          </form>
        )}

        {/* Formulario de reset password - paso 2: ingresar código */}
        {mode === "login" && step === "reset-code" && (
          <form
            onSubmit={handleResetCode}
            className="flex flex-col gap-2 sm:gap-3 md:gap-4"
          >
            <div className="text-center text-gray-700 mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">
              A reset code was sent to <b>{resetEmail}</b>. Please enter it
              below.
            </div>
            <input
              type="text"
              placeholder="Reset code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-center tracking-widest text-sm sm:text-lg md:text-xl font-mono"
              maxLength={6}
              required
              autoFocus
            />
            {resetError && (
              <div className="text-red-600 text-center text-xs sm:text-sm">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="text-green-600 text-center text-xs sm:text-sm">
                {resetSuccess}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-1.5 sm:py-2 md:py-3 bg-blue-600 text-white font-bold rounded-md sm:rounded-lg hover:bg-blue-700 transition shadow-md mt-1 sm:mt-2 text-xs sm:text-sm md:text-base"
            >
              Next
            </button>
            <button
              type="button"
              className="text-blue-600 hover:underline text-xs sm:text-sm mt-1 sm:mt-2"
              onClick={handleResetBackToLogin}
            >
              Back to login
            </button>
          </form>
        )}

        {/* Formulario de reset password - paso 3: nueva contraseña */}
        {mode === "login" && step === "reset-password" && (
          <form
            onSubmit={handleResetPassword}
            className="flex flex-col gap-2 sm:gap-3 md:gap-4"
          >
            <input
              type="password"
              placeholder="New password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm md:text-base"
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="Repeat new password"
              value={resetPassword2}
              onChange={(e) => setResetPassword2(e.target.value)}
              className="rounded-md sm:rounded-lg border border-gray-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-xs sm:text-sm md:text-base"
              required
            />
            {resetError && (
              <div className="text-red-600 text-center text-xs sm:text-sm">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="text-green-600 text-center text-xs sm:text-sm">
                {resetSuccess}
              </div>
            )}
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full py-1.5 sm:py-2 md:py-3 bg-blue-600 text-white font-bold rounded-md sm:rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md mt-1 sm:mt-2 text-xs sm:text-sm md:text-base"
            >
              {resetLoading ? "Saving..." : "Change Password"}
            </button>
            <button
              type="button"
              className="text-blue-600 hover:underline text-xs sm:text-sm mt-1 sm:mt-2"
              onClick={handleResetBackToLogin}
            >
              Back to login
            </button>
          </form>
        )}

        {/* Pantalla de éxito del reset */}
        {mode === "login" && step === "reset-success" && (
          <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
            <div className="text-green-600 text-center font-bold text-xs sm:text-sm md:text-base">
              Password changed successfully! You can now log in.
            </div>
            <button
              className="w-full py-1.5 sm:py-2 md:py-3 bg-blue-600 text-white font-bold rounded-md sm:rounded-lg hover:bg-blue-700 transition shadow-md mt-1 sm:mt-2 text-xs sm:text-sm md:text-base"
              onClick={handleResetBackToLogin}
            >
              Back to login
            </button>
          </div>
        )}

        {/* Enlaces del footer */}
        <div className="flex flex-col items-center mt-3 sm:mt-4 md:mt-6 gap-1 sm:gap-2">
          {mode === "login" && step === "login" && (
            <button
              className="text-blue-600 hover:underline text-xs sm:text-sm"
              onClick={() => setStep("reset-email")}
            >
              Forgot password?
            </button>
          )}
          {(mode === "login" ||
            (mode === "register" && registerStep === "credentials")) && (
            <>
              {mode === "login" ? (
                <button
                  className="text-green-600 hover:underline text-xs sm:text-sm font-semibold"
                  onClick={switchToRegister}
                >
                  Don&apos;t have an account? Register
                </button>
              ) : (
                <button
                  className="text-blue-600 hover:underline text-xs sm:text-sm font-semibold"
                  onClick={switchToLogin}
                >
                  Already have an account? Sign In
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes flipIn {
          from {
            opacity: 0;
            transform: rotateY(180deg) scale(0.8);
          }
          to {
            opacity: 1;
            transform: rotateY(0deg) scale(1);
          }
        }
        @keyframes flipTransition {
          0% {
            transform: rotateY(0deg) scale(1);
          }
          50% {
            transform: rotateY(90deg) scale(0.8);
          }
          100% {
            transform: rotateY(0deg) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
        .animate-flipIn {
          animation: flipIn 0.6s ease-out;
          perspective: 1000px;
        }
        .animate-flipTransition {
          animation: flipTransition 0.6s ease-in-out;
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
