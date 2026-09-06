"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type CareerRole = {
  id: number;
  name: string;
};

export default function ProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [career, setCareer] = useState("");
  const [experience, setExperience] = useState("Beginner");

  const [careerRoles, setCareerRoles] = useState<CareerRole[]>([]);

  const [jobReadiness, setJobReadiness] = useState(0);
  const [completedProjects, setCompletedProjects] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Please log in to view your profile.");
        return;
      }

      setEmail(user.email ?? "");

      // Load profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, target_role_id, experience_level")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
        setMessage("Unable to load your profile.");
        return;
      }

      if (profile) {
        setName(profile.full_name ?? "");
        setExperience(profile.experience_level ?? "Beginner");
      }

      // Load career roles
      const { data: roles, error: rolesError } = await supabase
        .from("career_roles")
        .select("id, name")
        .order("name");

      if (rolesError) {
        console.error("Career roles error:", rolesError);
      } else {
        setCareerRoles(roles ?? []);

        const selectedRole = roles?.find(
          (role) => role.id === profile?.target_role_id
        );

        setCareer(selectedRole?.name ?? "");
      }

      // Load project statistics
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id");

      if (!projectsError && projects) {
        setTotalProjects(projects.length);
      }

      // Calculate completed projects from user progress if available
      const { data: projectProgress, error: progressError } = await supabase
        .from("user_project_progress")
        .select("project_id, progress")
        .eq("user_id", user.id);

      if (!progressError && projectProgress) {
        const completed = projectProgress.filter(
          (item) => Number(item.progress) >= 100
        ).length;

        setCompletedProjects(completed);
      }

      // Load job readiness from user progress if available
      const { data: userProgress, error: readinessError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!readinessError && userProgress) {
        const possibleReadiness =
          userProgress.job_readiness ??
          userProgress.readiness ??
          userProgress.overall_progress;

        if (possibleReadiness !== null && possibleReadiness !== undefined) {
          setJobReadiness(Number(possibleReadiness));
        }
      }
    } catch (error) {
      console.error("Profile loading error:", error);
      setMessage("Something went wrong while loading your profile.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      setSaving(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please log in again.");
        return;
      }

      const selectedRole = careerRoles.find(
        (role) => role.name === career
      );

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: name.trim(),
            target_role_id: selectedRole?.id ?? null,
            experience_level: experience,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (error) {
        console.error("Save profile error:", error);
        setMessage("Unable to save your profile.");
        return;
      }

      setMessage("Profile updated successfully ✓");
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  const initials =
    name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "CP";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">

        {/* Header */}
        <div className="mb-8">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Profile
          </span>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            Your Profile
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your personal information and career preferences.
          </p>
        </div>

        {/* Profile Header */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700">
              {initials}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {name || "CareerPath Student"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {email}
              </p>

              <div className="mt-3 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Active Learner
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update the information used to personalize your CareerPath.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* Full Name */}
            <div>
              <label
                htmlFor="full-name"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Full Name
              </label>

              <input
                id="full-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Email
              </label>

              <input
                id="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
              />

              <p className="mt-2 text-xs text-gray-400">
                Email is managed by your account authentication.
              </p>
            </div>

            {/* Target Career */}
            <div>
              <label
                htmlFor="target-career"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Target Career
              </label>

              <select
                id="target-career"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Select a career</option>

                {careerRoles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label
                htmlFor="experience-level"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Experience Level
              </label>

              <select
                id="experience-level"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Save */}
          <div className="mt-6 flex flex-col items-end gap-3">

            {message && (
              <p
                className={`text-sm font-medium ${
                  message.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}

            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Career Progress */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            Career Progress
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            A quick overview of your current CareerPath journey.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Target Role
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {career || "Not selected"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Job Readiness
              </p>

              <p className="mt-2 font-semibold text-indigo-600">
                {jobReadiness}%
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Projects
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {completedProjects} / {totalProjects} completed
              </p>
            </div>

          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid gap-4 md:grid-cols-2">

          <Link
            href="/settings"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">
              Account Settings
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Manage password, notifications and account preferences.
            </p>

            <p className="mt-4 text-sm font-semibold text-indigo-600">
              Open Settings →
            </p>
          </Link>

          <Link
            href="/roadmap"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">
              View Career Roadmap
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Continue your personalized journey toward job readiness.
            </p>

            <p className="mt-4 text-sm font-semibold text-indigo-600">
              Open Roadmap →
            </p>
          </Link>

        </div>

      </div>
    </div>
  );
}