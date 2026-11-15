
import { useEffect, useRef, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  Users,
  ShieldCheck,
  CalendarDays,
  Pencil,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Camera,
  LockKeyhole,
  Upload,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    community: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Clean up temporary preview URL when it changes or component unmounts.
  useEffect(() => {
    return () => {
      if (previewPhoto) {
        URL.revokeObjectURL(previewPhoto);
      }
    };
  }, [previewPhoto]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/users/me");
        const userData = response.data.user;

        setProfile(userData);

        setFormData({
          name: userData.name || "",
          phone: userData.phone || "",
          community: userData.community || "",
        });

        setUser?.((previous) => ({
          ...previous,
          ...userData,
        }));
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Update form fields
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (formData.name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (formData.name.trim().length > 50) {
      setError("Name cannot exceed 50 characters.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.patch("/users/me", {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        community: formData.community.trim(),
      });

      const updatedUser = response.data.user;

      setProfile(updatedUser);

      setFormData({
        name: updatedUser.name || "",
        phone: updatedUser.phone || "",
        community: updatedUser.community || "",
      });

      setUser?.((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      setEditing(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({
      name: profile.name || "",
      phone: profile.phone || "",
      community: profile.community || "",
    });

    setEditing(false);
    setError("");
    setSuccess("");
  };

  // Select profile photo
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must not exceed 2 MB.");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewPhoto(previewUrl);

    uploadPhoto(file);
  };

  // Upload profile photo
  const uploadPhoto = async (file) => {
    try {
      setUploadingPhoto(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("profilePhoto", file);

      const response = await api.post(
        "/users/me/profile-photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedPhoto = response.data.profilePhoto;

      setProfile((previous) => ({
        ...previous,
        profilePhoto: updatedPhoto,
      }));

      setUser?.((previous) => ({
        ...previous,
        profilePhoto: updatedPhoto,
      }));

      setSuccess("Your profile photo has been updated successfully.");
    } catch (err) {
      setPreviewPhoto("");

      setError(
        err.response?.data?.message ||
          "Unable to upload your profile photo."
      );
    } finally {
      setUploadingPhoto(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3">
        <Loader2 className="animate-spin text-blue-600" size={26} />
        <span className="text-slate-500">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={35} />
          <p className="mt-3 font-semibold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const initials = profile.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const displayedPhoto = previewPhoto || profile.profilePhoto;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">

        {/* Heading */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Account Settings
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            My Profile
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your personal information and account details.
          </p>
        </div>

        {/* Notifications */}
        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            <CheckCircle size={19} />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={19} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600" />

          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col items-start gap-3">
                {/* Profile Photo */}
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-100 text-2xl font-bold text-blue-700 shadow-sm">
                  {displayedPhoto ? (
                    <img
                      src={displayedPhoto}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials || <UserRound size={35} />
                  )}
                </div>

                {/* Change Photo Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingPhoto ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Camera size={17} />
                  )}

                  {uploadingPhoto ? "Uploading..." : "Change Photo"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <p className="text-xs text-slate-400">
                  JPG, PNG or WEBP. Maximum 2 MB.
                </p>
              </div>

              <span className="mb-1 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
                <ShieldCheck size={16} />
                {profile.accountStatus || "active"}
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {profile.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {profile.email}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                  {profile.role}
                </span>

                {profile.isVerified && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Verified Account
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update your personal details.
              </p>
            </div>

            {!editing && (
              <button
                onClick={() => {
                  setEditing(true);
                  setError("");
                  setSuccess("");
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Pencil size={17} />
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">

              {/* Name */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <UserRound size={17} />
                  Full Name
                </label>

                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={50}
                    minLength={2}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-4 py-3 text-slate-800">
                    {profile.name || "Not provided"}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail size={17} />
                  Email Address
                </label>

                <p className="rounded-lg bg-slate-100 px-4 py-3 text-slate-600">
                  {profile.email}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Email cannot be changed here.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Phone size={17} />
                  Phone Number
                </label>

                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={15}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-4 py-3 text-slate-800">
                    {profile.phone || "Not provided"}
                  </p>
                )}
              </div>

              {/* Community */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Users size={17} />
                  Community
                </label>

                {editing ? (
                  <input
                    type="text"
                    name="community"
                    value={formData.community}
                    onChange={handleChange}
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-4 py-3 text-slate-800">
                    {profile.community || "Not provided"}
                  </p>
                )}
              </div>

              {/* Joined Date */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarDays size={17} />
                  Member Since
                </label>

                <p className="rounded-lg bg-slate-50 px-4 py-3 text-slate-800">
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : "Not available"}
                </p>
              </div>
            </div>

            {/* Edit Actions */}
            {editing && (
              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}

                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account Security */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <LockKeyhole size={23} />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">
                Account Security
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep your MoveMate account secure by regularly updating your password.
              </p>

              <button
                type="button"
                onClick={() => navigate("/change-password")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <LockKeyhole size={17} />
                Change Password
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;
