"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FolderKanban,
  GraduationCap,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

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
  created_at: string;
};

type LearningProgress = {
  progress: number | null;
  completed: boolean;
};

type ProjectProgress = {
  progress: number | null;
  completed: boolean;
};

type CertificationProgress = {
  progress: number | null;
  completed: boolean;
};

type Profile = {
  target_role_id: number | null;
};

type Role = {
  name: string;
};

export default function ProgressPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [skills, setSkills] = useState<SkillGap[]>([]);

  const [learning, setLearning] =
    useState<LearningProgress[]>([]);

  const [projects, setProjects] =
    useState<ProjectProgress[]>([]);

  const [certifications, setCertifications] =
    useState<CertificationProgress[]>([]);

  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
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
        console.error(
          "PROFILE PROGRESS ERROR:",
          profileError
        );
      }

      const profile = profileData as Profile | null;

      /* ================================
         ROLE
      ================================= */

      if (profile?.target_role_id) {
        const { data: roleData, error: roleError } =
          await supabase
            .from("career_roles")
            .select("name")
            .eq("id", profile.target_role_id)
            .maybeSingle();

        if (roleError) {
          console.error(
            "ROLE PROGRESS ERROR:",
            roleError
          );
        }

        setRole(roleData);
      }

      /* ================================
         LATEST ASSESSMENT
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
        .not("completed_at", "is", null)
        .order("completed_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (assessmentError) {
        console.error(
          "ASSESSMENT PROGRESS ERROR:",
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
            created_at
          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (skillError) {
        console.error(
          "SKILL PROGRESS ERROR:",
          skillError
        );
      }

      const latestSkills: SkillGap[] = [];
      const seenSkills = new Set<string>();

      for (const skill of skillData || []) {
        if (!seenSkills.has(skill.skill_name)) {
          seenSkills.add(skill.skill_name);

          latestSkills.push({
            skill_name: skill.skill_name,
            skill_score: skill.skill_score,
            required_level: skill.required_level,
            skill_gap: skill.skill_gap,
            created_at: skill.created_at,
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
          "LEARNING PROGRESS ERROR:",
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
          "PROJECT PROGRESS ERROR:",
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
          "CERTIFICATION PROGRESS ERROR:",
          certificationError
        );
      }

      setCertifications(certificationData || []);
    } catch (error) {
      console.error(
        "PROGRESS PAGE ERROR:",
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
     SKILL PROGRESS
  ================================= */

  const skillProgress =
    assessedSkills.length > 0
      ? Math.round(
          assessedSkills.reduce(
            (sum, skill) =>
              sum + Number(skill.skill_score ?? 0),
            0
          ) / assessedSkills.length
        )
      : null;

  /* ================================
     LEARNING PROGRESS
  ================================= */

  const learningProgress =
    learning.length > 0
      ? Math.round(
          learning.reduce(
            (sum, item) =>
              sum + Number(item.progress ?? 0),
            0
          ) / learning.length
        )
      : null;

  const learningCompleted = learning.filter(
    (item) =>
      item.completed ||
      Number(item.progress ?? 0) >= 100
  ).length;

  /* ================================
     PROJECT PROGRESS
  ================================= */

  const projectProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce(
            (sum, item) =>
              sum + Number(item.progress ?? 0),
            0
          ) / projects.length
        )
      : null;

  const projectsCompleted = projects.filter(
    (item) =>
      item.completed ||
      Number(item.progress ?? 0) >= 100
  ).length;

  /* ================================
     CERTIFICATION PROGRESS
  ================================= */

  const certificationProgress =
    certifications.length > 0
      ? Math.round(
          certifications.reduce(
            (sum, item) =>
              sum + Number(item.progress ?? 0),
            0
          ) / certifications.length
        )
      : null;

  const certificationsCompleted =
    certifications.filter(
      (item) =>
        item.completed ||
        Number(item.progress ?? 0) >= 100
    ).length;

  /* ================================
     ASSESSMENT PROGRESS
  ================================= */

  const assessmentProgress =
    assessment !== null
      ? Math.round(Number(assessment.score ?? 0))
      : null;

  /* ================================
     OVERALL PROGRESS
     
     Only include areas that have
     actually started.
  ================================= */

  const progressValues = [
    assessmentProgress,
    skillProgress,
    learningProgress,
    projectProgress,
    certificationProgress,
  ].filter(
    (value): value is number =>
      value !== null
  );

  const overallProgress =
    progressValues.length > 0
      ? Math.round(
          progressValues.reduce(
            (sum, value) => sum + value,
            0
          ) / progressValues.length
        )
      : 0;

  /* ================================
     STRONGEST SKILL
  ================================= */

  const strongestSkill =
    assessedSkills.length > 0
      ? [...assessedSkills].sort(
          (a, b) =>
            Number(b.skill_score ?? 0) -
            Number(a.skill_score ?? 0)
        )[0]
      : null;

  /* ================================
     BIGGEST SKILL GAP
  ================================= */

  const biggestGapSkill =
    assessedSkills.length > 0
      ? [...assessedSkills].sort(
          (a, b) =>
            Number(b.skill_gap ?? 0) -
            Number(a.skill_gap ?? 0)
        )[0]
      : null;

  /* ================================
     NEXT ACTION
  ================================= */

  let nextAction = "Complete your assessment";

  let nextActionDescription =
    "Take the 20-question assessment so CareerPath can identify your strengths and skill gaps.";

  let nextActionHref = "/assessment";

  if (!assessment) {
    nextAction =
      "Complete your assessment";

    nextActionDescription =
      "Take the 20-question assessment to identify your current strengths and skill gaps.";

    nextActionHref = "/assessment";
  } else if (
    biggestGapSkill &&
    Number(biggestGapSkill.skill_gap ?? 0) > 0
  ) {
    nextAction =
      `Improve ${biggestGapSkill.skill_name}`;

    nextActionDescription =
      "This is currently your largest identified skill gap. Start with the recommended learning resources.";

    nextActionHref = "/learning";
  } else if (
    learning.length === 0 ||
    Number(learningProgress ?? 0) < 100
  ) {
    nextAction =
      "Continue learning";

    nextActionDescription =
      "Continue your recommended learning resources and complete the remaining items.";

    nextActionHref = "/learning";
  } else if (
    projects.length === 0 ||
    Number(projectProgress ?? 0) < 100
  ) {
    nextAction =
      "Build a project";

    nextActionDescription =
      "Apply your knowledge by completing a practical project.";

    nextActionHref = "/projects";
  } else if (
    certifications.length === 0 ||
    Number(certificationProgress ?? 0) < 100
  ) {
    nextAction =
      "Work toward a certification";

    nextActionDescription =
      "Continue your certification preparation and work toward a recognized credential.";

    nextActionHref = "/certifications";
  } else {
    nextAction =
      "Review your job readiness";

    nextActionDescription =
      "Your main CareerPath areas are progressing. Review your current job-readiness status.";

    nextActionHref = "/job-readiness";
  }

  /* ================================
     LOADING
  ================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9fc] p-8">
        <div className="mx-auto max-w-7xl animate-pulse">

          <div className="h-8 w-52 rounded-lg bg-gray-200" />

          <div className="mt-3 h-4 w-96 rounded-lg bg-gray-200" />

          <div className="mt-4 h-9 w-56 rounded-full bg-gray-200" />

          <div className="mt-8 h-60 rounded-2xl bg-gray-200" />

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl bg-gray-200"
              />
            ))}
          </div>

          <div className="mt-8 h-80 rounded-2xl bg-gray-200" />

          <div className="mt-8 h-80 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9fc] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* ================================
            HEADER
        ================================= */}

        <div className="mb-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Progress
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Track your journey from learning to job readiness.
              </p>
            </div>

          </div>

          {role && (
            <div className="mt-4 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              Target Role: {role.name}
            </div>
          )}

        </div>

        {/* ================================
            OVERALL PROGRESS
        ================================= */}

        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

            <div className="max-w-2xl">

              <div className="flex items-center gap-2">

                <p className="text-sm font-semibold text-indigo-600">
                  CareerPath Progress
                </p>

                {overallProgress >= 75 && (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Strong progress
                  </span>
                )}

              </div>

              <h2 className="mt-2 text-5xl font-bold tracking-tight text-gray-900">
                {overallProgress}%
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Your overall progress is based only on areas
                currently tracked in your CareerPath journey.
              </p>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-100">

                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                  style={{
                    width: `${overallProgress}%`,
                  }}
                />

              </div>

            </div>

            {/* CIRCLE */}

            <div className="relative h-36 w-36 shrink-0">

              <div
                className="flex h-36 w-36 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#4f46e5 ${overallProgress}%, #eef2ff 0)`,
                }}
              >

                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white">

                  <span className="text-3xl font-bold text-gray-900">
                    {overallProgress}%
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ================================
            NEXT ACTION
        ================================= */}

        <section className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex gap-4">

              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>

              <div>

                <p className="text-sm font-semibold text-indigo-700">
                  Your Next Action
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {nextAction}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                  {nextActionDescription}
                </p>

              </div>

            </div>

            <a
              href={nextActionHref}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Continue

              <ArrowRight className="h-4 w-4" />

            </a>

          </div>

        </section>

        {/* ================================
            AREA CARDS
        ================================= */}

        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">

          <ProgressCard
            icon={
              <ClipboardCheck className="h-6 w-6 text-green-600" />
            }
            iconBg="bg-green-100"
            title="Assessment"
            value={
              assessmentProgress !== null
                ? `${assessmentProgress}%`
                : "—"
            }
            description={
              assessment
                ? `${assessment.correct_answers ?? 0}/${assessment.total_questions ?? 0} correct`
                : "Not completed"
            }
          />

          <ProgressCard
            icon={
              <Target className="h-6 w-6 text-indigo-600" />
            }
            iconBg="bg-indigo-100"
            title="Skills"
            value={
              skillProgress !== null
                ? `${skillProgress}%`
                : "—"
            }
            description={
              assessedSkills.length > 0
                ? `${assessedSkills.length} assessed skills`
                : "Assessment required"
            }
          />

          <ProgressCard
            icon={
              <BookOpen className="h-6 w-6 text-blue-600" />
            }
            iconBg="bg-blue-100"
            title="Learning"
            value={
              learningProgress !== null
                ? `${learningProgress}%`
                : "—"
            }
            description={
              learning.length > 0
                ? `${learningCompleted} completed`
                : "Not started"
            }
          />

          <ProgressCard
            icon={
              <FolderKanban className="h-6 w-6 text-purple-600" />
            }
            iconBg="bg-purple-100"
            title="Projects"
            value={
              projectProgress !== null
                ? `${projectProgress}%`
                : "—"
            }
            description={
              projects.length > 0
                ? `${projectsCompleted} completed`
                : "Not started"
            }
          />

          <ProgressCard
            icon={
              <GraduationCap className="h-6 w-6 text-amber-600" />
            }
            iconBg="bg-amber-100"
            title="Certifications"
            value={
              certificationProgress !== null
                ? `${certificationProgress}%`
                : "—"
            }
            description={
              certifications.length > 0
                ? `${certificationsCompleted} completed`
                : "Not started"
            }
          />

        </div>

        {/* ================================
            ASSESSMENT
        ================================= */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <ClipboardCheck className="h-5 w-5 text-green-600" />
            </div>

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                Assessment
              </h2>

              <p className="text-sm text-gray-500">
                Your latest knowledge assessment performance.
              </p>

            </div>

          </div>

          {assessment ? (

            <div className="grid gap-4 md:grid-cols-3">

              <StatBox
                label="Score"
                value={`${Math.round(
                  Number(assessment.score ?? 0)
                )}%`}
              />

              <StatBox
                label="Correct Answers"
                value={`${assessment.correct_answers ?? 0}/${assessment.total_questions ?? 0}`}
              />

              <div className="rounded-xl bg-green-50 p-5">

                <p className="text-sm text-gray-500">
                  Assessment Status
                </p>

                <div className="mt-3 flex items-center gap-2 text-green-600">

                  <CheckCircle2 className="h-5 w-5" />

                  <span className="font-semibold">
                    Completed
                  </span>

                </div>

              </div>

            </div>

          ) : (

            <EmptyState
              title="No completed assessment yet"
              description="Complete your assessment to start measuring your skill progress."
              href="/assessment"
              buttonText="Start Assessment"
            />

          )}

        </section>

        {/* ================================
            SKILL PROGRESS
        ================================= */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-7 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                Skill Progress
              </h2>

              <p className="text-sm text-gray-500">
                Your assessed skill levels compared with the required level.
              </p>

            </div>

          </div>

          {assessedSkills.length > 0 ? (

            <div className="space-y-7">

              {assessedSkills.map((skill) => {

                const score = Math.max(
                  0,
                  Math.min(
                    100,
                    Number(skill.skill_score ?? 0)
                  )
                );

                const required = Math.max(
                  0,
                  Math.min(
                    100,
                    Number(skill.required_level ?? 0)
                  )
                );

                const gap = Math.max(
                  0,
                  Number(skill.skill_gap ?? 0)
                );

                const meetsRequirement =
                  score >= required;

                return (
                  <div
                    key={skill.skill_name}
                    className="group"
                  >

                    <div className="mb-2 flex items-center justify-between gap-4">

                      <div className="flex items-center gap-2">

                        <span className="font-semibold text-gray-800">
                          {skill.skill_name}
                        </span>

                        {meetsRequirement && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}

                      </div>

                      <span className="text-sm font-bold text-gray-700">
                        {Math.round(score)}%
                      </span>

                    </div>

                    <div className="relative h-3 overflow-hidden rounded-full bg-gray-100">

                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          meetsRequirement
                            ? "bg-green-500"
                            : score >= 50
                              ? "bg-blue-500"
                              : "bg-amber-500"
                        }`}
                        style={{
                          width: `${score}%`,
                        }}
                      />

                      {/* REQUIRED LEVEL MARKER */}

                      <div
                        className="absolute top-0 h-full w-0.5 bg-gray-700"
                        style={{
                          left: `${required}%`,
                        }}
                        title={`Required: ${Math.round(required)}%`}
                      />

                    </div>

                    <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-400">

                      <span>
                        Current: {Math.round(score)}%
                      </span>

                      <span>
                        Required: {Math.round(required)}%
                      </span>

                      <span
                        className={
                          gap > 0
                            ? "font-medium text-amber-600"
                            : "font-medium text-green-600"
                        }
                      >
                        {gap > 0
                          ? `Gap: ${Math.round(gap)}%`
                          : "Requirement met"}
                      </span>

                    </div>

                  </div>
                );
              })}

            </div>

          ) : (

            <EmptyState
              title="No skill assessment data"
              description="Complete an assessment to see your skill progress."
              href="/assessment"
              buttonText="Take Assessment"
            />

          )}

        </section>

        {/* ================================
            INSIGHTS
        ================================= */}

        <div className="mb-8 grid gap-5 md:grid-cols-2">

          {strongestSkill && (

            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

              <div className="flex items-center gap-2">

                <CheckCircle2 className="h-5 w-5 text-green-600" />

                <p className="text-sm font-semibold text-green-700">
                  Strongest Skill
                </p>

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

          {biggestGapSkill && (

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">

              <div className="flex items-center gap-2">

                <AlertCircle className="h-5 w-5 text-amber-600" />

                <p className="text-sm font-semibold text-amber-700">
                  Biggest Area to Improve
                </p>

              </div>

              <h3 className="mt-3 text-2xl font-bold text-gray-900">
                {biggestGapSkill.skill_name}
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Skill gap:{" "}
                <strong>
                  {Math.round(
                    Number(
                      biggestGapSkill.skill_gap ?? 0
                    )
                  )}
                  %
                </strong>
              </p>

            </div>

          )}

        </div>

        {/* ================================
            JOURNEY SUMMARY
        ================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-xl font-bold text-gray-900">
              Your CareerPath Journey
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Follow the recommended sequence toward job readiness.
            </p>

          </div>

          <div className="grid gap-4 md:grid-cols-5">

            <JourneyStep
              number="01"
              title="Assessment"
              completed={assessment !== null}
              href="/assessment"
            />

            <JourneyStep
              number="02"
              title="Skills"
              completed={assessedSkills.length > 0}
              href="/skills"
            />

            <JourneyStep
              number="03"
              title="Learning"
              completed={
                learning.length > 0 &&
                Number(learningProgress ?? 0) >= 100
              }
              href="/learning"
            />

            <JourneyStep
              number="04"
              title="Projects"
              completed={
                projects.length > 0 &&
                Number(projectProgress ?? 0) >= 100
              }
              href="/projects"
            />

            <JourneyStep
              number="05"
              title="Job Ready"
              completed={
                certifications.length > 0 &&
                Number(certificationProgress ?? 0) >= 100
              }
              href="/job-readiness"
            />

          </div>

        </section>

      </div>
    </main>
  );
}

/* ========================================
   PROGRESS CARD
======================================== */

function ProgressCard({
  icon,
  iconBg,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

/* ========================================
   STAT BOX
======================================== */

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-5">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
}

/* ========================================
   EMPTY STATE
======================================== */

function EmptyState({
  title,
  description,
  href,
  buttonText,
}: {
  title: string;
  description: string;
  href?: string;
  buttonText?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-7 text-center">

      <p className="font-semibold text-gray-900">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-lg text-sm text-gray-500">
        {description}
      </p>

      {href && buttonText && (
        <a
          href={href}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          {buttonText}
          <ArrowRight className="h-4 w-4" />
        </a>
      )}

    </div>
  );
}

/* ========================================
   JOURNEY STEP
======================================== */

function JourneyStep({
  number,
  title,
  completed,
  href,
}: {
  number: string;
  title: string;
  completed: boolean;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50"
    >

      <div className="flex items-center justify-between">

        <span className="text-xs font-bold text-gray-400">
          {number}
        </span>

        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
        )}

      </div>

      <p className="mt-4 font-semibold text-gray-900">
        {title}
      </p>

      <p
        className={`mt-1 text-xs font-medium ${
          completed
            ? "text-green-600"
            : "text-gray-400"
        }`}
      >
        {completed
          ? "Completed"
          : "Continue"}
      </p>

    </a>
  );
}