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
  score?: number | null;
  percentage?: number | null;
  total_score?: number | null;
  correct_answers?: number | null;
  total_questions?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
};

type SkillGap = {
  current_score?: number | null;
  score?: number | null;
  proficiency?: number | null;
  required_score?: number | null;
  target_score?: number | null;
  required_level?: number | null;
  target_level?: number | null;
  gap?: number | null;
  skill_gap?: number | null;
  skills?: {
    name?: string | null;
  } | null;
};

type ProgressRow = {
  progress?: number | null;
  percentage?: number | null;
  completion_percentage?: number | null;
  completed?: boolean | null;
  status?: string | null;
};

function getNumber(
  row: Record<string, unknown>,
  fields: string[],
  fallback = 0
): number {
  for (const field of fields) {
    const value = row[field];

    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.min(100, value));
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.min(100, parsed));
      }
    }
  }

  return fallback;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "U";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getStatus(score: number) {
  if (score >= 80) {
    return {
      label: "Strong",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  if (score >= 60) {
    return {
      label: "Good",
      className:
        "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Improvement",
      className:
        "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    label: "Needs Attention",
    className:
      "bg-red-50 text-red-700 border-red-200",
  };
}

export default async function JobReadinessPage() {
  const supabase = await createClient();

  // ---------------------------------------------------------
  // 1. Get logged-in user
  // ---------------------------------------------------------

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ---------------------------------------------------------
  // 2. Get profile and target career
  // ---------------------------------------------------------

  const { data: profileData } = await supabase
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

  const profile = profileData as Profile | null;

  // IMPORTANT:
  // This is used when opening the assessment.
  const targetRoleId = profile?.target_role_id ?? null;

  const roleData = profile?.career_roles;

  const targetRole = Array.isArray(roleData)
    ? roleData[0]?.name ?? "Career Goal"
    : roleData?.name ?? "Career Goal";

  const userName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "User";

  const initials = getInitials(userName);

  // ---------------------------------------------------------
  // 3. Get latest completed assessment
  // ---------------------------------------------------------
  //
  // assessment_attempts does NOT use created_at.
  // We use completed_at instead.
  // ---------------------------------------------------------

  const { data: assessmentData } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const assessment = assessmentData as Assessment | null;

  const assessmentScore = assessment
    ? getNumber(
        assessment as unknown as Record<string, unknown>,
        ["score", "percentage", "total_score"],
        0
      )
    : 0;

  // ---------------------------------------------------------
  // 4. Get skill-gap data
  // ---------------------------------------------------------

  const { data: skillGapData } = await supabase
    .from("user_skill_gaps")
    .select(
      `
        *,
        skills (
          name
        )
      `
    )
    .eq("user_id", user.id);

  const skillGaps = (skillGapData ?? []) as SkillGap[];

  const skillScores = skillGaps.map((skill) =>
    getNumber(
      skill as unknown as Record<string, unknown>,
      [
        "current_score",
        "score",
        "proficiency",
        "percentage",
        "skill_score",
      ],
      0
    )
  );

  const skillReadiness =
    skillScores.length > 0
      ? average(skillScores)
      : assessmentScore;

  // ---------------------------------------------------------
  // 5. Find strongest skill
  // ---------------------------------------------------------

  let strongestSkill = "No skill data yet";
  let strongestSkillScore = 0;

  for (const skill of skillGaps) {
    const score = getNumber(
      skill as unknown as Record<string, unknown>,
      [
        "current_score",
        "score",
        "proficiency",
        "percentage",
        "skill_score",
      ],
      0
    );

    if (score > strongestSkillScore) {
      strongestSkillScore = score;

      strongestSkill =
        skill.skills?.name || "Unnamed skill";
    }
  }

  // ---------------------------------------------------------
  // 6. Find biggest skill gap
  // ---------------------------------------------------------

  let biggestGapSkill = "No major gap identified";
  let biggestGapValue = 0;

  for (const skill of skillGaps) {
    const row =
      skill as unknown as Record<string, unknown>;

    const current = getNumber(
      row,
      [
        "current_score",
        "score",
        "proficiency",
        "percentage",
        "skill_score",
      ],
      0
    );

    const required = getNumber(
      row,
      [
        "required_score",
        "target_score",
        "required_level",
        "target_level",
      ],
      100
    );

    const storedGap = getNumber(
      row,
      ["gap", "skill_gap"],
      -1
    );

    const gap =
      storedGap >= 0
        ? storedGap
        : Math.max(0, required - current);

    if (gap > biggestGapValue) {
      biggestGapValue = gap;

      biggestGapSkill =
        skill.skills?.name || "Unnamed skill";
    }
  }

  // ---------------------------------------------------------
  // 7. Learning progress
  // ---------------------------------------------------------

  const { data: learningData } = await supabase
    .from("user_learning_progress")
    .select("*")
    .eq("user_id", user.id);

  const learningRows =
    (learningData ?? []) as ProgressRow[];

  const learningScores = learningRows.map((row) =>
    getNumber(
      row as unknown as Record<string, unknown>,
      [
        "progress",
        "percentage",
        "completion_percentage",
      ],
      row.completed ? 100 : 0
    )
  );

  const learningProgress = average(learningScores);

  // ---------------------------------------------------------
  // 8. Project progress
  // ---------------------------------------------------------

  const { data: projectData } = await supabase
    .from("user_project_progress")
    .select("*")
    .eq("user_id", user.id);

  const projectRows =
    (projectData ?? []) as ProgressRow[];

  const projectScores = projectRows.map((row) =>
    getNumber(
      row as unknown as Record<string, unknown>,
      [
        "progress",
        "percentage",
        "completion_percentage",
      ],
      row.completed ? 100 : 0
    )
  );

  const projectProgress = average(projectScores);

  // ---------------------------------------------------------
  // 9. Calculate overall job readiness
  // ---------------------------------------------------------
  //
  // Skills       = 50%
  // Learning     = 25%
  // Projects     = 25%
  //
  // If there is no progress data yet,
  // use the assessment score.
  // ---------------------------------------------------------

  const hasProgressData =
    skillGaps.length > 0 ||
    learningRows.length > 0 ||
    projectRows.length > 0;

  const jobReadiness = hasProgressData
    ? Math.round(
        skillReadiness * 0.5 +
          learningProgress * 0.25 +
          projectProgress * 0.25
      )
    : assessmentScore;

  const readiness = getStatus(jobReadiness);

  // ---------------------------------------------------------
  // 10. Determine recommendation
  // ---------------------------------------------------------

  let recommendationTitle = "Continue your roadmap";

  let recommendationText =
    "Keep progressing through your personalized CareerPath roadmap.";

  let recommendationLink = "/roadmap";

  if (!assessment) {
    recommendationTitle =
      "Complete your skill assessment";

    recommendationText =
      "Take the 20-question assessment so CareerPath can identify your strengths and skill gaps.";

    // IMPORTANT:
    // Preserve the user's selected career role.
    recommendationLink = targetRoleId
      ? `/assessment?role=${targetRoleId}`
      : "/career-selection";
  } else if (biggestGapValue >= 20) {
    recommendationTitle =
      `Improve ${biggestGapSkill}`;

    recommendationText =
      `Your largest current skill gap is ${biggestGapSkill}. Focus on the recommended learning resources before moving to the next stage.`;

    recommendationLink = "/learning";
  } else if (learningProgress < 60) {
    recommendationTitle =
      "Continue learning";

    recommendationText =
      "You have identified your skill gaps. Continue your recommended learning path to strengthen your foundation.";

    recommendationLink = "/learning";
  } else if (projectProgress < 60) {
    recommendationTitle =
      "Build your next project";

    recommendationText =
      "Turn your learning into practical experience by completing a role-aligned project.";

    recommendationLink = "/projects";
  } else if (jobReadiness >= 80) {
    recommendationTitle =
      "Prepare for job applications";

    recommendationText =
      "Your current readiness is strong. Review certifications, portfolio projects, and job preparation activities.";

    recommendationLink = "/certifications";
  }

  // ---------------------------------------------------------
  // 11. Assessment button URL
  // ---------------------------------------------------------

  const assessmentLink = targetRoleId
    ? `/assessment?role=${targetRoleId}`
    : "/career-selection";

  // ---------------------------------------------------------
  // 12. Readiness ring calculation
  // ---------------------------------------------------------

  const circumference = 2 * Math.PI * 54;

  const dashOffset =
    circumference -
    (jobReadiness / 100) * circumference;

  // ---------------------------------------------------------
  // 13. Render page
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* =====================================================
          HEADER
      ====================================================== */}

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

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* ===================================================
            CAREER TARGET
        ==================================================== */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Your target career
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {targetRole}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your readiness is calculated from your current
                skills, learning progress, and practical project
                experience.
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

        {/* ===================================================
            MAIN READINESS CARD
        ==================================================== */}

        <section className="mb-6 grid gap-6 lg:grid-cols-3">

          {/* -----------------------------------------------
              READINESS SCORE
          ------------------------------------------------ */}

          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm lg:col-span-1">
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
                    r="54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-100"
                  />

                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="text-indigo-600"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
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
              This score represents your current progress toward
              demonstrating the skills and experience expected for
              your target role.
            </p>

            {/* Assessment button */}

            <Link
              href={assessmentLink}
              className="mt-6 flex w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              {assessment
                ? "Retake Assessment →"
                : "Start Assessment →"}
            </Link>
          </div>

          {/* -----------------------------------------------
              READINESS BREAKDOWN
          ------------------------------------------------ */}

          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm lg:col-span-2">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Readiness Breakdown
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your current progress across the major readiness
                  areas.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-6">

              {/* Skills */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Skills
                    </p>

                    <p className="text-xs text-gray-400">
                      Current knowledge and skill-gap performance
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900">
                    {skillReadiness}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{
                      width: `${skillReadiness}%`,
                    }}
                  />
                </div>
              </div>

              {/* Learning */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Learning
                    </p>

                    <p className="text-xs text-gray-400">
                      Completion of recommended learning activities
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900">
                    {learningProgress}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${learningProgress}%`,
                    }}
                  />
                </div>
              </div>

              {/* Projects */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Practical Projects
                    </p>

                    <p className="text-xs text-gray-400">
                      Hands-on experience and portfolio development
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900">
                    {projectProgress}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${projectProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            STRENGTHS AND GAPS
        ==================================================== */}

        <section className="mb-6 grid gap-6 md:grid-cols-2">

          {/* Strongest */}

          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
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
                  Current score: {strongestSkillScore}%
                </p>
              </div>
            </div>
          </div>

          {/* Biggest gap */}

          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
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
                  Gap to target: {Math.round(biggestGapValue)}%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            RECOMMENDED NEXT ACTION
        ==================================================== */}

        <section className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
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

        {/* ===================================================
            WHAT JOB READINESS MEANS
        ==================================================== */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            What does this score mean?
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-lg font-bold text-gray-900">
                80–100%
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Strong readiness
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-lg font-bold text-gray-900">
                60–79%
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Good progress
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-lg font-bold text-gray-900">
                40–59%
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Needs improvement
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-lg font-bold text-gray-900">
                0–39%
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Needs attention
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-gray-500">
            CareerPath uses this score as a progress indicator for
            your personalized roadmap. It is not a guarantee of
            employment or hiring success.
          </p>
        </section>

        {/* ===================================================
            BOTTOM NAVIGATION
        ==================================================== */}

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