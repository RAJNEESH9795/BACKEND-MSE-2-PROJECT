
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import api from "../services/api";

function PasswordField({
  label,
  name,
  value,
  onChange,
  visible,
  toggle,
  placeholder,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          required
          maxLength={128}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={toggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordChecks = [
    {
      label: "At least 8 characters",
      valid: formData.newPassword.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(formData.newPassword),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(formData.newPassword),
    },
    {
      label: "One number",
      valid: /[0-9]/.test(formData.newPassword),
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const togglePassword = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (!passwordChecks.every((check) => check.valid)) {
      setError("Please satisfy all password requirements.");
      return;
    }

    try {
      setLoading(true);

      await api.patch(`/auth/reset-password/${token}`, {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(true);

      setFormData({
        newPassword: "",
        confirmPassword: "",
      });

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset your password. Your link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">

        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to Login
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <LockKeyhole size={28} />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Reset Your Password
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Create a new secure password for your MoveMate account.
          </p>

          {success ? (
            <div className="mt-7">
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                <CheckCircle size={22} className="mt-0.5 shrink-0" />

                <div>
                  <p className="font-bold">
                    Password reset successful!
                  </p>

                  <p className="mt-1 text-sm leading-relaxed">
                    Your password has been updated. You can now log in using
                    your new password.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">

                <PasswordField
                  label="New Password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  visible={showPasswords.new}
                  toggle={() => togglePassword("new")}
                  placeholder="Enter your new password"
                />

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">
                    Password requirements
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {passwordChecks.map((check) => (
                      <div
                        key={check.label}
                        className={`flex items-center gap-2 text-xs ${
                          check.valid
                            ? "text-green-600"
                            : "text-slate-500"
                        }`}
                      >
                        <CheckCircle size={15} />
                        {check.label}
                      </div>
                    ))}
                  </div>
                </div>

                <PasswordField
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  visible={showPasswords.confirm}
                  toggle={() => togglePassword("confirm")}
                  placeholder="Re-enter your new password"
                />

                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-blue-700"
                  />

                  <p className="text-xs leading-relaxed text-blue-800">
                    Your reset link is valid for 15 minutes and can only be
                    used once.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={19} className="animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={19} />
                      Reset Password
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          MoveMate — Travel Together. Share Smartly. Help Each Other.
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
