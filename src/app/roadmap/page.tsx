"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type RoadmapPhase = {
  id: number;
  phase_number: number;
  name: string;
  description: string | null;
};

type RoadmapItem = {
  id: number;
  phase_id: number;
  skill_id: number | null;
  title: string;
  description: string | null;
  item_type: string;
  difficulty: string | null;
  estimated_hours: number | null;
  item_order: number;
};

type SkillGap = {
  skill_id: number;
  skill_name: string;
  skill_score: number;
  skill_gap: number;
  priority: string;
  status: string;
};

type Phase = {
  id: number;
  title: string;
  subtitle: string;
  progress: number;
  status: "Completed" | "Current" | "Upcoming" | "Locked";
  skills: string[];
  description: string;
  color: string;
  items: RoadmapItem[];
};

export default function RoadmapPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  const [roleName, setRoleName] = useState("");
  const [overallProgress, setOverallProgress] = useState(0);
  const [recommendedPhase, setRecommendedPhase] = useState<number | null>(
    null
  );
  const [recommendedSkills, setRecommendedSkills] = useState<SkillGap[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRoadmap();
  }, []);

  async function loadRoadmap() {
    try {
      setLoading(true);
      setError("");

      /*
       * ---------------------------------------------------
       * 1. Get logged-in user
       * ---------------------------------------------------
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("You must be logged in to view your roadmap.");
        return;
      }

      /*
       * ---------------------------------------------------
       * 2. Get user's profile
       * ---------------------------------------------------
       */

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("target_role_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.target_role_id) {
        setError("Please select your target career first.");
        return;
      }

      /*
       * ---------------------------------------------------
       * 3. Get target career
       * ---------------------------------------------------
       */

      const { data: role, error: roleError } = await supabase
        .from("career_roles")
        .select("id, name")
        .eq("id", profile.target_role_id)
        .single();

      if (roleError) {
        throw roleError;
      }

      setRoleName(role.name);

      /*
       * ---------------------------------------------------
       * 4. Get roadmap phases
       * ---------------------------------------------------
       */

      const { data: phaseData, error: phaseError } = await supabase
        .from("roadmap_phases")
        .select("id, phase_number, name, description")
        .eq("role_id", role.id)
        .order("phase_number", { ascending: true });

      if (phaseError) {
        throw phaseError;
      }

      if (!phaseData || phaseData.length === 0) {
        setError("No roadmap has been created for this career yet.");
        return;
      }

      /*
       * ---------------------------------------------------
       * 5. Get roadmap items
       * ---------------------------------------------------
       */

      const phaseIds = phaseData.map((phase) => phase.id);

      const { data: itemData, error: itemError } = await supabase
        .from("roadmap_items")
        .select(
          "id, phase_id, skill_id, title, description, item_type, difficulty, estimated_hours, item_order"
        )
        .in("phase_id", phaseIds)
        .order("item_order", { ascending: true });

      if (itemError) {
        throw itemError;
      }

      const items = (itemData ?? []) as RoadmapItem[];

      /*
       * ---------------------------------------------------
       * 6. Get latest assessment
       * ---------------------------------------------------
       */

      const { data: assessment, error: assessmentError } = await supabase
        .from("assessment_attempts")
        .select("id, score")
        .eq("user_id", user.id)
        .eq("role_id", role.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assessmentError) {
        throw assessmentError;
      }

      /*
       * ---------------------------------------------------
       * 7. Get skill gaps
       * ---------------------------------------------------
       */

      let skillGaps: SkillGap[] = [];

      if (assessment) {
        const { data: gaps, error: gapError } = await supabase
          .from("user_skill_gaps")
          .select(
            "skill_id, skill_name, skill_score, skill_gap, priority, status"
          )
          .eq("attempt_id", assessment.id)
          .order("skill_gap", { ascending: false });

        if (gapError) {
          throw gapError;
        }

        skillGaps = (gaps ?? []) as SkillGap[];
      }

      /*
       * ---------------------------------------------------
       * 8. Build personalized phase data
       * ---------------------------------------------------
       */

      const generatedPhases: Phase[] = phaseData.map(
        (phase: RoadmapPhase, index: number) => {
          const phaseItems = items.filter(
            (item) => item.phase_id === phase.id
          );

          /*
           * Find skill gaps belonging to this phase.
           */

          const phaseSkillIds = phaseItems
            .map((item) => item.skill_id)
            .filter((id): id is number => id !== null);

          const phaseGaps = skillGaps.filter((gap) =>
            phaseSkillIds.includes(gap.skill_id)
          );

          /*
           * Phase progress is based on assessment strength.
           *
           * This is NOT completion progress yet.
           * Later, when user_progress is added,
           * this will become actual learning completion.
           */

          let progress = 0;

          if (phaseGaps.length > 0) {
            const averageScore =
              phaseGaps.reduce(
                (sum, gap) => sum + Number(gap.skill_score),
                0
              ) / phaseGaps.length;

            progress = Math.round(averageScore);
          }

          /*
           * No assessment yet.
           */

          if (skillGaps.length === 0) {
            progress = 0;
          }

          /*
           * Determine phase status.
           */

          let status: Phase["status"];

          if (index === 0 && progress >= 80) {
            status = "Completed";
          } else if (progress >= 80) {
            status = "Completed";
          } else if (
            phaseGaps.some(
              (gap) =>
                gap.priority?.toLowerCase() === "high" ||
                gap.status === "Weak" ||
                gap.status === "Needs Improvement"
            )
          ) {
            status = "Current";
          } else if (index === 0) {
            status = "Current";
          } else {
            status = "Upcoming";
          }

          /*
           * Keep later phases visually locked
           * until previous phases are reasonably strong.
           */

          if (index > 0) {
            const previousPhase = phaseData[index - 1];

            const previousItems = items.filter(
              (item) => item.phase_id === previousPhase.id
            );

            const previousSkillIds = previousItems
              .map((item) => item.skill_id)
              .filter((id): id is number => id !== null);

            const previousGaps = skillGaps.filter((gap) =>
              previousSkillIds.includes(gap.skill_id)
            );

            if (previousGaps.length > 0) {
              const previousAverage =
                previousGaps.reduce(
                  (sum, gap) => sum + Number(gap.skill_score),
                  0
                ) / previousGaps.length;

              if (previousAverage < 70) {
                status = "Locked";
                progress = 0;
              }
            }
          }

          /*
           * Get unique skills.
           */

          const skills = Array.from(
            new Set(
              phaseGaps.map((gap) => gap.skill_name)
            )
          );

          /*
           * If there are no assessment results,
           * show roadmap item skills instead.
           */

          if (skills.length === 0) {
            skills.push(
              ...Array.from(
                new Set(
                  phaseItems
                    .map((item) => item.title)
                    .slice(0, 4)
                )
              )
            );
          }

          return {
            id: phase.id,
            title: phase.name,
            subtitle:
              phase.description?.split(".")[0] ||
              "Continue developing your career skills",
            progress,
            status,
            skills,
            description:
              phase.description ||
              "Develop the skills required for this stage of your career.",
            color:
              status === "Completed"
                ? "green"
                : status === "Current"
                  ? "blue"
                  : status === "Upcoming"
                    ? "indigo"
                    : "gray",
            items: phaseItems,
          };
        }
      );

      /*
       * ---------------------------------------------------
       * 9. Calculate overall roadmap progress
       * ---------------------------------------------------
       */

      const calculatedProgress =
        generatedPhases.length > 0
          ? Math.round(
              generatedPhases.reduce(
                (sum, phase) => sum + phase.progress,
                0
              ) / generatedPhases.length
            )
          : 0;

      setOverallProgress(calculatedProgress);

      /*
       * ---------------------------------------------------
       * 10. Find recommended phase
       * ---------------------------------------------------
       */

      const currentPhase =
        generatedPhases.find(
          (phase) => phase.status === "Current"
        ) || generatedPhases[0];

      setRecommendedPhase(currentPhase?.id ?? null);

      /*
       * Find the most important skill gaps.
       */

      const importantGaps = skillGaps
        .filter(
          (gap) =>
            gap.status === "Weak" ||
            gap.status === "Needs Improvement" ||
            gap.priority?.toLowerCase() === "high"
        )
        .slice(0, 3);

      setRecommendedSkills(importantGaps);

      /*
       * Select current phase automatically.
       */

      setSelectedPhase(currentPhase?.id ?? generatedPhases[0].id);

      setPhases(generatedPhases);
    } catch (err) {
      console.error("Roadmap loading error:", err);

      setError(
        "Unable to load your personalized roadmap. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const selected = phases.find(
    (phase) => phase.id === selectedPhase
  );

  /*
   * -------------------------------------------------------
   * Loading state
   * -------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-8 md:px-10 lg:px-14">
        <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

            <p className="mt-4 text-sm font-medium text-gray-500">
              Building your personalized roadmap...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * -------------------------------------------------------
   * Error state
   * -------------------------------------------------------
   */

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-8 md:px-10 lg:px-14">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Roadmap Unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              {error}
            </p>

            <button
              onClick={loadRoadmap}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-8 md:px-10 lg:px-14">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-indigo-600">
            CareerPath
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Your Career Roadmap
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Follow your personalized path from technical foundations to
            job readiness.
          </p>
        </div>

        {/* Target Role */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Target Role
              </p>

              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                {roleName}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your roadmap is organized according to the skills required
                for your target role and your assessment results.
              </p>
            </div>

            <div className="w-full md:w-64">

              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Overall Progress
                </span>

                <span className="text-sm font-semibold text-indigo-600">
                  {overallProgress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{
                    width: `${overallProgress}%`,
                  }}
                />
              </div>

            </div>
          </div>
        </section>

        {/* Roadmap Flow */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Career Journey
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Complete each phase to progress through your career journey.
            </p>
          </div>

          <div className="relative">

            {phases.map((phase, index) => {

              const isSelected = selectedPhase === phase.id;
              const isLast = index === phases.length - 1;

              return (
                <div key={phase.id} className="relative">

                  {/* Connector */}
                  {!isLast && (
                    <div className="absolute left-6 top-20 h-10 w-px bg-gray-200" />
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPhase(phase.id)}
                    className={`relative mb-6 flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-indigo-100 hover:bg-gray-50"
                    }`}
                  >

                    {/* Number */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        phase.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : phase.status === "Current"
                            ? "bg-indigo-100 text-indigo-700"
                            : phase.status === "Upcoming"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {phase.status === "Completed"
                        ? "✓"
                        : index + 1}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col justify-between gap-2 md:flex-row">

                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {phase.title}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {phase.subtitle}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                            phase.status === "Completed"
                              ? "bg-green-50 text-green-700"
                              : phase.status === "Current"
                                ? "bg-indigo-50 text-indigo-700"
                                : phase.status === "Upcoming"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {phase.status}
                        </span>

                      </div>

                      {/* Progress */}
                      <div className="mt-4">

                        <div className="mb-2 flex justify-between">

                          <span className="text-xs font-medium text-gray-400">
                            Assessment Strength
                          </span>

                          <span className="text-xs font-semibold text-gray-600">
                            {phase.progress}%
                          </span>

                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">

                          <div
                            className={`h-full rounded-full ${
                              phase.status === "Completed"
                                ? "bg-green-500"
                                : phase.status === "Current"
                                  ? "bg-indigo-500"
                                  : "bg-gray-300"
                            }`}
                            style={{
                              width: `${phase.progress}%`,
                            }}
                          />

                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mt-4 flex flex-wrap gap-2">

                        {phase.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600"
                          >
                            {skill}
                          </span>
                        ))}

                      </div>

                    </div>
                  </button>
                </div>
              );
            })}

          </div>
        </section>

        {/* Selected Phase */}
        {selected && (
          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">

              <div className="max-w-2xl">

                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Phase{" "}
                  {phases.findIndex(
                    (phase) => phase.id === selected.id
                  ) + 1}
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                  {selected.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {selected.description}
                </p>

                {/* Skills */}
                <div className="mt-5">

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Skills in this phase
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {selected.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600"
                      >
                        {skill}
                      </span>
                    ))}

                  </div>
                </div>

                {/* Roadmap Items */}
                {selected.items.length > 0 && (
                  <div className="mt-6">

                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      What you'll work on
                    </p>

                    <div className="space-y-3">

                      {selected.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-gray-200 bg-white p-4"
                        >

                          <div className="flex flex-col justify-between gap-2 sm:flex-row">

                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">
                                {item.title}
                              </h3>

                              {item.description && (
                                <p className="mt-1 text-sm leading-5 text-gray-500">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <span className="h-fit w-fit rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
                              {item.item_type}
                            </span>

                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">

                            {item.difficulty && (
                              <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-600">
                                {item.difficulty}
                              </span>
                            )}

                            {item.estimated_hours && (
                              <span className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-500">
                                ~{item.estimated_hours} hours
                              </span>
                            )}

                          </div>

                        </div>
                      ))}

                    </div>
                  </div>
                )}

              </div>

              {/* Action */}
              <div className="shrink-0">

                {selected.status === "Locked" ? (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-xl bg-gray-100 px-5 py-3 text-sm font-medium text-gray-400"
                  >
                    Locked
                  </button>
                ) : selected.title === "Security Operations" ? (
                  <Link
                    href="/learning"
                    className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Continue Learning →
                  </Link>
                ) : selected.title === "Portfolio & Job Preparation" ? (
                  <Link
                    href="/projects"
                    className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    View Projects →
                  </Link>
                ) : (
                  <Link
                    href="/learning"
                    className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Continue Learning →
                  </Link>
                )}

              </div>

            </div>
          </section>
        )}

        {/* Bottom Recommendation */}
        <section className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 md:p-8">

          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Recommended Next Action
          </p>

          <h2 className="mt-2 text-xl font-semibold text-gray-900">

            {recommendedSkills.length > 0
              ? `Strengthen your ${recommendedSkills[0].skill_name} skills`
              : recommendedPhase
                ? "Continue with your current roadmap phase"
                : "Start building your career foundation"}

          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">

            {recommendedSkills.length > 0
              ? `${recommendedSkills
                  .slice(0, 2)
                  .map((skill) => skill.skill_name)
                  .join(" and ")} ${
                  recommendedSkills.length === 1
                    ? "is"
                    : "are"
                } currently among your largest skill gaps for the ${roleName} role. Focus on these areas before moving deeper into the roadmap.`
              : `Your next step is to continue developing the skills required for your ${roleName} career path.`}

          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            <Link
              href="/learning"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Go to Learning →
            </Link>

            <Link
              href="/projects"
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Explore Projects →
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}