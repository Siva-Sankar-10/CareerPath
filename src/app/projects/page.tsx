"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Target,
  Plus,
  ExternalLink,
  GitBranch,
  Trash2,
  BriefcaseBusiness,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Project = {
  id: number;
  role_id: number;
  title: string;
  description: string | null;
  difficulty: string | null;
  estimated_hours: number | null;
  project_type: string | null;
  objective: string | null;
  prerequisites: string | null;
  tools: string | null;
  github_required: boolean | null;
  item_order: number | null;
};

type ProjectProgress = {
  project_id: number;
  progress: number | null;
  completed: boolean | null;
};

type ShowcaseProject = {
  id: number;
  title: string;
  description: string | null;
  technologies: string | null;
  github_url: string | null;
  live_url: string | null;
  image_url: string | null;
  project_type: string | null;
  created_at: string;
};

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [showcaseProjects, setShowcaseProjects] = useState<
    ShowcaseProject[]
  >([]);

  const [progress, setProgress] = useState<Record<number, number>>({});
  const [roleName, setRoleName] = useState("Your Career Role");

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const supabase = createClient();

        // --------------------------------------------------
        // USER
        // --------------------------------------------------

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        // --------------------------------------------------
        // PROFILE
        // --------------------------------------------------

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("target_role_id")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profile?.target_role_id) {
          setError("Please select a career role first.");
          return;
        }

        const roleId = profile.target_role_id;

        // --------------------------------------------------
        // ROLE
        // --------------------------------------------------

        const { data: role, error: roleError } =
          await supabase
            .from("career_roles")
            .select("id, name")
            .eq("id", roleId)
            .maybeSingle();

        if (roleError) {
          throw roleError;
        }

        if (role?.name) {
          setRoleName(role.name);
        }

        // --------------------------------------------------
        // CAREERPATH RECOMMENDED PROJECTS
        // --------------------------------------------------

        const { data: projectData, error: projectError } =
          await supabase
            .from("career_projects")
            .select(`
              id,
              role_id,
              title,
              description,
              difficulty,
              estimated_hours,
              project_type,
              objective,
              prerequisites,
              tools,
              github_required,
              item_order
            `)
            .eq("role_id", roleId)
            .order("item_order", {
              ascending: true,
              nullsFirst: false,
            })
            .order("id", {
              ascending: true,
            });

        if (projectError) {
          throw projectError;
        }

        const loadedProjects = (projectData ?? []) as Project[];

        setProjects(loadedProjects);

        // --------------------------------------------------
        // PROJECT PROGRESS
        // --------------------------------------------------

        if (loadedProjects.length > 0) {
          const projectIds = loadedProjects.map(
            (project) => project.id
          );

          const {
            data: progressData,
            error: progressError,
          } = await supabase
            .from("user_project_progress")
            .select(`
              project_id,
              progress,
              completed
            `)
            .eq("user_id", user.id)
            .in("project_id", projectIds);

          if (progressError) {
            throw progressError;
          }

          const progressMap: Record<number, number> = {};

          ((progressData ?? []) as ProjectProgress[]).forEach(
            (item) => {
              progressMap[item.project_id] = item.progress ?? 0;
            }
          );

          setProgress(progressMap);
        }

        // --------------------------------------------------
        // STUDENT SHOWCASE PROJECTS
        // --------------------------------------------------

        const {
          data: showcaseData,
          error: showcaseError,
        } = await supabase
          .from("user_showcase_projects")
          .select(`
            id,
            title,
            description,
            technologies,
            github_url,
            live_url,
            image_url,
            project_type,
            created_at
          `)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (showcaseError) {
          throw showcaseError;
        }

        setShowcaseProjects(
          (showcaseData ?? []) as ShowcaseProject[]
        );
      } catch (err: any) {
        console.error("PROJECTS PAGE ERROR:", err);

        setError(
          err?.message || "Unable to load projects."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [router]);

  // --------------------------------------------------
  // DELETE SHOWCASE PROJECT
  // --------------------------------------------------

  async function deleteShowcaseProject(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this project from your showcase?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error: deleteError } = await supabase
        .from("user_showcase_projects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setShowcaseProjects((current) =>
        current.filter((project) => project.id !== id)
      );
    } catch (err: any) {
      console.error(
        "DELETE SHOWCASE PROJECT ERROR:",
        err
      );

      alert(
        err?.message ||
        "Unable to delete the project."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // --------------------------------------------------
  // CALCULATIONS
  // --------------------------------------------------

  const completedProjects = projects.filter(
    (project) =>
      (progress[project.id] ?? 0) === 100
  ).length;

  const overallProgress =
    projects.length === 0
      ? 0
      : Math.round(
        projects.reduce(
          (total, project) =>
            total +
            (progress[project.id] ?? 0),
          0
        ) / projects.length
      );

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] p-8">
        <div className="mx-auto max-w-7xl">

          <div className="h-8 w-80 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          </div>

          <div className="mt-8 h-72 animate-pulse rounded-2xl bg-slate-200" />

        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8">

          <h1 className="text-xl font-semibold text-slate-900">
            Unable to load projects
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>

        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                <FolderKanban
                  size={21}
                  className="text-indigo-600"
                />
              </div>

              <div>

                <p className="text-sm font-medium text-indigo-600">
                  Project Roadmap
                </p>

                <h1 className="text-3xl font-bold tracking-tight">
                  Projects for {roleName}
                </h1>

              </div>

            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Build practical projects, track your
              development progress, and showcase
              your completed work.
            </p>

          </div>

          {/* ADD PROJECT */}

          <button
            onClick={() =>
              router.push("/projects/add")
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={17} />
            Add Project
          </button>

        </div>

        {/* ==================================================
            STATS
        ================================================== */}

        <div className="grid gap-5 md:grid-cols-3">

          {/* PROGRESS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Project Progress
              </p>

              <Target
                size={18}
                className="text-indigo-500"
              />

            </div>

            <p className="mt-3 text-3xl font-bold">
              {overallProgress}%
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${overallProgress}%`,
                }}
              />

            </div>

          </div>

          {/* AVAILABLE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Available Projects
            </p>

            <p className="mt-3 text-3xl font-bold">
              {projects.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Projects for your target role
            </p>

          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-2">

              <p className="text-sm text-slate-500">
                Completed
              </p>

              <CheckCircle2
                size={17}
                className="text-green-500"
              />

            </div>

            <p className="mt-3 text-3xl font-bold">
              {completedProjects}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              CareerPath projects completed
            </p>

          </div>

        </div>

        {/* ==================================================
            RECOMMENDED PROJECTS
        ================================================== */}

        <section className="mt-10">

          <div className="mb-5">

            <div className="flex items-center gap-2">

              <BriefcaseBusiness
                size={20}
                className="text-indigo-600"
              />

              <h2 className="text-xl font-semibold">
                Recommended Projects
              </h2>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Projects selected for your target
              career role. Build these to strengthen
              your practical skills.
            </p>

          </div>

          {projects.length === 0 ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

              <FolderKanban
                size={40}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-lg font-semibold">
                No recommended projects yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                There are currently no projects
                configured for your selected
                career role.
              </p>

            </div>

          ) : (

            <div className="grid gap-5 lg:grid-cols-2">

              {projects.map((project) => {

                const projectProgress =
                  progress[project.id] ?? 0;

                const completed =
                  projectProgress === 100;

                return (

                  <div
                    key={project.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                  >

                    {/* TITLE */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">

                          <FolderKanban
                            size={20}
                            className="text-indigo-600"
                          />

                        </div>

                        <div>

                          <h3 className="text-lg font-semibold">
                            {project.title}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {project.project_type ||
                              "Practical Project"}
                          </p>

                        </div>

                      </div>

                      {completed && (
                        <CheckCircle2
                          size={21}
                          className="text-green-600"
                        />
                      )}

                    </div>

                    {/* DESCRIPTION */}

                    <p className="mt-5 text-sm leading-6 text-slate-600">
                      {project.description ||
                        project.objective ||
                        "Complete this practical project to strengthen your career skills."}
                    </p>

                    {/* TAGS */}

                    <div className="mt-5 flex flex-wrap gap-2">

                      {project.difficulty && (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                          {project.difficulty}
                        </span>
                      )}

                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">

                        <Clock3 size={13} />

                        {project.estimated_hours ?? 0} hours

                      </span>

                    </div>

                    {/* PROGRESS */}

                    <div className="mt-6">

                      <div className="mb-2 flex justify-between">

                        <span className="text-xs font-medium text-slate-500">
                          Progress
                        </span>

                        <span className="text-xs font-semibold text-indigo-600">
                          {projectProgress}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{
                            width: `${projectProgress}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* START / CONTINUE */}

                    <button
                      onClick={() =>
                        router.push(
                          `/projects/${project.id}`
                        )
                      }
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >

                      {projectProgress > 0
                        ? "Continue Project"
                        : "Start Project"}

                      <ArrowRight size={16} />

                    </button>

                  </div>

                );
              })}

            </div>

          )}

        </section>

        {/* ==================================================
            MY PROJECT SHOWCASE
        ================================================== */}

        <section className="mt-12">

          {/* SHOWCASE HEADER */}

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <FolderKanban
                  size={20}
                  className="text-indigo-600"
                />

                <h2 className="text-xl font-semibold">
                  My Project Showcase
                </h2>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Add projects you have already built
                and showcase your work.
              </p>

            </div>

            <button
              onClick={() =>
                router.push("/projects/add")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <Plus size={16} />
              Add Project
            </button>

          </div>

          {/* SHOWCASE EMPTY STATE */}

          {showcaseProjects.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">

                <FolderKanban
                  size={25}
                  className="text-indigo-500"
                />

              </div>

              <h3 className="mt-4 text-lg font-semibold">
                Your showcase is empty
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Add the projects you have built
                during college, internships,
                hackathons, or personal learning.
                These projects can become part of
                your professional portfolio.
              </p>

              <button
                onClick={() =>
                  router.push("/projects/add")
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Plus size={17} />
                Add Your First Project
              </button>

            </div>

          ) : (

            /* SHOWCASE PROJECT CARDS */

            <div className="grid gap-5 md:grid-cols-2">

              {showcaseProjects.map((project) => (

                <div
                  key={project.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >

                  {/* IMAGE */}

                  {project.image_url ? (

                    <div className="h-44 w-full overflow-hidden bg-slate-100">

                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="h-full w-full object-cover"
                      />

                    </div>

                  ) : (

                    <div className="flex h-44 w-full items-center justify-center bg-indigo-50">

                      <FolderKanban
                        size={42}
                        className="text-indigo-300"
                      />

                    </div>

                  )}

                  {/* CONTENT */}

                  <div className="p-6">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <h3 className="text-lg font-semibold text-slate-900">
                          {project.title}
                        </h3>

                        {project.project_type && (
                          <p className="mt-1 text-xs text-indigo-600">
                            {project.project_type}
                          </p>
                        )}

                      </div>

                      <button
                        onClick={() =>
                          deleteShowcaseProject(
                            project.id
                          )
                        }
                        disabled={
                          deletingId === project.id
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Delete project"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                    {/* DESCRIPTION */}

                    {project.description && (
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {project.description}
                      </p>
                    )}

                    {/* TECHNOLOGIES */}

                    {project.technologies && (

                      <div className="mt-5">

                        <p className="mb-2 text-xs font-medium text-slate-500">
                          Technologies
                        </p>

                        <div className="flex flex-wrap gap-2">

                          {project.technologies
                            .split(",")
                            .map((tech, index) => {

                              const technology =
                                tech.trim();

                              if (!technology) {
                                return null;
                              }

                              return (
                                <span
                                  key={`${project.id}-${index}`}
                                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                                >
                                  {technology}
                                </span>
                              );
                            })}

                        </div>

                      </div>

                    )}

                    {/* LINKS */}

                    <div className="mt-6 flex flex-wrap gap-3">

                      {project.github_url && (

                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                        >

                          <GitBranch size={16} />

                          GitHub

                          <ExternalLink
                            size={13}
                          />

                        </a>

                      )}

                      {project.live_url && (

                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >

                          Live Demo

                          <ExternalLink
                            size={13}
                          />

                        </a>

                      )}

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* ==================================================
            BOTTOM INFORMATION
        ================================================== */}

        <section className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="font-semibold text-slate-900">
                Build your portfolio
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Complete recommended projects and
                add your own projects to create a
                strong portfolio for internships and
                job applications.
              </p>

            </div>

            <button
              onClick={() =>
                router.push("/projects/add")
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition hover:bg-indigo-50"
            >
              <Plus size={16} />
              Showcase Project
            </button>

          </div>

        </section>

      </div>

    </main>
  );
}