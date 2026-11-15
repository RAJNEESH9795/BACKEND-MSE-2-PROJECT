
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  LockKeyhole,
} from "lucide-react";

import api from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">

        {/* Back to Login */}
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to Login
        </Link>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          {/* Icon */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <LockKeyhole size={28} />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-extrabold text-slate-900">
            Forgot Password?
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Don't worry! Enter the email address associated with your
            MoveMate account. We'll send you a link to reset your password.
          </p>

          {/* Success Message */}
          {success && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3 text-green-700">
                <CheckCircle size={21} className="mt-0.5 shrink-0" />

                <div>
                  <p className="text-sm font-bold">
                    Check your email!
                  </p>

                  <p className="mt-1 text-sm leading-relaxed">
                    If an account with that email exists, a password reset
                    link has been sent. Please check your Inbox and Spam folder.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Registered Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setSuccess(false);
                  }}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 border-t border-slate-100 pt-5">
            <p className="text-center text-sm text-slate-500">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Branding */}
        <p className="mt-6 text-center text-xs text-slate-400">
          MoveMate — Travel Together. Share Smartly. Help Each Other.
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
