import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Skill = {
  name: string;
  progress: number;
};

type RoadmapPhase = {
  phase: string;
  progress: number;
  status: string;
};

type Task = {
  title: string;
  type: "Learning" | "Practice" | "Skill";
  time: string;
  completed: boolean;
};

type CareerRole = {
  id?: number;
  name?: string;
};

type Profile = {
  full_name: string | null;
  target_role_id: number | null;
  experience_level: string | null;
  career_roles?: CareerRole | CareerRole[] | null;
};

type SkillGapRow = {
  current_level?: number | string | null;
  current_score?: number | string | null;
  score?: number | string | null;
  proficiency?: number | string | null;
  required_level?: number | string | null;
  target_level?: number | string | null;
  skills?: {
    id?: number;
    name?: string;
  } | {
    id?: number;
    name?: string;
  }[] | null;
};

type ProgressRow = {
  progress?: number | string | null;
  progress_percentage?: number | string | null;
  completion_percentage?: number | string | null;
};

type AssessmentRow = {
  score?: number | string | null;
  percentage?: number | string | null;
  total_score?: number | string | null;
};

export default async function Dashboard() {
  const supabase = await createClient();

  // ==================================================
  // GET LOGGED-IN USER
  // ==================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ==================================================
  // GET PROFILE + TARGET ROLE
  // ==================================================

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

  // ==================================================
  // USER NAME
  // ==================================================

  const fullName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    user.user_metadata?.name?.trim() ||
    user.email?.split("@")[0] ||
    "User";

  const nameParts = fullName
    .trim()
    .split(/\s+/)
    .filter((part: string) => part.length > 0);

  const firstName = nameParts[0] || "User";

  // ==================================================
  // PROFILE INITIALS
  //
  // Shiva Shankar -> SS
  // Tejni -> T
  // Shiva -> S
  // Tejni Reddy -> TR
  // A B C -> AB
  //
  // Maximum two initials.
  // ==================================================

  const initials =
    nameParts
      .slice(0, 2)
      .map((name: string) =>
        name.charAt(0).toUpperCase()
      )
      .join("") || "U";

  // ==================================================
  // GET TARGET ROLE
  // ==================================================

  const careerRoleData = profile?.career_roles;

  let targetRole = "Career Goal";

  if (Array.isArray(careerRoleData)) {
    targetRole =
      careerRoleData[0]?.name || "Career Goal";
  } else if (
    careerRoleData &&
    typeof careerRoleData === "object"
  ) {
    targetRole =
      careerRoleData.name || "Career Goal";
  }

  // ==================================================
  // GET LATEST ASSESSMENT
  // ==================================================

  const { data: latestAssessmentData } =
    await supabase
      .from("assessment_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  const latestAssessment =
    latestAssessmentData as AssessmentRow | null;

  // ==================================================
  // ASSESSMENT SCORE
  // ==================================================

  let assessmentScore = 0;

  if (latestAssessment) {
    assessmentScore = Math.round(
      Number(
        latestAssessment.score ??
          latestAssessment.percentage ??
          latestAssessment.total_score ??
          0
      )
    );
  }

  assessmentScore = Math.max(
    0,
    Math.min(100, assessmentScore)
  );

  // ==================================================
  // GET USER SKILL GAPS
  // ==================================================

  const { data: skillGapData } = await supabase
    .from("user_skill_gaps")
    .select(
      `
        *,
        skills (
          id,
          name
        )
      `
    )
    .eq("user_id", user.id);

  const skillGapRows =
    (skillGapData || []) as SkillGapRow[];

  // ==================================================
  // BUILD SKILL OVERVIEW
  // ==================================================

  const skills: Skill[] = skillGapRows
    .map((item: SkillGapRow): Skill => {
      let skillName = "Skill";

      const skillData = item.skills;

      if (Array.isArray(skillData)) {
        skillName =
          skillData[0]?.name || "Skill";
      } else if (
        skillData &&
        typeof skillData === "object"
      ) {
        skillName =
          skillData.name || "Skill";
      }

      // ----------------------------------------------
      // CURRENT SKILL LEVEL
      // ----------------------------------------------

      const currentLevel = Number(
        item.current_level ??
          item.current_score ??
          item.score ??
          item.proficiency ??
          0
      );

      // ----------------------------------------------
      // REQUIRED SKILL LEVEL
      // ----------------------------------------------

      const requiredLevel = Number(
        item.required_level ??
          item.target_level ??
          100
      );

      let progress = 0;

      if (
        !Number.isNaN(currentLevel) &&
        !Number.isNaN(requiredLevel) &&
        requiredLevel > 0
      ) {
        progress = Math.round(
          (currentLevel / requiredLevel) * 100
        );
      }

      progress = Math.max(
        0,
        Math.min(100, progress)
      );

      return {
        name: skillName,
        progress,
      };
    })
    .filter(
      (skill: Skill) =>
        skill.name !== "Skill"
    )
    .sort(
      (a: Skill, b: Skill) =>
        b.progress - a.progress
    );

  // ==================================================
  // SKILL FALLBACK
  // ==================================================

  const hasSkillData = skills.length > 0;

  if (!hasSkillData) {
    skills.push({
      name: "Complete your assessment",
      progress: 0,
    });
  }

  // ==================================================
  // DISPLAY TOP 5 SKILLS
  // ==================================================

  const displayedSkills = skills.slice(0, 5);

  // ==================================================
  // STRONGEST SKILL
  // ==================================================

  const strongestSkill =
    hasSkillData
      ? skills.reduce(
          (
            best: Skill,
            current: Skill
          ) =>
            current.progress >
            best.progress
              ? current
              : best
        )
      : null;

  // ==================================================
  // BIGGEST SKILL GAP
  // ==================================================

  const biggestGap =
    hasSkillData
      ? skills.reduce(
          (
            worst: Skill,
            current: Skill
          ) =>
            current.progress <
            worst.progress
              ? current
              : worst
        )
      : null;

  // ==================================================
  // AVERAGE SKILL PROGRESS
  // ==================================================

  const skillAverage =
    hasSkillData
      ? Math.round(
          skills.reduce(
            (
              total: number,
              skill: Skill
            ) =>
              total + skill.progress,
            0
          ) / skills.length
        )
      : 0;

  // ==================================================
  // GET PROJECT PROGRESS
  // ==================================================

  const { data: projectProgressData } =
    await supabase
      .from("user_project_progress")
      .select("*")
      .eq("user_id", user.id);

  const projectProgress =
    (projectProgressData ||
      []) as ProgressRow[];

  // ==================================================
  // PROJECT AVERAGE
  // ==================================================

  let projectProgressAverage = 0;

  if (projectProgress.length > 0) {
    const values = projectProgress
      .map((item: ProgressRow) =>
        Number(
          item.progress ??
            item.progress_percentage ??
            item.completion_percentage ??
            0
        )
      )
      .filter(
        (value: number) =>
          !Number.isNaN(value)
      );

    if (values.length > 0) {
      projectProgressAverage =
        Math.round(
          values.reduce(
            (
              total: number,
              value: number
            ) => total + value,
            0
          ) / values.length
        );
    }
  }

  projectProgressAverage = Math.max(
    0,
    Math.min(100, projectProgressAverage)
  );

  // ==================================================
  // GET LEARNING PROGRESS
  // ==================================================

  const { data: learningProgressData } =
    await supabase
      .from("user_learning_progress")
      .select("*")
      .eq("user_id", user.id);

  const learningProgress =
    (learningProgressData ||
      []) as ProgressRow[];

  // ==================================================
  // LEARNING AVERAGE
  // ==================================================

  let learningProgressAverage = 0;

  if (learningProgress.length > 0) {
    const values = learningProgress
      .map((item: ProgressRow) =>
        Number(
          item.progress ??
            item.progress_percentage ??
            item.completion_percentage ??
            0
        )
      )
      .filter(
        (value: number) =>
          !Number.isNaN(value)
      );

    if (values.length > 0) {
      learningProgressAverage =
        Math.round(
          values.reduce(
            (
              total: number,
              value: number
            ) => total + value,
            0
          ) / values.length
        );
    }
  }

  learningProgressAverage =
    Math.max(
      0,
      Math.min(
        100,
        learningProgressAverage
      )
    );

  // ==================================================
  // JOB READINESS
  //
  // Skill development   = 50%
  // Learning progress   = 25%
  // Project progress    = 25%
  //
  // If no real progress exists,
  // assessment score is used.
  // ==================================================

  const hasRealProgress =
    hasSkillData ||
    projectProgress.length > 0 ||
    learningProgress.length > 0;

  let jobReadiness = 0;

  if (hasRealProgress) {
    jobReadiness = Math.round(
      skillAverage * 0.5 +
        learningProgressAverage * 0.25 +
        projectProgressAverage * 0.25
    );
  } else {
    jobReadiness = assessmentScore;
  }

  jobReadiness = Math.max(
    0,
    Math.min(100, jobReadiness)
  );

  // ==================================================
  // JOB READINESS LABEL
  // ==================================================

  let readinessLabel =
    "Getting Started";

  if (jobReadiness >= 80) {
    readinessLabel = "Strong";
  } else if (jobReadiness >= 60) {
    readinessLabel = "Good";
  } else if (jobReadiness >= 40) {
    readinessLabel = "Developing";
  }

  // ==================================================
  // CURRENT FOCUS
  // ==================================================

  let currentFocus =
    "Complete your skill assessment";

  let currentFocusProgress = 0;

  let currentFocusDescription =
    "Complete your assessment to identify your strengths and skill gaps.";

  if (biggestGap) {
    currentFocus = biggestGap.name;
    currentFocusProgress =
      biggestGap.progress;

    currentFocusDescription =
      `${biggestGap.name} is currently one of your biggest skill gaps for the ${targetRole} role.`;
  }

  // ==================================================
  // RECOMMENDED NEXT STEP
  // ==================================================

  let recommendedTitle =
    "Complete your skill assessment";

  let recommendedDescription =
    "Your assessment helps CareerPath understand your current knowledge and create a personalized career roadmap.";

  let recommendedReason =
    "Complete the assessment to identify what you should learn next.";

  let recommendedLink =
    "/assessment";

  // If assessment is completed
  if (latestAssessment && biggestGap) {
    recommendedTitle =
      `Improve ${biggestGap.name}`;

    recommendedDescription =
      `${biggestGap.name} is currently one of your largest skill gaps for the ${targetRole} role.`;

    recommendedReason =
      "Improving this skill will help you close one of the most important gaps in your current career profile.";

    recommendedLink =
      "/learning";
  }

  // If skill gaps are already strong
  if (
    latestAssessment &&
    strongestSkill &&
    strongestSkill.progress >= 80 &&
    projectProgressAverage < 80
  ) {
    recommendedTitle =
      "Build a role-aligned project";

    recommendedDescription =
      `Your skills are developing well. Now strengthen your ${targetRole} profile by building a practical project.`;

    recommendedReason =
      "Projects help demonstrate that you can apply your knowledge in a practical environment.";

    recommendedLink =
      "/projects";
  }

  // If project progress is strong but certification is next
  if (
    projectProgressAverage >= 80 &&
    jobReadiness < 80
  ) {
    recommendedTitle =
      "Explore relevant certifications";

    recommendedDescription =
      `Your project progress is strong. Explore certifications that complement your ${targetRole} career path.`;

    recommendedReason =
      "Certifications can complement your projects and demonstrate structured knowledge in your selected field.";

    recommendedLink =
      "/certifications";
  }

  // If everything is strong
  if (jobReadiness >= 80) {
    recommendedTitle =
      "Check your job readiness";

    recommendedDescription =
      "Your current progress is strong. Review your job-readiness profile and identify any final areas to improve.";

    recommendedReason =
      "A final readiness review helps you see whether your skills, learning and projects are balanced.";

    recommendedLink =
      "/job-readiness";
  }

  // ==================================================
  // DYNAMIC ROADMAP
  //
  // Do NOT hardcode cybersecurity-specific phases.
  // The roadmap should work for every career role.
  // ==================================================

  const roadmapTemplates = [
    "Foundations",
    "Core Skills",
    "Practical Learning",
    "Projects & Experience",
    "Job Preparation",
  ];

  const roadmap: RoadmapPhase[] =
    roadmapTemplates.map(
      (
        phase: string,
        index: number
      ) => {
        const phaseStart =
          index * 20;

        const phaseEnd =
          (index + 1) * 20;

        let progress = 0;

        if (jobReadiness >= phaseEnd) {
          progress = 100;
        } else if (
          jobReadiness > phaseStart
        ) {
          progress = Math.round(
            ((jobReadiness -
              phaseStart) /
              20) *
              100
          );
        }

        let status =
          "Upcoming";

        if (progress === 100) {
          status = "Completed";
        } else if (progress > 0) {
          status = "In Progress";
        }

        return {
          phase,
          progress,
          status,
        };
      }
    );

  // ==================================================
  // TODAY'S TASKS
  //
  // These are recommendation-based dashboard tasks.
  // They are intentionally not pretending to be
  // persisted database tasks yet.
  // ==================================================

  const tasks: Task[] = [
    {
      title: recommendedTitle,
      type: "Learning",
      time: "Recommended",
      completed: false,
    },
    {
      title:
        hasSkillData
          ? "Review your skill gaps"
          : "Complete your skill assessment",
      type: "Practice",
      time: "15 min",
      completed: false,
    },
    {
      title:
        projectProgressAverage > 0
          ? "Continue your current project"
          : "Explore a recommended project",
      type: "Skill",
      time: "30 min",
      completed: false,
    },
  ];

  // ==================================================
  // TASK COUNT
  // ==================================================

  const completedTasks =
    tasks.filter(
      (task: Task) =>
        task.completed
    ).length;

  // ==================================================
  // EXPERIENCE LEVEL DISPLAY
  // ==================================================

  const experienceLevel =
    profile?.experience_level
      ? profile.experience_level
          .replace(/_/g, " ")
          .replace(/\b\w/g, (letter: string) =>
            letter.toUpperCase()
          )
      : "Student";

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="min-h-screen w-full bg-[#f8f9fc]">
      <main className="min-h-screen w-full px-6 py-6 sm:px-8 lg:px-10">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Welcome back, {firstName} 👋
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Your CareerPath
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Here&apos;s your current career progress and
              what you should focus on next.
            </p>
          </div>

          {/* PROFILE */}

          <Link
            href="/profile"
            aria-label="Open profile"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-200"
          >
            {initials}
          </Link>
        </header>

        {/* ==================================================
            OVERVIEW CARDS
        ================================================== */}

        <section className="grid gap-5 md:grid-cols-3">

          {/* TARGET ROLE */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Target Role
            </p>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              {targetRole}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your selected career direction
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Career Goal
              </span>

              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {experienceLevel}
              </span>
            </div>
          </div>

          {/* JOB READINESS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Job Readiness
              </p>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                {readinessLabel}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {jobReadiness}%
              </span>

              <span className="text-sm text-gray-500">
                complete
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${jobReadiness}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Based on your current skills, learning and projects.
            </p>
          </div>

          {/* CURRENT FOCUS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Current Focus
            </p>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              {currentFocus}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {currentFocusDescription}
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Skill progress
                </span>

                <span className="font-medium text-gray-700">
                  {currentFocusProgress}%
                </span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${currentFocusProgress}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <section className="mt-6 grid gap-6 xl:grid-cols-3">

          {/* TODAY'S TASKS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Today&apos;s Tasks
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Stay consistent by completing your daily priorities.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {completedTasks} / {tasks.length} completed
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {tasks.map(
                (task: Task) => (
                  <div
                    key={task.title}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition hover:border-indigo-100 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={
                        task.completed
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium ${
                          task.completed
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {task.type} •{" "}
                        {task.time}
                      </p>
                    </div>

                    <span
                      className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${
                        task.type ===
                        "Learning"
                          ? "bg-blue-50 text-blue-700"
                          : task.type ===
                            "Practice"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {task.type}
                    </span>
                  </div>
                )
              )}
            </div>

            <Link
              href="/roadmap"
              className="mt-5 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View roadmap →
            </Link>
          </div>

          {/* RECOMMENDED NEXT STEP */}

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg">
              →
            </div>
            

            <p className="mt-5 text-sm font-medium text-indigo-600">
              Recommended Next Step
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              {recommendedTitle}
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {recommendedDescription}
            </p>

            <div className="mt-5 rounded-xl bg-white/70 p-4">
              <p className="text-xs font-medium text-gray-500">
                Why this matters
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {recommendedReason}
              </p>
            </div>

            <Link
              href={recommendedLink}
              className="mt-5 block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Continue →
            </Link>
          </div>
        </section>
        <Link
  href="/job-readiness"
  className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
        Career Progress
      </p>

      <h2 className="mt-2 text-xl font-bold text-gray-900">
        Job Readiness
      </h2>

      <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
        Check how prepared you are for your target role and see what you
        need to improve next.
      </p>
    </div>

    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600 transition group-hover:bg-indigo-100">
      →
    </div>
  </div>

  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
    <span className="text-sm font-semibold text-gray-700">
      View Job Readiness
    </span>

    <span className="text-sm font-semibold text-indigo-600">
      Check Now →
    </span>
  </div>
</Link>

        {/* ==================================================
            LOWER CONTENT
        ================================================== */}

        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* SKILL OVERVIEW */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Skill Overview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your current skill levels for the selected role.
                </p>
              </div>

              <Link
                href="/skills"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View all
              </Link>
            </div>

            <div className="mt-6 space-y-5">
              {displayedSkills.map(
                (skill: Skill) => (
                  <div
                    key={skill.name}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {skill.name}
                      </span>

                      <span className="text-sm font-medium text-gray-500">
                        {skill.progress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          skill.progress >=
                          80
                            ? "bg-green-500"
                            : skill.progress >=
                              60
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                        style={{
                          width: `${skill.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            {!hasSkillData && (
              <Link
                href="/assessment"
                className="mt-6 block rounded-xl bg-indigo-50 p-4 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                Complete your assessment to generate your skill profile →
              </Link>
            )}
          </div>

          {/* CAREER ROADMAP */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Career Roadmap
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your journey toward becoming job-ready.
                </p>
              </div>

              <Link
                href="/roadmap"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Open roadmap
              </Link>
            </div>

            <div className="mt-6 space-y-5">
              {roadmap.map(
                (
                  phase: RoadmapPhase,
                  index: number
                ) => (
                  <div
                    key={phase.phase}
                    className="flex gap-4"
                  >
                    {/* TIMELINE */}

                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                          phase.progress ===
                          100
                            ? "bg-green-100 text-green-700"
                            : phase.progress >
                              0
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {phase.progress ===
                        100
                          ? "✓"
                          : index + 1}
                      </div>

                      {index !==
                        roadmap.length -
                          1 && (
                        <div className="mt-2 h-full min-h-6 w-px bg-gray-200" />
                      )}
                    </div>

                    {/* PHASE */}

                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {phase.phase}
                        </p>

                        <span className="text-xs text-gray-500">
                          {phase.progress}%
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            phase.progress ===
                            100
                              ? "bg-green-500"
                              : phase.progress >
                                0
                              ? "bg-indigo-500"
                              : "bg-gray-200"
                          }`}
                          style={{
                            width: `${phase.progress}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {phase.status}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ==================================================
            PROGRESS SNAPSHOT
        ================================================== */}

        <section className="mt-6 grid gap-5 sm:grid-cols-3">

          {/* SKILLS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Skill Progress
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {skillAverage}%
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Average across assessed skills
            </p>
          </div>

          {/* LEARNING */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Learning Progress
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {learningProgressAverage}%
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Based on completed learning resources
            </p>
          </div>

          {/* PROJECTS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Project Progress
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {projectProgressAverage}%
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Based on your project activity
            </p>
          </div>
        </section>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer className="py-8 text-center text-xs text-gray-400">
          CareerPath • Build skills. Build projects. Build your career.
        </footer>
      </main>
    </div>
  );
}