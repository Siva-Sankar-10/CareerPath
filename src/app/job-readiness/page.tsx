import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  full_name: string | null;
  target_role_id: number | null;
  experience_level: string | null;
  career_roles:
  | {
    id: number;
    name: string;
  }
  | {
    id: number;
    name: string;
  }[]
  | null;
};

type Assessment = {
  id: number;
  role_id: number;
  score: number | null;
  correct_answers: number | null;
  total_questions: number | null;
  started_at: string | null;
  completed_at: string | null;
};

type SkillGap = {
  attempt_id: number;
  user_id: string;
  role_id: number;
  skill_id: number;
  skill_name: string | null;
  skill_score: number | null;
  required_level: number | null;
  priority: string | null;
  skill_gap: number | null;
  status: string | null;
};

type RoleSkill = {
  skill_id: number;
  required_level: number | null;
  priority: string | null;
};

type SkillScore = {
  skill_id: number;
  skill_name: string | null;
  skill_score: number | null;
};

type LearningProgress = {
  progress?: number | null;
  percentage?: number | null;
  completion_percentage?: number | null;
  completed?: boolean | null;
};

type ProjectProgress = {
  progress?: number | null;
  percentage?: number | null;
  completion_percentage?: number | null;
  completed?: boolean | null;
};

function clamp(value: number): number {
  return Math.max(
    0,
    Math.min(100, value)
  );
}

function round(value: number): number {
  return Math.round(value);
}

function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  return words
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join("");
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return round(
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  );
}

function getReadinessStatus(
  score: number
) {
  if (score >= 90) {
    return {
      label: "Job Ready",
      description:
        "Your current profile shows strong alignment with your target career.",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      ringClass:
        "text-emerald-600",
    };
  }

  if (score >= 75) {
    return {
      label: "Nearly Job Ready",
      description:
        "You have built a strong foundation, but a few areas still need attention.",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
      ringClass:
        "text-blue-600",
    };
  }

  if (score >= 60) {
    return {
      label: "Developing",
      description:
        "You are making good progress toward your target career.",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
      ringClass:
        "text-amber-600",
    };
  }

  if (score >= 40) {
    return {
      label:
        "Building Foundations",
      description:
        "You have started developing the required skills, but several areas need improvement.",
      className:
        "border-orange-200 bg-orange-50 text-orange-700",
      ringClass:
        "text-orange-600",
    };
  }

  return {
    label: "Not Ready Yet",
    description:
      "Focus on your highest-priority skill gaps and follow your personalized roadmap.",
    className:
      "border-red-200 bg-red-50 text-red-700",
    ringClass:
      "text-red-600",
  };
}

function getProgressValue(
  row:
    | LearningProgress
    | ProjectProgress
): number {
  if (
    typeof row.progress ===
    "number"
  ) {
    return clamp(row.progress);
  }

  if (
    typeof row.percentage ===
    "number"
  ) {
    return clamp(
      row.percentage
    );
  }

  if (
    typeof row.completion_percentage ===
    "number"
  ) {
    return clamp(
      row.completion_percentage
    );
  }

  if (
    row.completed === true
  ) {
    return 100;
  }

  return 0;
}

