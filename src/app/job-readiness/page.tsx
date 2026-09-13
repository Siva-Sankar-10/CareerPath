"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FolderKanban,
  GraduationCap,
  Target,
  TrendingUp,
  AlertTriangle,
  Circle,
} from "lucide-react";

type Profile = {
  target_role_id: number | null;
};

type CareerRole = {
  id: number;
  name: string;
};

type Assessment = {
  score: number | null;
  correct_answers: number | null;
  total_questions: number | null;
  completed_at: string | null;
};

type SkillGap = {
  skill_name: string;
  skill_score: number | null;
  required_level: number;
  skill_gap: number | null;
  status: string | null;
  priority: string | null;
  created_at: string;
};

type ProgressItem = {
  progress: number | null;
  completed: boolean;
};

type ReadinessArea = {
  key: "skills" | "projects" | "learning" | "assessment" | "certifications";
  score: number;
  weight: number;
  available: boolean;
};

export default function JobReadinessPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState<CareerRole | null>(null);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [skills, setSkills] = useState<SkillGap[]>([]);
  const [learning, setLearning] = useState<ProgressItem[]>([]);
  const [projects, setProjects] = useState<ProgressItem[]>([]);
  const [certifications, setCertifications] =
    useState<ProgressItem[]>([]);

  useEffect(() => {
    loadReadiness();
  }, []);

  async function loadReadiness() {
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

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("target_role_id")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
      }

      const profile = profileData as Profile | null;

      /* ================================
         ROLE
      ================================= */

      if (profile?.target_role_id) {
        const { data: roleData, error: roleError } =
          await supabase
            .from("career_roles")
            .select("id, name")
            .eq("id", profile.target_role_id)
            .maybeSingle();

        if (roleError) {
          console.error("ROLE ERROR:", roleError);
        }

        setRole(roleData);
      } else {
        setRole(null);
      }

      /* ================================
         ASSESSMENT
      ================================= */

      const {
        data: assessmentData,
        error: assessmentError,
      } = await supabase
        .from("assessment_attempts")
        .select(
          `
            score,
            correct_answers,
            total_questions,
            completed_at
          `
        )
        .eq("user_id", user.id)
        .eq("role_id", profile?.target_role_id ?? -1)
        .not("completed_at", "is", null)
        .order("completed_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (assessmentError) {
        console.error(
          "ASSESSMENT ERROR:",
          assessmentError
        );
      }

      setAssessment(assessmentData);

      /* ================================
         SKILL GAPS
      ================================= */

      const {
        data: skillData,
        error: skillError,
      } = await supabase
        .from("user_skill_gaps")
        .select(
          `
            skill_name,
            skill_score,
            required_level,
            skill_gap,
            status,
            priority,
            created_at
          `
        )
        .eq("user_id", user.id)
        .eq("role_id", profile?.target_role_id ?? -1)
        .order("created_at", {
          ascending: false,
        });

      if (skillError) {
        console.error(
          "SKILL GAP ERROR:",
          skillError
        );
      }

      /*
       * Keep only the newest result
       * for each skill.
       */
      const latestSkills: SkillGap[] = [];
      const seenSkills = new Set<string>();

      for (const item of skillData || []) {
        if (!seenSkills.has(item.skill_name)) {
          seenSkills.add(item.skill_name);

          latestSkills.push({
            skill_name: item.skill_name,
            skill_score: item.skill_score,
            required_level: item.required_level,
            skill_gap: item.skill_gap,
            status: item.status,
            priority: item.priority,
            created_at: item.created_at,
          });
        }
      }

      setSkills(latestSkills);

      /* ================================
         LEARNING
      ================================= */

      const {
        data: learningData,
        error: learningError,
      } = await supabase
        .from("user_learning_progress")
        .select(
          `
            progress,
            completed
          `
        )
        .eq("user_id", user.id);

      if (learningError) {
        console.error(
          "LEARNING ERROR:",
          learningError
        );
      }

      setLearning(learningData || []);

      /* ================================
         PROJECTS
      ================================= */

      const {
        data: projectData,
        error: projectError,
      } = await supabase
        .from("user_project_progress")
        .select(
          `
            progress,
            completed
          `
        )
        .eq("user_id", user.id);

      if (projectError) {
        console.error(
          "PROJECT ERROR:",
          projectError
        );
      }

      setProjects(projectData || []);

      /* ================================
         CERTIFICATIONS
      ================================= */

      const {
        data: certificationData,
        error: certificationError,
      } = await supabase
        .from("user_certification_progress")
        .select(
          `
            progress,
            completed
          `
        )
        .eq("user_id", user.id);

      if (certificationError) {
        console.error(
          "CERTIFICATION ERROR:",
          certificationError
        );
      }

      setCertifications(certificationData || []);
    } catch (error) {
      console.error(
        "JOB READINESS ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================================
     ASSESSED SKILLS
  ================================= */

  const assessedSkills = useMemo(
    () =>
      skills.filter(
        (skill) => skill.skill_score !== null
      ),
    [skills]
  );

  /* ================================
     SKILL SCORE
  ================================= */

  const skillScore = useMemo(() => {
    if (!assessedSkills.length) {
      return 0;
    }

    return Math.round(
      assessedSkills.reduce(
        (sum, skill) =>
          sum + Number(skill.skill_score ?? 0),
        0
      ) / assessedSkills.length
    );
  }, [assessedSkills]);

  /* ================================
     LEARNING SCORE
  ================================= */

  const learningScore = useMemo(() => {
    if (!learning.length) {
      return 0;
    }

    return Math.round(
      learning.reduce(
        (sum, item) =>
          sum + Number(item.progress ?? 0),
        0
      ) / learning.length
    );
  }, [learning]);

  /* ================================
     PROJECT SCORE
  ================================= */

  const projectScore = useMemo(() => {
    if (!projects.length) {
      return 0;
    }

    return Math.round(
      projects.reduce(
        (sum, item) =>
          sum + Number(item.progress ?? 0),
        0
      ) / projects.length
    );
  }, [projects]);

  /* ================================
     CERTIFICATION SCORE
  ================================= */

  const certificationScore = useMemo(() => {
    if (!certifications.length) {
      return 0;
    }

    return Math.round(
      certifications.reduce(
        (sum, item) =>
          sum + Number(item.progress ?? 0),
        0
      ) / certifications.length
    );
  }, [certifications]);

  /* ================================
     ASSESSMENT SCORE
  ================================= */

  const assessmentScore = useMemo(() => {
    if (!assessment) {
      return 0;
    }

    /*
     * assessment_attempts.score is stored
     * as a percentage score.
     */
    return Math.round(
      Number(assessment.score ?? 0)
    );
  }, [assessment]);

  /* ================================
     WEIGHTS
  ================================= */

  const WEIGHTS = {
    skills: 30,
    projects: 25,
    learning: 15,
    assessment: 20,
    certifications: 10,
  };

  /* ================================
     AVAILABLE AREAS
  ================================= */

  const readinessAreas = useMemo<ReadinessArea[]>(
    () => [
      {
        key: "skills",
        score: skillScore,
        weight: WEIGHTS.skills,
        available: assessedSkills.length > 0,
      },
      {
        key: "projects",
        score: projectScore,
        weight: WEIGHTS.projects,
        available: projects.length > 0,
      },
      {
        key: "learning",
        score: learningScore,
        weight: WEIGHTS.learning,
        available: learning.length > 0,
      },
      {
        key: "assessment",
        score: assessmentScore,
        weight: WEIGHTS.assessment,
        available: assessment !== null,
      },
      {
        key: "certifications",
        score: certificationScore,
        weight: WEIGHTS.certifications,
        available: certifications.length > 0,
      },
    ],
    [
      skillScore,
      projectScore,
      learningScore,
      assessmentScore,
      assessedSkills.length,
      projects.length,
      learning.length,
      certifications.length,
      assessment,
    ]
  );

  /* ================================
     READINESS
  ================================= */

  const readiness = useMemo(() => {
    const availableAreas =
      readinessAreas.filter(
        (area) => area.available
      );

    if (!availableAreas.length) {
      return 0;
    }

    /*
     * Normalize against only the weights
     * for areas that actually have evidence.
     *
     * Example:
     * Assessment = 50%
     *
     * Instead of:
     * 50 × 20% = 10%
     *
     * the displayed readiness is:
     * 10 / 20 × 100 = 50%
     *
     * This prevents unstarted areas from
     * artificially reducing readiness.
     */
    const weightedScore =
      availableAreas.reduce(
        (sum, area) =>
          sum +
          area.score *
            (area.weight / 100),
        0
      );

    const availableWeight =
      availableAreas.reduce(
        (sum, area) =>
          sum + area.weight,
        0
      );

    if (availableWeight === 0) {
      return 0;
    }

    return Math.round(
      (weightedScore / availableWeight) * 100
    );
  }, [readinessAreas]);

  /* ================================
     READINESS LABEL
  ================================= */

  const readinessLabel =
    readiness >= 85
      ? "Highly Ready"
      : readiness >= 70
        ? "Nearly Ready"
        : readiness >= 50
          ? "Developing"
          : "Needs Improvement";

  const readinessMessage =
    readiness >= 85
      ? "You have built a strong foundation across the major CareerPath readiness areas."
      : readiness >= 70
        ? "You are getting close to job readiness. Focus on your remaining skill and practical gaps."
        : readiness >= 50
          ? "You are making progress, but several areas still need development before you are strongly job-ready."
          : "Continue building your core skills, practical experience and learning progress.";

  /* ================================
     BIGGEST GAP
  ================================= */

  const biggestGap = useMemo(() => {
    if (!assessedSkills.length) {
      return null;
    }

    const positiveGaps =
      assessedSkills.filter(
        (skill) =>
          Number(skill.skill_gap ?? 0) > 0
      );

    if (!positiveGaps.length) {
      return null;
    }

    return [...positiveGaps].sort(
      (a, b) =>
        Number(b.skill_gap ?? 0) -
        Number(a.skill_gap ?? 0)
    )[0];
  }, [assessedSkills]);

  /* ================================
     STRONGEST SKILL
  ================================= */

  const strongestSkill = useMemo(() => {
    if (!assessedSkills.length) {
      return null;
    }

    return [...assessedSkills].sort(
      (a, b) =>
        Number(b.skill_score ?? 0) -
        Number(a.skill_score ?? 0)
    )[0];
  }, [assessedSkills]);

  /* ================================
     NEXT ACTION
  ================================= */

  const nextAction = useMemo(() => {
    if (!role) {
      return {
        title: "Select your career",
        description:
          "Choose a target career so CareerPath can personalize your journey.",
        href: "/career",
        button: "Select Career",
      };
    }

    if (!assessment) {
      return {
        title: "Complete your assessment",
        description:
          "Take the 20-question assessment so CareerPath can identify your strengths and skill gaps.",
        href: `/assessment?role=${role.id}`,
        button: "Take Assessment",
      };
    }

    if (
      biggestGap &&
      Number(biggestGap.skill_gap ?? 0) > 0
    ) {
      return {
        title: `Improve ${biggestGap.skill_name}`,
        description:
          "This is currently your largest assessed skill gap. Focus on the recommended learning resources before moving to the next major gap.",
        href: "/learning",
        button: "Go to Learning",
      };
    }

    if (
      learning.length === 0 ||
      learningScore < 100
    ) {
      return {
        title: "Continue learning",
        description:
          "Continue the recommended learning resources and build stronger knowledge for your target role.",
        href: "/learning",
        button: "Continue Learning",
      };
    }

    if (
      projects.length === 0 ||
      projectScore < 100
    ) {
      return {
        title: "Build a practical project",
        description:
          "Apply your knowledge through a real project and strengthen your practical experience.",
        href: "/projects",
        button: "View Projects",
      };
    }

    if (
      certifications.length === 0 ||
      certificationScore < 100
    ) {
      return {
        title: "Explore certifications",
        description:
          "Work toward a relevant credential if it supports your target career.",
        href: "/certifications",
        button: "View Certifications",
      };
    }

    return {
      title: "Review your job readiness",
      description:
        "Your major CareerPath areas are progressing. Continue improving your weakest skills and practical experience.",
      href: "/progress",
      button: "View Progress",
    };
  }, [
    role,
    assessment,
    biggestGap,
    learning.length,
    learningScore,
    projects.length,
    projectScore,
    certifications.length,
    certificationScore,
  ]);

  /* ================================
     LOADING
  ================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9fc] p-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-64 rounded bg-gray-200" />

          <div className="mt-3 h-4 w-96 rounded bg-gray-200" />

          <div className="mt-8 h-72 rounded-2xl bg-gray-200" />

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

        {/* HEADER */}

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
            <Target className="h-6 w-6 text-indigo-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Job Readiness
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              See how prepared you are for your target career.
            </p>
          </div>
        </div>

        {/* TARGET ROLE */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Target Career
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-900">
            {role?.name ?? "Career role not selected"}
          </h2>
        </div>

        {/* READINESS HERO */}

        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-7">

            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

              <div className="max-w-xl">
                <p className="text-sm font-semibold text-indigo-600">
                  Overall Job Readiness
                </p>

                <h2 className="mt-2 text-5xl font-bold text-gray-900">
                  {readiness}%
                </h2>

                <div className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {readinessLabel}
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {readinessMessage}
                </p>

                <p className="mt-3 text-xs text-gray-400">
                  Based on {readinessAreas.filter(
                    (area) => area.available
                  ).length} of 5 readiness areas currently started.
                </p>
              </div>

              <div className="flex h-40 w-40 shrink-0 items-center justify-center">
                <div
                  className="flex h-40 w-40 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#4f46e5 ${readiness}%, #eef2ff 0)`,
                  }}
                >
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white">
                    <span className="text-3xl font-bold text-gray-900">
                      {readiness}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                style={{
                  width: `${readiness}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* NEXT ACTION */}

        <section className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-sm font-semibold text-indigo-700">
                Recommended Next Step
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {nextAction.title}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                {nextAction.description}
              </p>
            </div>

            <a
              href={nextAction.href}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {nextAction.button}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* READINESS BREAKDOWN */}

        <section className="mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Readiness Breakdown
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your readiness combines knowledge, skills, learning,
              practical projects and certifications.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">

            <ReadinessCard
              title="Skills"
              score={skillScore}
              weight="30%"
              icon={
                <Target className="h-5 w-5 text-indigo-600" />
              }
              bg="bg-indigo-100"
              available={assessedSkills.length > 0}
            />

            <ReadinessCard
              title="Projects"
              score={projectScore}
              weight="25%"
              icon={
                <FolderKanban className="h-5 w-5 text-purple-600" />
              }
              bg="bg-purple-100"
              available={projects.length > 0}
            />

            <ReadinessCard
              title="Learning"
              score={learningScore}
              weight="15%"
              icon={
                <BookOpen className="h-5 w-5 text-blue-600" />
              }
              bg="bg-blue-100"
              available={learning.length > 0}
            />

            <ReadinessCard
              title="Assessment"
              score={assessmentScore}
              weight="20%"
              icon={
                <ClipboardCheck className="h-5 w-5 text-green-600" />
              }
              bg="bg-green-100"
              available={assessment !== null}
            />

            <ReadinessCard
              title="Certifications"
              score={certificationScore}
              weight="10%"
              icon={
                <GraduationCap className="h-5 w-5 text-amber-600" />
              }
              bg="bg-amber-100"
              available={certifications.length > 0}
            />
          </div>
        </section>

        {/* SKILL INSIGHTS */}

        <div className="mb-8 grid gap-5 md:grid-cols-2">

          {strongestSkill && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />

                <span className="text-sm font-semibold text-green-700">
                  Strongest Skill
                </span>
              </div>

              <h3 className="mt-3 text-2xl font-bold text-gray-900">
                {strongestSkill.skill_name}
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Current score:{" "}
                <strong>
                  {Math.round(
                    Number(
                      strongestSkill.skill_score ?? 0
                    )
                  )}
                  %
                </strong>
              </p>
            </div>
          )}

          {biggestGap && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />

                <span className="text-sm font-semibold text-amber-700">
                  Biggest Skill Gap
                </span>
              </div>

              <h3 className="mt-3 text-2xl font-bold text-gray-900">
                {biggestGap.skill_name}
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Skill gap:{" "}
                <strong>
                  {Math.round(
                    Number(
                      biggestGap.skill_gap ?? 0
                    )
                  )}
                </strong>
                %
              </p>
            </div>
          )}
        </div>

        {/* CAREERPATH STATUS */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            CareerPath Status
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Your current position in the CareerPath journey.
          </p>

          <div className="mt-5 space-y-4">

            <StatusRow
              label="Career selected"
              status={role ? "completed" : "not_started"}
            />

            <StatusRow
              label="Assessment"
              status={
                assessment
                  ? "completed"
                  : "not_started"
              }
            />

            <StatusRow
              label="Skills assessment"
              status={
                assessedSkills.length > 0
                  ? "completed"
                  : "not_started"
              }
            />

            <StatusRow
              label="Learning"
              status={getProgressStatus(learning)}
            />

            <StatusRow
              label="Project"
              status={getProgressStatus(projects)}
            />

            <StatusRow
              label="Certification"
              status={getProgressStatus(certifications)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

/* =================================
   READINESS CARD
================================= */

function ReadinessCard({
  title,
  score,
  weight,
  icon,
  bg,
  available,
}: {
  title: string;
  score: number;
  weight: string;
  icon: React.ReactNode;
  bg: string;
  available: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}
        >
          {icon}
        </div>

        <span className="text-xs font-semibold text-gray-400">
          Weight {weight}
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold text-gray-900">
        {available ? `${score}%` : "—"}
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">

        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{
            width: available
              ? `${Math.min(score, 100)}%`
              : "0%",
          }}
        />
      </div>

      {!available && (
        <p className="mt-2 text-xs text-gray-400">
          Not started
        </p>
      )}

      {available && score >= 100 && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Complete
        </p>
      )}
    </div>
  );
}

/* =================================
   PROGRESS STATUS
================================= */

function getProgressStatus(
  items: ProgressItem[]
): "not_started" | "in_progress" | "completed" {
  if (!items.length) {
    return "not_started";
  }

  const allCompleted =
    items.every(
      (item) =>
        item.completed ||
        Number(item.progress ?? 0) >= 100
    );

  if (allCompleted) {
    return "completed";
  }

  return "in_progress";
}

/* =================================
   STATUS ROW
================================= */

function StatusRow({
  label,
  status,
}: {
  label: string;
  status:
    | "not_started"
    | "in_progress"
    | "completed";
}) {
  if (status === "completed") {
    return (
      <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>

        <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Completed
        </span>
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>

        <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-600">
          <Circle className="h-4 w-4 fill-current" />
          In Progress
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <span className="text-sm font-medium text-gray-700">
        {label}
      </span>

      <span className="text-sm font-medium text-gray-400">
        Not Started
      </span>
    </div>
  );
}