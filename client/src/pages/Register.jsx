import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(formData);

      alert("Registration successful! Please log in.");

      navigate("/login");

    } catch (err) {
      const message =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        "Registration failed. Please try again.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        <h1 className="text-3xl font-bold text-slate-900 text-center">
          Join MoveMate
        </h1>

        <p className="text-slate-500 text-center mt-2">
          Create your community account
        </p>

        {error && (
          <div className="mt-5 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={50}
            className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Indian Mobile Number"
            value={formData.phone}
            onChange={handleChange}
            required
            pattern="[6-9][0-9]{9}"
            title="Enter a valid 10-digit Indian mobile number"
            className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password (minimum 8 characters)"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 p-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-emerald-600"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;