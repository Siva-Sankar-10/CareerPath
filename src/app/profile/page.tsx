"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Target,
  GraduationCap,
  BriefcaseBusiness,
  CheckCircle2,
  ArrowRight,
  Pencil,
  Save,
  Loader2,
  Map,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type CareerRole = {
  id: number;
  name: string;
};

type ProfileData = {
  full_name: string | null;
  target_role_id: number | null;
  experience_level: string | null;
};

type ProjectProgress = {
  project_id: number;
  progress: number | null;
  completed?: boolean | null;
};

export default function ProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [name, setName] = useState("");
  const [career, setCareer] = useState("");
  const [experience, setExperience] = useState("Beginner");

  const [careerRoles, setCareerRoles] = useState<CareerRole[]>([]);

  const [jobReadiness, setJobReadiness] = useState<number | null>(null);
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

      setUserEmail(user.email ?? "");

      /* -----------------------------
         PROFILE
      ----------------------------- */

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

      const profileData = profile as ProfileData | null;

      if (profileData) {
        setName(profileData.full_name ?? "");
        setExperience(profileData.experience_level ?? "Beginner");
      }

      /* -----------------------------
         CAREER ROLES
      ----------------------------- */

      const { data: roles, error: rolesError } = await supabase
        .from("career_roles")
        .select("id, name")
        .order("name");

      if (rolesError) {
        console.error("Career roles error:", rolesError);
      } else {
        const roleList = (roles ?? []) as CareerRole[];

        setCareerRoles(roleList);

        const selectedRole = roleList.find(
          (role) => role.id === profileData?.target_role_id
        );

        setCareer(selectedRole?.name ?? "");
      }

      /* -----------------------------
         PROJECT STATISTICS
         Uses career_projects
      ----------------------------- */

      if (profileData?.target_role_id) {
        const { data: projects, error: projectsError } =
          await supabase
            .from("career_projects")
            .select("id")
            .eq("role_id", profileData.target_role_id);

        if (projectsError) {
          console.error(
            "Career projects error:",
            projectsError
          );
        } else {
          setTotalProjects(projects?.length ?? 0);

          if (projects && projects.length > 0) {
            const projectIds = projects.map(
              (project) => project.id
            );

            const { data: progressData, error: progressError } =
              await supabase
                .from("user_project_progress")
                .select("project_id, progress, completed")
                .eq("user_id", user.id)
                .in("project_id", projectIds);

            if (progressError) {
              console.error(
                "Project progress error:",
                progressError
              );
            } else {
              const progress =
                (progressData ?? []) as ProjectProgress[];

              const completed = progress.filter(
                (item) =>
                  item.completed === true ||
                  Number(item.progress ?? 0) >= 100
              ).length;

              setCompletedProjects(completed);
            }
          }
        }
      }

      /* -----------------------------
         JOB READINESS
      ----------------------------- */

      const { data: progressData, error: readinessError } =
        await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

      if (readinessError) {
        /*
         * Do not treat an unavailable readiness record
         * as 0% readiness.
         */
        console.warn(
          "Job readiness data unavailable:",
          readinessError
        );
      } else if (progressData) {
        const possibleReadiness =
          progressData.job_readiness ??
          progressData.readiness ??
          progressData.overall_progress;

        if (
          possibleReadiness !== null &&
          possibleReadiness !== undefined
        ) {
          const value = Number(possibleReadiness);

          if (!Number.isNaN(value)) {
            setJobReadiness(
              Math.max(0, Math.min(100, value))
            );
          }
        }
      }
    } catch (error) {
      console.error("Profile loading error:", error);
      setMessage(
        "Something went wrong while loading your profile."
      );
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

      setMessage("Profile updated successfully.");

      await loadProfile();
    } catch (error) {
      console.error("Save error:", error);
      setMessage(
        "Something went wrong while saving your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "CP";

  const readinessLabel =
    jobReadiness === null
      ? "Not started"
      : jobReadiness >= 80
        ? "Strong progress"
        : jobReadiness >= 50
          ? "Good progress"
          : jobReadiness > 0
            ? "Getting started"
            : "Not started";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-5">
            <div className="h-8 w-48 rounded-lg bg-slate-200" />
            <div className="h-4 w-80 rounded bg-slate-200" />

            <div className="h-40 rounded-2xl border border-slate-200 bg-white" />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-80 rounded-2xl border border-slate-200 bg-white" />
              <div className="h-80 rounded-2xl border border-slate-200 bg-white" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <User size={17} />
            Account
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Your Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your personal information and career
            preferences.
          </p>
        </div>

        {/* PROFILE HERO */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-bold text-indigo-700 ring-1 ring-indigo-100">
                {initials}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {name || "CareerPath Student"}
                </h2>

                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Mail size={14} />
                  {userEmail || "No email available"}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {career && (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {career}
                    </span>
                  )}

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Active Learner
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="#personal-information"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={15} />
              Edit Profile
            </Link>
          </div>
        </section>

        {/* CAREER SNAPSHOT */}
        <section className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Target size={18} />
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Target Career
              </p>

              <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">
                {career || "Not selected"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <GraduationCap size={18} />
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Experience
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {experience}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BriefcaseBusiness size={18} />
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Projects
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {completedProjects} / {totalProjects}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                completed
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <ShieldCheck size={18} />
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Job Readiness
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {jobReadiness === null
                  ? "—"
                  : `${jobReadiness}%`}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {readinessLabel}
              </p>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">

          {/* PERSONAL INFORMATION */}
          <section
            id="personal-information"
            className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the information CareerPath uses to
                personalize your journey.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* NAME */}
              <div>
                <label
                  htmlFor="full-name"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Full Name
                </label>

                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="full-name"
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    value={userEmail}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-3 pl-10 pr-4 text-sm text-slate-500"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Email is managed by your authentication
                  account.
                </p>
              </div>

              {/* TARGET CAREER */}
              <div>
                <label
                  htmlFor="target-career"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Target Career
                </label>

                <div className="relative">
                  <Target
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="target-career"
                    value={career}
                    onChange={(e) =>
                      setCareer(e.target.value)
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">
                      Select a career
                    </option>

                    {careerRoles.map((role) => (
                      <option
                        key={role.id}
                        value={role.name}
                      >
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* EXPERIENCE */}
              <div>
                <label
                  htmlFor="experience-level"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Experience Level
                </label>

                <div className="relative">
                  <GraduationCap
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="experience-level"
                    value={experience}
                    onChange={(e) =>
                      setExperience(e.target.value)
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="Beginner">
                      Beginner
                    </option>
                    <option value="Intermediate">
                      Intermediate
                    </option>
                    <option value="Advanced">
                      Advanced
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* SAVE AREA */}
            <div className="mt-6 flex flex-col items-end gap-3 border-t border-slate-100 pt-5">
              {message && (
                <p
                  className={`text-sm font-medium ${
                    message.includes("successfully")
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}

              <button
                onClick={saveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </section>

          {/* CAREER JOURNEY */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Career Journey
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Continue building your path toward job
              readiness.
            </p>

            <div className="mt-6 space-y-3">

              <Link
                href="/roadmap"
                className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Map size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Career Roadmap
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      See what to do next
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600"
                />
              </Link>

              <Link
                href="/job-readiness"
                className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Job Readiness
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Check your readiness
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600"
                />
              </Link>

              <Link
                href="/settings"
                className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Settings size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Account Settings
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Security and preferences
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600"
                />
              </Link>
            </div>
          </section>
        </div>

        {/* PROFILE STATUS */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Profile information
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Your profile helps CareerPath personalize
                  assessments, recommendations, projects,
                  internships and job-readiness insights.
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Profile Active
            </span>
          </div>
        </section>

      </div>
    </main>
  );
}