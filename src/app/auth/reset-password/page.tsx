"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    checkRecoverySession();
  }, []);

  async function checkRecoverySession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError(
        "This password reset link is invalid or has expired. Please request a new one."
      );
    }

    setCheckingSession(false);
  }

  async function handleUpdatePassword(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (error) {
      console.error(
        "Password update error:",
        error
      );

      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(
      "Your password has been updated successfully."
    );

    setNewPassword("");
    setConfirmPassword("");

    setLoading(false);

    // Give the user a moment to see success message.
    setTimeout(() => {
      router.push("/");
    }, 2000);
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-500">
            Verifying your password reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                C
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Create a New Password
            </h1>

            <p className="text-gray-500 mt-2">
              Choose a new password for your CareerPath account.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {!success && !error.includes("invalid") && (
            <form
              onSubmit={handleUpdatePassword}
              className="space-y-5"
            >

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Updating Password..."
                  : "Update Password"}
              </button>

            </form>
          )}

          {/* Invalid link */}
          {error.includes("invalid") && (
            <Link
              href="/login"
              className="block w-full text-center rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Back to Login
            </Link>
          )}

        </div>
      </div>
    </main>
  );
}