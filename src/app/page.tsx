"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  GraduationCap,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

type Profile = {
  full_name: string | null;
  target_role_id: number | null;
};

type CareerRole = {
  id: number;
  name: string;
};

type Assessment = {
  score: number | null;
  completed_at: string | null;
};

type SkillGap = {
  skill_name: string;
  skill_score: number | null;
  required_level: number;
  skill_gap: number | null;
  status: string | null;
};

type LearningProgress = {
  learning_resource_id: number;
  progress: number;
  completed: boolean;
};

type LearningResource = {
  id: number;
  name: string;
  provider: string | null;
  skill_id: number;
  estimated_hours: number | null;
};

type ProjectProgress = {
  project_id: number;
  progress: number;
  completed: boolean;
};

type CareerProject = {
  id: number;
  title: string;
  description: string | null;
  estimated_hours: number | null;
};

type CertificationProgress = {
  certification_id: number;
  progress: number;
  completed: boolean;
};

type Certification = {
  id: number;
  title: string;
  provider: string | null;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [role, setRole] =
    useState<CareerRole | null>(null);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [skills, setSkills] =
    useState<SkillGap[]>([]);

  const [learningProgress, setLearningProgress] =
    useState<LearningProgress[]>([]);

  const [learningResources, setLearningResources] =
    useState<LearningResource[]>([]);

  const [projectProgress, setProjectProgress] =
    useState<ProjectProgress[]>([]);

  const [projects, setProjects] =
    useState<CareerProject[]>([]);

  const [certificationProgress, setCertificationProgress] =
    useState<CertificationProgress[]>([]);

  const [certifications, setCertifications] =
    useState<Certification[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      /* ================================
         PROFILE
      ================================= */

      const { data: profileData } =
        await supabase
          .from("profiles")
          .select(
            `
              full_name,
              target_role_id
            `
          )
          .eq("id", user.id)
          .maybeSingle();

      setProfile(profileData);

      /* ================================
         ROLE
      ================================= */

      if (profileData?.target_role_id) {
        const { data: roleData } =
          await supabase
            .from("career_roles")
            .select("id, name")
            .eq("id", profileData.target_role_id)
            .maybeSingle();

        setRole(roleData);
      }

      /* ================================
         ASSESSMENT
      ================================= */

      const { data: assessmentData } =
        await supabase
          .from("assessment_attempts")
          .select(
            `
              score,
              completed_at
            `
          )
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .order("completed_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      setAssessment(assessmentData);

      /* ================================
         SKILLS
      ================================= */

      const { data: skillData } =
        await supabase
          .from("user_skill_gaps")
          .select(
            `
              skill_name,
              skill_score,
              required_level,
              skill_gap,
              status,
              created_at
            `
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      const latestSkills: SkillGap[] = [];
      const seen = new Set<string>();

      for (const item of skillData || []) {
        if (!seen.has(item.skill_name)) {
          seen.add(item.skill_name);

          latestSkills.push({
            skill_name: item.skill_name,
            skill_score: item.skill_score,
            required_level: item.required_level,
            skill_gap: item.skill_gap,
            status: item.status,
          });
        }
      }

      setSkills(latestSkills);

      /* ================================
         LEARNING PROGRESS
      ================================= */

      const { data: learningProgressData } =
        await supabase
          .from("user_learning_progress")
          .select(
            `
              learning_resource_id,
              progress,
              completed
            `
          )
          .eq("user_id", user.id);

      setLearningProgress(
        learningProgressData || []
      );

      /* ================================
         LEARNING RESOURCES
      ================================= */

      const { data: resourceData } =
        await supabase
          .from("learning_resources")
          .select(
            `
              id,
              name,
              provider,
              skill_id,
              estimated_hours
            `
          );

      setLearningResources(resourceData || []);

      /* ================================
         PROJECT PROGRESS
      ================================= */

      const { data: projectProgressData } =
        await supabase
          .from("user_project_progress")
          .select(
            `
              project_id,
              progress,
              completed
            `
          )
          .eq("user_id", user.id);

      setProjectProgress(
        projectProgressData || []
      );

      /* ================================
         PROJECTS
      ================================= */

      if (profileData?.target_role_id) {
        const { data: projectData } =
          await supabase
            .from("career_projects")
            .select(
              `
                id,
                title,
                description,
                estimated_hours
              `
            )
            .eq(
              "role_id",
              profileData.target_role_id
            )
            .order("item_order", {
              ascending: true,
            });

        setProjects(projectData || []);
      }

      /* ================================
         CERTIFICATION PROGRESS
      ================================= */

      const { data: certificationProgressData } =
        await supabase
          .from("user_certification_progress")
          .select(
            `
              certification_id,
              progress,
              completed
            `
          )
          .eq("user_id", user.id);

      setCertificationProgress(
        certificationProgressData || []
      );

      /* ================================
         CERTIFICATIONS
      ================================= */

      if (profileData?.target_role_id) {
        const { data: certificationData } =
          await supabase
            .from("certifications")
            .select(
              `
                id,
                title,
                provider
              `
            )
            .eq(
              "role_id",
              profileData.target_role_id
            )
            .order("item_order", {
              ascending: true,
            });

        setCertifications(
          certificationData || []
        );
      }
    } catch (error) {
      console.error(
        "DASHBOARD ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================================
     SKILL SCORE
  ================================= */

  const assessedSkills = skills.filter(
    (skill) => skill.skill_score !== null
  );

  const skillScore =
    assessedSkills.length > 0
      ? Math.round(
          assessedSkills.reduce(
            (sum, skill) =>
              sum + (skill.skill_score ?? 0),
            0
          ) / assessedSkills.length
        )
      : 0;

  /* ================================
     LEARNING SCORE
  ================================= */

  const learningScore =
    learningProgress.length > 0
      ? Math.round(
          learningProgress.reduce(
            (sum, item) =>
              sum + (item.progress || 0),
            0
          ) / learningProgress.length
        )
      : 0;

  /* ================================
     PROJECT SCORE
  ================================= */

  const projectScore =
    projectProgress.length > 0
      ? Math.round(
          projectProgress.reduce(
            (sum, item) =>
              sum + (item.progress || 0),
            0
          ) / projectProgress.length
        )
      : 0;

  /* ================================
     CERTIFICATION SCORE
  ================================= */

  const certificationScore =
    certificationProgress.length > 0
      ? Math.round(
          certificationProgress.reduce(
            (sum, item) =>
              sum + (item.progress || 0),
            0
          ) / certificationProgress.length
        )
      : 0;

  /* ================================
     READINESS
  ================================= */

  const readinessParts = [
    {
      value: skillScore,
      weight: 30,
      available: assessedSkills.length > 0,
    },
    {
      value: projectScore,
      weight: 25,
      available: projectProgress.length > 0,
    },
    {
      value: learningScore,
      weight: 15,
      available: learningProgress.length > 0,
    },
    {
      value: assessment?.score ?? 0,
      weight: 20,
      available: assessment !== null,
    },
    {
      value: certificationScore,
      weight: 10,
      available:
        certificationProgress.length > 0,
    },
  ];

  const availableReadinessParts =
    readinessParts.filter(
      (item) => item.available
    );

  const totalWeight =
    availableReadinessParts.reduce(
      (sum, item) => sum + item.weight,
      0
    );

  const readiness =
    totalWeight > 0
      ? Math.round(
          availableReadinessParts.reduce(
            (sum, item) =>
              sum +
              item.value *
                (item.weight /
                  totalWeight),
            0
          )
        )
      : 0;

  /* ================================
     BIGGEST SKILL GAP
  ================================= */

  const biggestGap = useMemo(() => {
    if (!assessedSkills.length) {
      return null;
    }

    return [...assessedSkills].sort(
      (a, b) =>
        (b.skill_gap ?? 0) -
        (a.skill_gap ?? 0)
    )[0];
  }, [assessedSkills]);

  /* ================================
     CURRENT LEARNING
  ================================= */

  const currentLearning = useMemo(() => {
    const active = learningProgress
      .filter(
        (item) =>
          item.progress > 0 &&
          item.progress < 100
      )
      .sort(
        (a, b) => b.progress - a.progress
      )[0];

    if (!active) return null;

    return (
      learningResources.find(
        (resource) =>
          resource.id ===
          active.learning_resource_id
      ) || null
    );
  }, [
    learningProgress,
    learningResources,
  ]);

  const currentLearningProgress =
    currentLearning
      ? learningProgress.find(
          (item) =>
            item.learning_resource_id ===
            currentLearning.id
        )?.progress ?? 0
      : 0;

  /* ================================
     CURRENT PROJECT
  ================================= */

  const currentProject = useMemo(() => {
    const active = projectProgress
      .filter(
        (item) =>
          item.progress > 0 &&
          item.progress < 100
      )
      .sort(
        (a, b) => b.progress - a.progress
      )[0];

    if (!active) return null;

    return (
      projects.find(
        (project) =>
          project.id === active.project_id
      ) || null
    );
  }, [projectProgress, projects]);

  const currentProjectProgress =
    currentProject
      ? projectProgress.find(
          (item) =>
            item.project_id ===
            currentProject.id
        )?.progress ?? 0
      : 0;

  /* ================================
     NEXT ACTION
  ================================= */

  let nextActionTitle =
    "Complete your career assessment";

  let nextActionDescription =
    "Take the assessment so CareerPath can identify your strengths, weaknesses and skill gaps.";

  let nextActionLink = `/assessment?role=${
    role?.id ?? ""
  }`;

  if (assessment && biggestGap) {
    nextActionTitle = `Improve ${biggestGap.skill_name}`;

    nextActionDescription =
      "Focus on your largest skill gap before moving to the next major area.";

    nextActionLink = "/learning";
  } else if (
    assessment &&
    !biggestGap
  ) {
    nextActionTitle =
      "Start your learning journey";

    nextActionDescription =
      "Explore the recommended learning resources for your target role.";

    nextActionLink = "/learning";
  }

  if (currentLearning) {
    nextActionTitle =
      `Continue ${currentLearning.name}`;

    nextActionDescription =
      "Continue the learning resource you already started.";

    nextActionLink = "/learning";
  }

  if (currentProject) {
    nextActionTitle =
      `Continue ${currentProject.title}`;

    nextActionDescription =
      "Continue building your current project and complete its remaining tasks.";

    nextActionLink = `/projects/${currentProject.id}`;
  }

  /* ================================
     LOADING
  ================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9fc] px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-72 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-96 rounded bg-gray-200" />

          <div className="mt-8 h-56 rounded-2xl bg-gray-200" />

          <div className="mt-6 grid gap-5 md:grid-cols-4">
            <div className="h-32 rounded-2xl bg-gray-200" />
            <div className="h-32 rounded-2xl bg-gray-200" />
            <div className="h-32 rounded-2xl bg-gray-200" />
            <div className="h-32 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9fc] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* ==========================
            HEADER
        =========================== */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            CareerPath Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Welcome back
            {profile?.full_name
              ? `, ${profile.full_name}`
              : ""}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Here is your current journey toward becoming
            job-ready.
          </p>
        </div>

        {/* ==========================
            TARGET ROLE
        =========================== */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Target Career
                </p>

                <h2 className="text-xl font-bold text-gray-900">
                  {role?.name ??
                    "No career selected"}
                </h2>
              </div>
            </div>

            <a
              href="/roadmap"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              View Roadmap
              <ArrowRight className="h-4 w-4" />
            </a>

          </div>

        </section>

        {/* ==========================
            READINESS
        =========================== */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

          <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-sm font-semibold text-indigo-600">
                Job Readiness
              </p>

              <h2 className="mt-2 text-4xl font-bold text-gray-900">
                {readiness}%
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                Your readiness is based on your current skills,
                assessment, learning, projects and certifications.
              </p>
            </div>

            <div className="h-32 w-32 shrink-0">
              <div
                className="flex h-32 w-32 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#4f46e5 ${readiness}%, #eef2ff 0)`,
                }}
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white">
                  <span className="text-2xl font-bold text-gray-900">
                    {readiness}%
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-700"
              style={{
                width: `${readiness}%`,
              }}
            />
          </div>

          <div className="mt-5">
            <a
              href="/job-readiness"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View detailed job readiness
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

        </section>

        {/* ==========================
            QUICK STATS
        =========================== */}

        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <DashboardStat
            icon={
              <Target className="h-5 w-5 text-indigo-600" />
            }
            bg="bg-indigo-100"
            label="Skill Progress"
            value={`${skillScore}%`}
          />

          <DashboardStat
            icon={
              <BookOpen className="h-5 w-5 text-blue-600" />
            }
            bg="bg-blue-100"
            label="Learning"
            value={`${learningScore}%`}
          />

          <DashboardStat
            icon={
              <FolderKanban className="h-5 w-5 text-purple-600" />
            }
            bg="bg-purple-100"
            label="Projects"
            value={`${projectScore}%`}
          />

          <DashboardStat
            icon={
              <GraduationCap className="h-5 w-5 text-amber-600" />
            }
            bg="bg-amber-100"
            label="Certifications"
            value={`${certificationScore}%`}
          />

        </div>

        {/* ==========================
            NEXT ACTION
        =========================== */}

        <section className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />

                <span className="text-sm font-semibold text-indigo-700">
                  Your next action
                </span>
              </div>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {nextActionTitle}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                {nextActionDescription}
              </p>
            </div>

            <a
              href={nextActionLink}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </a>

          </div>

        </section>

        {/* ==========================
            CURRENT JOURNEY
        =========================== */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* CURRENT LEARNING */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Current Learning
                  </h2>

                  <p className="text-xs text-gray-500">
                    Continue where you left off
                  </p>
                </div>
              </div>

              <a
                href="/learning"
                className="text-sm font-semibold text-indigo-600"
              >
                View all
              </a>
            </div>

            {currentLearning ? (
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {currentLearning.name}
                </h3>

                {currentLearning.provider && (
                  <p className="mt-1 text-sm text-indigo-600">
                    {currentLearning.provider}
                  </p>
                )}

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-500">
                      Progress
                    </span>

                    <span className="font-semibold text-gray-700">
                      {currentLearningProgress}%
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${currentLearningProgress}%`,
                      }}
                    />
                  </div>
                </div>

                <a
                  href="/learning"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
                >
                  Continue learning
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <EmptyState
                icon={
                  <BookOpen className="h-6 w-6 text-gray-400" />
                }
                text="No learning resource started yet."
                link="/learning"
                linkText="Explore learning"
              />
            )}

          </section>

          {/* CURRENT PROJECT */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <FolderKanban className="h-5 w-5 text-purple-600" />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Current Project
                  </h2>

                  <p className="text-xs text-gray-500">
                    Build practical experience
                  </p>
                </div>
              </div>

              <a
                href="/projects"
                className="text-sm font-semibold text-indigo-600"
              >
                View all
              </a>
            </div>

            {currentProject ? (
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {currentProject.title}
                </h3>

                {currentProject.description && (
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {currentProject.description}
                  </p>
                )}

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-500">
                      Progress
                    </span>

                    <span className="font-semibold text-gray-700">
                      {currentProjectProgress}%
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-purple-600"
                      style={{
                        width: `${currentProjectProgress}%`,
                      }}
                    />
                  </div>
                </div>

                <a
                  href={`/projects/${currentProject.id}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
                >
                  Continue project
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <EmptyState
                icon={
                  <FolderKanban className="h-6 w-6 text-gray-400" />
                }
                text="No project started yet."
                link="/projects"
                linkText="Explore projects"
              />
            )}

          </section>

        </div>

        {/* ==========================
            SKILL GAP
        =========================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Biggest Skill Gap
              </h2>

              <p className="text-xs text-gray-500">
                The area that needs the most attention
              </p>
            </div>
          </div>

          {biggestGap ? (
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {biggestGap.skill_name}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Current level:{" "}
                  <strong>
                    {Math.round(
                      biggestGap.skill_score ?? 0
                    )}
                  </strong>
                  {" "}· Required:{" "}
                  <strong>
                    {biggestGap.required_level}
                  </strong>
                  {" "}· Gap:{" "}
                  <strong className="text-amber-600">
                    {Math.round(
                      biggestGap.skill_gap ?? 0
                    )}
                  </strong>
                </p>
              </div>

              <a
                href="/learning"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Improve this skill
                <ArrowRight className="h-4 w-4" />
              </a>

            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Complete your assessment to identify your skill gaps.
            </p>
          )}

        </section>

        {/* ==========================
            ASSESSMENT STATUS
        =========================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <ClipboardCheck className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  Assessment
                </h2>

                <p className="text-sm text-gray-500">
                  {assessment
                    ? `Latest score: ${assessment.score ?? 0}%`
                    : "Your assessment has not been completed yet."}
                </p>
              </div>
            </div>

            <a
              href={`/assessment?role=${role?.id ?? ""}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {assessment
                ? "Retake Assessment"
                : "Take Assessment"}

              <ArrowRight className="h-4 w-4" />
            </a>

          </div>

        </section>

      </div>
    </main>
  );
}

/* =================================
   DASHBOARD STAT
================================= */

function DashboardStat({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}
        >
          {icon}
        </div>

        <span className="text-2xl font-bold text-gray-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-gray-500">
        {label}
      </p>

    </div>
  );
}

/* =================================
   EMPTY STATE
================================= */

function EmptyState({
  icon,
  text,
  link,
  linkText,
}: {
  icon: React.ReactNode;
  text: string;
  link: string;
  linkText: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-6">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
        {icon}
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {text}
      </p>

      <a
        href={link}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
      >
        {linkText}
        <ArrowRight className="h-4 w-4" />
      </a>

    </div>
  );
}