"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(true);

  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadSettings();

    const savedEmailNotifications =
      localStorage.getItem("emailNotifications");

    const savedTaskReminders =
      localStorage.getItem("taskReminders");

    const savedProgressUpdates =
      localStorage.getItem("progressUpdates");

    if (savedEmailNotifications !== null) {
      setEmailNotifications(savedEmailNotifications === "true");
    }

    if (savedTaskReminders !== null) {
      setTaskReminders(savedTaskReminders === "true");
    }

    if (savedProgressUpdates !== null) {
      setProgressUpdates(savedProgressUpdates === "true");
    }
  }, []);

  async function loadSettings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setEmail(user.email || "");
    setLoading(false);
  }

  function saveNotificationSetting(
    key: string,
    value: boolean
  ) {
    localStorage.setItem(key, String(value));
  }

  async function handleSendPasswordReset() {
    setPasswordLoading(true);
    setPasswordMessage("");
    setPasswordError("");

    if (!email) {
      setPasswordError("Unable to find your email address.");
      setPasswordLoading(false);
      return;
    }

    const redirectTo =
      `${window.location.origin}/auth/callback?next=/auth/reset-password`;

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

    if (error) {
      console.error("Password reset error:", error);
      setPasswordError(error.message);
      setPasswordLoading(false);
      return;
    }

    setPasswordMessage(
      "Password reset email sent. Please check your email and follow the verification link."
    );

    setPasswordLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();

    router.push("/login");
  }

  async function handleDownloadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const [
      profileResult,
      assessmentResult,
      projectResult,
      learningResult,
      progressResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("assessment_attempts")
        .select("*")
        .eq("user_id", user.id),

      supabase
        .from("user_project_progress")
        .select("*")
        .eq("user_id", user.id),

      supabase
        .from("user_learning_progress")
        .select("*")
        .eq("user_id", user.id),

      supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id),
    ]);

    const exportData = {
      account: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },

      profile: profileResult.data || null,

      assessments: assessmentResult.data || [],

      project_progress: projectResult.data || [],

      learning_progress: learningResult.data || [],

      progress: progressResult.data || [],

      exported_at: new Date().toISOString(),
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "careerpath-my-data.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);

    /*
      IMPORTANT:
      Supabase Auth users should NOT be deleted directly
      from the browser using the service role key.

      A secure server-side account deletion endpoint
      should be implemented later.

      For now we sign the user out safely.
    */

    await supabase.auth.signOut();

    localStorage.clear();

    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] p-8 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <p className="text-gray-500">
              Loading settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Settings
          </h1>

          <p className="text-gray-500 mt-1">
            Manage your CareerPath account and preferences.
          </p>
        </div>

        {/* Account */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Account
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Your account information.
          </p>

          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              value={email}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600"
            />
          </div>
        </section>

        {/* Change Password */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Change Password
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            We will send a secure password-reset verification link
            to your registered email address.
          </p>

          {passwordMessage && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {passwordMessage}
            </div>
          )}

          {passwordError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {passwordError}
            </div>
          )}

          <button
            type="button"
            onClick={handleSendPasswordReset}
            disabled={passwordLoading}
            className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordLoading
              ? "Sending verification email..."
              : "Send Password Reset Email"}
          </button>
        </section>

        {/* Notifications */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Choose which notifications you want to receive.
          </p>

          <div className="mt-5 space-y-5">

            {/* Email Notifications */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">
                  Email Notifications
                </p>

                <p className="text-sm text-gray-500">
                  Receive important CareerPath updates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const value = !emailNotifications;

                  setEmailNotifications(value);

                  saveNotificationSetting(
                    "emailNotifications",
                    value
                  );
                }}
                className={`relative h-6 w-11 rounded-full transition ${
                  emailNotifications
                    ? "bg-indigo-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    emailNotifications
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Task Reminders */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">
                  Task Reminders
                </p>

                <p className="text-sm text-gray-500">
                  Get reminders for your learning tasks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const value = !taskReminders;

                  setTaskReminders(value);

                  saveNotificationSetting(
                    "taskReminders",
                    value
                  );
                }}
                className={`relative h-6 w-11 rounded-full transition ${
                  taskReminders
                    ? "bg-indigo-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    taskReminders
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Progress Updates */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">
                  Progress Updates
                </p>

                <p className="text-sm text-gray-500">
                  Receive updates about your CareerPath progress.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const value = !progressUpdates;

                  setProgressUpdates(value);

                  saveNotificationSetting(
                    "progressUpdates",
                    value
                  );
                }}
                className={`relative h-6 w-11 rounded-full transition ${
                  progressUpdates
                    ? "bg-indigo-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    progressUpdates
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

          </div>
        </section>

        {/* Data */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Data
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Download a copy of the information stored in CareerPath.
          </p>

          <button
            type="button"
            onClick={handleDownloadData}
            className="mt-5 rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Download My Data
          </button>
        </section>

        {/* Sign Out */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Session
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Sign out of your CareerPath account.
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Sign Out
          </button>
        </section>

        {/* Danger Zone */}
        <section className="bg-white border border-red-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-red-600">
            Danger Zone
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Account deletion is permanent.
          </p>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="mt-5 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleteLoading
              ? "Signing out..."
              : "Delete Account"}
          </button>
        </section>

      </div>
    </main>
  );
}