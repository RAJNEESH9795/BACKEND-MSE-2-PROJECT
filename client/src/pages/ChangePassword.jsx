
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "../context/AuthContext";

// IMPORTANT: Keep PasswordField outside ChangePassword.
function PasswordField({
  label,
  name,
  value,
  onChange,
  visible,
  toggle,
  placeholder,
  autoComplete,
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
          autoComplete={autoComplete}
          required
          maxLength={128}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}

function ChangePassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const togglePassword = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (!passwordChecks.every((check) => check.valid)) {
      setError("Please satisfy all password requirements.");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.patch("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(
        response.data.message || "Password changed successfully."
      );

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // The backend invalidates the old token.
      // Log out immediately and require a fresh login.
      logout();
      navigate("/login", { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to change your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl">

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to Profile
        </button>

        <div className="mb-7">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <LockKeyhole size={28} />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900">
            Change Password
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Keep your MoveMate account secure by updating your password.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
              <CheckCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              visible={showPasswords.current}
              toggle={() => togglePassword("current")}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />

            <PasswordField
              label="New Password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              visible={showPasswords.new}
              toggle={() => togglePassword("new")}
              placeholder="Enter your new password"
              autoComplete="new-password"
            />

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Password requirements
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <div
                    key={check.label}
                    className={`flex items-center gap-2 text-xs ${
                      check.valid ? "text-green-600" : "text-slate-500"
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
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <ShieldCheck size={19} />
              )}

              {loading ? "Updating Password..." : "Update Password"}
            </button>

          </form>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-center text-xs text-slate-500">
              For your security, all existing login sessions will be invalidated after changing your password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