export default async function JobReadinessPage() {
  const supabase =
    await createClient();

  // =========================================================
  // 1. AUTH
  // =========================================================

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================================================
  // 2. PROFILE
  // =========================================================

  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
        full_name,
        target_role_id,
        experience_level,
        career_roles (
          id,
          name
        )
      `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "PROFILE ERROR:",
      profileError
    );
  }

  const profile =
    profileData as Profile | null;

  const targetRoleId =
    profile?.target_role_id ??
    null;

  const roleData =
    profile?.career_roles;

  const targetRole =
    Array.isArray(roleData)
      ? roleData[0]?.name ??
      "Career Goal"
      : roleData?.name ??
      "Career Goal";

  const userName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "User";

  const initials =
    getInitials(userName);

  // =========================================================
  // 3. LATEST COMPLETED ASSESSMENT
  // =========================================================

  const {
    data: assessmentData,
    error: assessmentError,
  } =
    await supabase
      .from("assessment_attempts")
      .select(
        `
          id,
          role_id,
          score,
          correct_answers,
          total_questions,
          started_at,
          completed_at
        `
      )
      .eq("user_id", user.id)
      .not(
        "completed_at",
        "is",
        null
      )
      .order(
        "completed_at",
        {
          ascending: false,
        }
      )
      .order(
        "id",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

  if (assessmentError) {
    console.error(
      "ASSESSMENT ERROR:",
      assessmentError
    );
  }

  const assessment =
    assessmentData as Assessment | null;

  console.log(
    "JOB READINESS - LATEST ASSESSMENT:",
    assessment
  );

  const assessmentScore =
    assessment
      ? clamp(
        Number(
          assessment.score ?? 0
        )
      )
      : 0;

  // =========================================================
  // 4. LOAD SKILL GAPS
  // =========================================================

  let skillGaps: SkillGap[] =
    [];

  if (assessment) {
    const {
      data: existingGaps,
      error: gapError,
    } =
      await supabase
        .from("user_skill_gaps")
        .select(
          `
            attempt_id,
            user_id,
            role_id,
            skill_id,
            skill_name,
            skill_score,
            required_level,
            priority,
            skill_gap,
            status
          `
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "attempt_id",
          assessment.id
        )
        .eq(
          "role_id",
          assessment.role_id
        )
        .order(
          "skill_gap",
          {
            ascending: false,
            nullsFirst: false,
          }
        );

    if (gapError) {
      console.warn(
        "USER SKILL GAPS ERROR:",
        gapError
      );
    }

    if (
      existingGaps &&
      existingGaps.length > 0
    ) {
      skillGaps =
        existingGaps.map(
          (row) => ({
            attempt_id:
              Number(
                row.attempt_id
              ),

            user_id:
              row.user_id,

            role_id:
              Number(
                row.role_id
              ),

            skill_id:
              Number(
                row.skill_id
              ),

            skill_name:
              row.skill_name,

            skill_score:
              row.skill_score ===
                null
                ? null
                : Number(
                  row.skill_score
                ),

            required_level:
              row.required_level ===
                null
                ? null
                : Number(
                  row.required_level
                ),

            priority:
              row.priority,

            skill_gap:
              row.skill_gap ===
                null
                ? null
                : Number(
                  row.skill_gap
                ),

            status:
              row.status,
          })
        );
    } else {
      // =======================================================
      // FALLBACK CALCULATION
      // =======================================================

      console.log(
        "No stored skill gaps found. Calculating them from assessment scores + role requirements."
      );

      // -------------------------------------------------------
      // ROLE SKILLS
      // -------------------------------------------------------

      const {
        data: roleSkills,
        error: roleSkillsError,
      } =
        await supabase
          .from("role_skills")
          .select(
            `
              skill_id,
              required_level,
              priority
            `
          )
          .eq(
            "role_id",
            assessment.role_id
          );

      if (roleSkillsError) {
        console.error(
          "ROLE SKILLS ERROR:",
          roleSkillsError
        );
      }

      // -------------------------------------------------------
      // ASSESSMENT SKILL SCORES
      // -------------------------------------------------------

      const {
        data: skillScores,
        error: skillScoresError,
      } =
        await supabase
          .from(
            "user_skill_assessment_scores"
          )
          .select(
            `
              skill_id,
              skill_name,
              skill_score
            `
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "attempt_id",
            assessment.id
          )
          .eq(
            "role_id",
            assessment.role_id
          );

      if (skillScoresError) {
        console.error(
          "SKILL SCORES ERROR:",
          skillScoresError
        );
      }

      // -------------------------------------------------------
      // SCORE MAP
      // -------------------------------------------------------

      const scoreMap =
        new Map<
          number,
          SkillScore
        >();

      (
        skillScores ??
        []
      ).forEach(
        (row) => {
          scoreMap.set(
            Number(
              row.skill_id
            ),
            {
              skill_id:
                Number(
                  row.skill_id
                ),

              skill_name:
                row.skill_name,

              skill_score:
                row.skill_score ===
                  null
                  ? null
                  : Number(
                    row.skill_score
                  ),
            }
          );
        }
      );

      // -------------------------------------------------------
      // GET SKILL NAMES
      // -------------------------------------------------------

      const skillIds =
        (
          roleSkills ??
          []
        ).map(
          (row: RoleSkill) =>
            Number(
              row.skill_id
            )
        );

      const skillNameMap =
        new Map<
          number,
          string
        >();

      if (
        skillIds.length >
        0
      ) {
        const {
          data: skillRows,
        } =
          await supabase
            .from("skills")
            .select(
              "id, name"
            )
            .in(
              "id",
              skillIds
            );

        (
          skillRows ??
          []
        ).forEach(
          (row) => {
            skillNameMap.set(
              Number(row.id),
              row.name
            );
          }
        );
      }

      // -------------------------------------------------------
      // BUILD GAPS
      // -------------------------------------------------------

      skillGaps =
        (
          roleSkills ??
          []
        ).map(
          (
            roleSkill: RoleSkill
          ) => {
            const skillId =
              Number(
                roleSkill.skill_id
              );

            const scoreRow =
              scoreMap.get(
                skillId
              );

            const score =
              scoreRow &&
                scoreRow.skill_score !==
                null
                ? Number(
                  scoreRow.skill_score
                )
                : null;

            const required =
              Number(
                roleSkill.required_level ??
                0
              );

            const gap =
              score === null
                ? null
                : Math.max(
                  0,
                  required -
                  score
                );

            let status =
              "Not Assessed";

            if (
              score !== null
            ) {
              if (
                score >=
                required
              ) {
                status =
                  "Strong";
              } else if (
                gap !== null &&
                gap >= 25
              ) {
                status =
                  "Critical Gap";
              } else if (
                gap !== null &&
                gap >= 10
              ) {
                status =
                  "Needs Improvement";
              } else {
                status =
                  "Good Progress";
              }
            }

            return {
              attempt_id:
                assessment.id,

              user_id:
                user.id,

              role_id:
                assessment.role_id,

              skill_id:
                skillId,

              skill_name:
                scoreRow?.skill_name ??
                skillNameMap.get(
                  skillId
                ) ??
                "Unnamed skill",

              skill_score:
                score,

              required_level:
                required,

              priority:
                roleSkill.priority ??
                null,

              skill_gap:
                gap,

              status,
            };
          }
        );
    }
  }

  // =========================================================
  // 5. SKILL READINESS
  // =========================================================

  const assessedSkillScores =
    skillGaps
      .filter(
        (skill) =>
          skill.skill_score !==
          null
      )
      .map(
        (skill) =>
          clamp(
            Number(
              skill.skill_score
            )
          )
      );

  const skillReadiness =
    assessedSkillScores.length >
      0
      ? average(
        assessedSkillScores
      )
      : assessment
        ? assessmentScore
        : 0;

  // =========================================================
  // 6. STRONGEST SKILL
  // =========================================================

  let strongestSkill =
    "No skill data yet";

  let strongestSkillScore =
    0;

  for (
    const skill of skillGaps
  ) {
    if (
      skill.skill_score ===
      null
    ) {
      continue;
    }

    const score =
      clamp(
        Number(
          skill.skill_score
        )
      );

    if (
      score >
      strongestSkillScore
    ) {
      strongestSkillScore =
        score;

      strongestSkill =
        skill.skill_name ||
        "Unnamed skill";
    }
  }

  // =========================================================
  // 7. BIGGEST GAP
  // =========================================================

  let biggestGapSkill =
    "No major gap identified";

  let biggestGapValue =
    0;

  let biggestGapRequired =
    0;

  let biggestGapCurrent =
    0;

  for (
    const skill of skillGaps
  ) {
    if (
      skill.skill_gap ===
      null
    ) {
      continue;
    }

    const gap =
      Math.max(
        0,
        Number(
          skill.skill_gap
        )
      );

    if (
      gap >
      biggestGapValue
    ) {
      biggestGapValue =
        gap;

      biggestGapSkill =
        skill.skill_name ||
        "Unnamed skill";

      biggestGapRequired =
        Number(
          skill.required_level ??
          0
        );

      biggestGapCurrent =
        Number(
          skill.skill_score ??
          0
        );
    }
  }

  // =========================================================
  // 8. CRITICAL GAP
  // =========================================================

  const criticalGap =
    skillGaps.find(
      (skill) => {
        const gap =
          Number(
            skill.skill_gap ??
            0
          );

        return (
          gap >= 25 ||
          skill.status ===
          "Critical Gap"
        );
      }
    );

  // =========================================================
  // 9. LEARNING
  // =========================================================

  const {
    data: learningData,
    error: learningError,
  } =
    await supabase
      .from(
        "user_learning_progress"
      )
      .select("*")
      .eq(
        "user_id",
        user.id
      );

  if (learningError) {
    console.warn(
      "LEARNING PROGRESS ERROR:",
      learningError
    );
  }

  const learningRows =
    (learningData ??
      []) as LearningProgress[];

  const learningProgress =
    learningRows.length >
      0
      ? average(
        learningRows.map(
          (
            row
          ) =>
            getProgressValue(
              row
            )
        )
      )
      : 0;

  // =========================================================
  // 10. PROJECTS
  // =========================================================

  const {
    data: projectData,
    error: projectError,
  } =
    await supabase
      .from(
        "user_project_progress"
      )
      .select("*")
      .eq(
        "user_id",
        user.id
      );

  if (projectError) {
    console.warn(
      "PROJECT PROGRESS ERROR:",
      projectError
    );
  }

  const projectRows =
    (projectData ??
      []) as ProjectProgress[];

  const projectProgress =
    projectRows.length >
      0
      ? average(
        projectRows.map(
          (
            row
          ) =>
            getProgressValue(
              row
            )
        )
      )
      : 0;

  // =========================================================
  // 11. CERTIFICATIONS
  // =========================================================

  const certificationProgress =
    0;

  // =========================================================
  // 12. JOB READINESS
  // =========================================================

  const hasAssessment =
    Boolean(
      assessment
    );

  const hasAnyProgress =
    skillGaps.length > 0 ||
    learningRows.length > 0 ||
    projectRows.length > 0;

  let jobReadiness =
    0;

  if (
    hasAssessment ||
    hasAnyProgress
  ) {
    jobReadiness =
      round(
        skillReadiness *
        0.30 +
        projectProgress *
        0.25 +
        learningProgress *
        0.15 +
        assessmentScore *
        0.20 +
        certificationProgress *
        0.10
      );
  }

  // =========================================================
  // 13. PREVENT FALSE JOB READY
  // =========================================================

  if (
    criticalGap &&
    Number(
      criticalGap.skill_gap ??
      0
    ) >= 25
  ) {
    jobReadiness =
      Math.min(
        jobReadiness,
        89
      );
  }

  jobReadiness =
    clamp(
      jobReadiness
    );

  const readiness =
    getReadinessStatus(
      jobReadiness
    );

  // =========================================================
  // 14. RECOMMENDATION
  // =========================================================

  let recommendationTitle =
    "Choose your target career";

  let recommendationText =
    "Select a target career so CareerPath can create your personalized assessment and roadmap.";

  let recommendationLink =
    "/career-selection";

  if (!targetRoleId) {
    recommendationTitle =
      "Choose your target career";

    recommendationText =
      "Select a target role before starting your assessment and personalized roadmap.";

    recommendationLink =
      "/career-selection";
  } else if (!assessment) {
    recommendationTitle =
      "Complete your skill assessment";

    recommendationText =
      "Take the 20-question assessment to identify your current skills and generate your personalized roadmap.";

    recommendationLink =
      `/assessment?role=${targetRoleId}`;
  } else if (criticalGap) {
    const skillName =
      criticalGap.skill_name ||
      "your weakest skill";

    recommendationTitle =
      `Improve ${skillName}`;

    recommendationText =
      `Your current ${skillName} score is ${round(
        Number(
          criticalGap.skill_score ??
          0
        )
      )}%, while the required level is ${round(
        Number(
          criticalGap.required_level ??
          0
        )
      )}%. Follow the recommended learning path to close this gap.`;

    recommendationLink =
      "/learning";
  } else if (
    learningProgress < 60
  ) {
    recommendationTitle =
      "Continue your learning path";

    recommendationText =
      "You have identified your skill gaps. Continue the recommended learning resources to strengthen your target-role skills.";

    recommendationLink =
      "/learning";
  } else if (
    projectProgress < 60
  ) {
    recommendationTitle =
      "Build your next project";

    recommendationText =
      "Turn your learning into practical experience by completing a project aligned with your target career.";

    recommendationLink =
      "/projects";
  } else if (
    jobReadiness >= 90
  ) {
    recommendationTitle =
      "Prepare for job applications";

    recommendationText =
      "Your readiness is strong. Focus on your portfolio, certifications, interview preparation, and relevant job opportunities.";

    recommendationLink =
      "/certifications";
  } else {
    recommendationTitle =
      "Continue your roadmap";

    recommendationText =
      "Keep improving your skills, completing learning activities, and building practical projects.";

    recommendationLink =
      "/roadmap";
  }

  // =========================================================
  // 15. ASSESSMENT LINK
  // =========================================================

  const assessmentLink =
    targetRoleId
      ? `/assessment?role=${targetRoleId}`
      : "/career-selection";

  // =========================================================
  // 16. RING
  // =========================================================

  const radius = 54;

  const circumference =
    2 * Math.PI * radius;

  const dashOffset =
    circumference -
    (jobReadiness /
      100) *
    circumference;

  // =========================================================
  // 17. RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f8f9fc]">

      {/* HEADER */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <p className="text-sm font-medium text-indigo-600">
              CareerPath
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              Job Readiness
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Understand how prepared you are for your target career.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <Link
              href="/dashboard"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Dashboard
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {initials}
            </div>

          </div>
        </div>
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* TARGET CAREER */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Your target career
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {targetRole}
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                Your readiness score combines your assessment,
                current skills, learning progress, practical projects,
                and certification progress.
              </p>

            </div>

            <Link
              href="/roadmap"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              View My Roadmap →
            </Link>

          </div>
        </section>

        {/* READINESS */}

        <section className="mb-6 grid gap-6 lg:grid-cols-3">

          {/* SCORE */}

          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

            <p className="text-sm font-semibold text-gray-500">
              Overall Job Readiness
            </p>

            <div className="mt-6 flex justify-center">

              <div className="relative h-40 w-40">

                <svg
                  className="h-40 w-40 -rotate-90"
                  viewBox="0 0 120 120"
                >

                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-100"
                  />

                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={
                      readiness.ringClass
                    }
                    strokeDasharray={
                      circumference
                    }
                    strokeDashoffset={
                      dashOffset
                    }
                  />

                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">

                  <span className="text-4xl font-bold text-gray-900">
                    {jobReadiness}%
                  </span>

                  <span
                    className={`mt-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${readiness.className}`}
                  >
                    {readiness.label}
                  </span>

                </div>

              </div>
            </div>

            <p className="mt-5 text-center text-sm leading-6 text-gray-500">
              {readiness.description}
            </p>

            <Link
              href={assessmentLink}
              className="mt-6 flex w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              {assessment
                ? "Retake Assessment →"
                : "Start Assessment →"}
            </Link>

          </div>

          {/* BREAKDOWN */}

          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm lg:col-span-2">

            <h2 className="text-lg font-bold text-gray-900">
              Readiness Breakdown
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              See how each area contributes to your career readiness.
            </p>

            <div className="mt-7 space-y-6">

              {/* SKILLS */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Skills
                    </p>

                    <p className="text-xs text-gray-400">
                      Current skill performance
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900">
                    {skillReadiness}%
                  </span>

                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{
                      width: `${skillReadiness}%`,
                    }}
                  />
                </div>
              </div>

              {/* PROJECTS */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Practical Projects
                    </p>

                    <p className="text-xs text-gray-400">
                      Hands-on project experience
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900">
                    {projectProgress}%
                  </span>

                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${projectProgress}%`,
                    }}
                  />
                </div>
              </div>

              {/* LEARNING */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Learning
                    </p>

                    <p className="text-xs text-gray-400">
                      Recommended learning completion
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900">
                    {learningProgress}%
                  </span>

                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${learningProgress}%`,
                    }}
                  />
                </div>
              </div>

              {/* ASSESSMENT */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Assessment
                    </p>

                    <p className="text-xs text-gray-400">
                      Latest 20-question assessment
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900">
                    {assessmentScore}%
                  </span>

                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{
                      width: `${assessmentScore}%`,
                    }}
                  />
                </div>
              </div>

              {/* CERTIFICATIONS */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Certifications
                    </p>

                    <p className="text-xs text-gray-400">
                      Certification progress
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900">
                    {certificationProgress}%
                  </span>

                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{
                      width: `${certificationProgress}%`,
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* STRENGTH + GAP */}

        <section className="mb-6 grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700">
                ✓
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Strongest Area
                </p>

                <h3 className="mt-1 text-xl font-bold text-gray-900">
                  {strongestSkill}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Current score:{" "}
                  {strongestSkillScore}%
                </p>

              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-700">
                !
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Biggest Skill Gap
                </p>

                <h3 className="mt-1 text-xl font-bold text-gray-900">
                  {biggestGapSkill}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Current{" "}
                  {round(
                    biggestGapCurrent
                  )}
                  % → Required{" "}
                  {round(
                    biggestGapRequired
                  )}
                  %
                </p>

                <p className="mt-1 text-sm font-semibold text-amber-700">
                  Gap:{" "}
                  {round(
                    biggestGapValue
                  )}
                  %
                </p>

              </div>
            </div>
          </div>

        </section>

        {/* NEXT ACTION */}

        <section className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-indigo-600 shadow-sm">
                →
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Recommended Next Action
                </p>

                <h3 className="mt-1 text-xl font-bold text-gray-900">
                  {recommendationTitle}
                </h3>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                  {recommendationText}
                </p>

              </div>
            </div>

            <Link
              href={recommendationLink}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Continue →
            </Link>

          </div>
        </section>

        {/* LEVELS */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            What does this score mean?
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-xl bg-red-50 p-4">
              <div className="text-lg font-bold text-red-700">
                0–39%
              </div>

              <p className="mt-1 text-sm text-gray-600">
                Not Ready Yet
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 p-4">
              <div className="text-lg font-bold text-orange-700">
                40–59%
              </div>

              <p className="mt-1 text-sm text-gray-600">
                Building Foundations
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <div className="text-lg font-bold text-amber-700">
                60–74%
              </div>

              <p className="mt-1 text-sm text-gray-600">
                Developing
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <div className="text-lg font-bold text-blue-700">
                75–89%
              </div>

              <p className="mt-1 text-sm text-gray-600">
                Nearly Job Ready
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="text-lg font-bold text-emerald-700">
                90–100%
              </div>

              <p className="mt-1 text-sm text-gray-600">
                Job Ready
              </p>
            </div>

          </div>

          <p className="mt-5 text-sm leading-6 text-gray-500">
            CareerPath uses this score as a
            progress indicator based on your
            current assessment, skills, learning,
            projects, and certification progress.
            It is not a guarantee of employment
            or hiring success.
          </p>

        </section>

        {/* NAVIGATION */}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">

          <Link
            href="/progress"
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Progress
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Go to Dashboard →
          </Link>

        </div>

      </main>
    </div>
  );
}