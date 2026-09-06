"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SkillGap = {
  skill_id: number;
  skill_name: string;
  skill_score: number;
  required_level: number;
  priority: string;
  skill_gap: number;
  status: string;
};

type LearningResource = {
  id: number;
  skill_id: number;
  name: string;
  provider: string;
  difficulty: "Basic" | "Intermediate" | "Advanced";
  estimated_hours: number | null;
  description: string | null;
  resource_type:
    | "Documentation"
    | "Course"
    | "Video"
    | "Practice";
  url: string | null;
};

type CareerRole = {
  id: number;
  name: string;
};

export default function LearningPage() {
  const supabase = createClient();

  const [role, setRole] = useState<CareerRole | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [resources, setResources] = useState<LearningResource[]>(
    []
  );

  const [selectedSkill, setSelectedSkill] = useState<
    number | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLearningData();
  }, []);

  async function loadLearningData() {
    try {
      setLoading(true);
      setError("");

      // =====================================================
      // STEP 1 — AUTHENTICATION
      // =====================================================

      console.log(
        "STEP 1: Checking authentication..."
      );

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(
          "AUTH ERROR:",
          authError
        );

        throw authError;
      }

      if (!user) {
        throw new Error(
          "No authenticated user found. Please login again."
        );
      }

      console.log(
        "STEP 1 OK — User:",
        user.id
      );

      // =====================================================
      // STEP 2 — PROFILE
      // =====================================================

      console.log(
        "STEP 2: Loading profile..."
      );

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("target_role_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );

        throw profileError;
      }

      if (!profile) {
        throw new Error(
          "Profile not found for this user."
        );
      }

      if (!profile.target_role_id) {
        throw new Error(
          "Your profile does not have a target career selected."
        );
      }

      console.log(
        "STEP 2 OK — target_role_id:",
        profile.target_role_id
      );

      // =====================================================
      // STEP 3 — CAREER ROLE
      // =====================================================

      console.log(
        "STEP 3: Loading career role..."
      );

      const {
        data: roleData,
        error: roleError,
      } = await supabase
        .from("career_roles")
        .select("id, name")
        .eq("id", profile.target_role_id)
        .single();

      if (roleError) {
        console.error(
          "ROLE ERROR:",
          roleError
        );

        throw roleError;
      }

      if (!roleData) {
        throw new Error(
          "Selected career role was not found."
        );
      }

      setRole(roleData);

      console.log(
        "STEP 3 OK — Role:",
        roleData
      );

      // =====================================================
      // STEP 4 — LATEST COMPLETED ASSESSMENT
      // =====================================================

      console.log(
        "STEP 4: Loading latest assessment..."
      );

      const {
        data: attempt,
        error: attemptError,
      } = await supabase
        .from("assessment_attempts")
        .select("id")
        .eq("user_id", user.id)
        .eq("role_id", profile.target_role_id)
        .not("completed_at", "is", null)
        .order("completed_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (attemptError) {
        console.error(
          "ASSESSMENT ATTEMPT ERROR:",
          attemptError
        );

        throw attemptError;
      }

      if (!attempt) {
        console.log(
          "STEP 4 — No completed assessment found."
        );

        setSkillGaps([]);
        setResources([]);
        return;
      }

      console.log(
        "STEP 4 OK — Assessment attempt:",
        attempt.id
      );

      // =====================================================
      // STEP 5 — USER SKILL GAPS
      // =====================================================

      console.log(
        "STEP 5: Loading skill gaps..."
      );

      const {
        data: gaps,
        error: gapsError,
      } = await supabase
        .from("user_skill_gaps")
        .select(
          `
            skill_id,
            skill_name,
            skill_score,
            required_level,
            priority,
            skill_gap,
            status
          `
        )
        .eq("attempt_id", attempt.id)
        .order("skill_gap", {
          ascending: false,
        });

      if (gapsError) {
        console.error(
          "SKILL GAP ERROR:",
          gapsError
        );

        throw gapsError;
      }

      const loadedGaps =
        (gaps ?? []) as SkillGap[];

      console.log(
        "STEP 5 OK — Skill gaps:",
        loadedGaps
      );

      setSkillGaps(loadedGaps);

      // Select biggest skill gap by default
      if (loadedGaps.length > 0) {
        setSelectedSkill(
          loadedGaps[0].skill_id
        );
      }

      // =====================================================
      // STEP 6 — LEARNING RESOURCES
      // =====================================================

      const skillIds = loadedGaps.map(
        (skill) => skill.skill_id
      );

      console.log(
        "STEP 6 — Skill IDs:",
        skillIds
      );

      if (skillIds.length === 0) {
        console.log(
          "STEP 6 — No skills available."
        );

        setResources([]);
        return;
      }

      console.log(
        "STEP 6: Loading learning resources..."
      );

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from("learning_resources")
        .select("*")
        .in("skill_id", skillIds)
        .order("difficulty", {
          ascending: true,
        });

      if (resourceError) {
        console.error(
          "LEARNING RESOURCE ERROR:",
          resourceError
        );

        throw resourceError;
      }

      const loadedResources =
        (resourceData ?? []) as LearningResource[];

      console.log(
        "STEP 6 OK — Resources:",
        loadedResources
      );

      setResources(loadedResources);

      console.log(
        "======================================"
      );
      console.log(
        "LEARNING DATA LOADED SUCCESSFULLY"
      );
      console.log(
        "======================================"
      );
    } catch (err: any) {
      console.error(
        "======================================"
      );
      console.error(
        "LEARNING PAGE ERROR"
      );
      console.error(
        "======================================"
      );

      console.error(
        "message:",
        err?.message
      );

      console.error(
        "details:",
        err?.details
      );

      console.error(
        "hint:",
        err?.hint
      );

      console.error(
        "code:",
        err?.code
      );

      console.error(
        "full error:",
        JSON.stringify(
          err,
          null,
          2
        )
      );

      console.error(
        "======================================"
      );

      setError(
        err?.message ||
          "Unable to load your personalized learning plan."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // SELECTED SKILL
  // =========================================================

  const selectedSkillData = useMemo(() => {
    return skillGaps.find(
      (skill) =>
        skill.skill_id === selectedSkill
    );
  }, [
    skillGaps,
    selectedSkill,
  ]);

  // =========================================================
  // SELECTED RESOURCES
  // =========================================================

  const selectedResources = useMemo(() => {
    if (!selectedSkill) {
      return [];
    }

    return resources.filter(
      (resource) =>
        resource.skill_id === selectedSkill
    );
  }, [
    resources,
    selectedSkill,
  ]);

  // =========================================================
  // OVERALL SCORE
  // =========================================================

  const overallScore = useMemo(() => {
    if (skillGaps.length === 0) {
      return 0;
    }

    const total = skillGaps.reduce(
      (sum, skill) =>
        sum +
        Number(skill.skill_score),
      0
    );

    return Math.round(
      total / skillGaps.length
    );
  }, [skillGaps]);

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-7xl">

          <div className="animate-pulse space-y-6">

            <div className="h-8 w-64 rounded-lg bg-gray-200" />

            <div className="h-32 rounded-2xl bg-gray-200" />

            <div className="grid gap-5 lg:grid-cols-3">

              <div className="h-64 rounded-2xl bg-gray-200" />

              <div className="h-64 rounded-2xl bg-gray-200 lg:col-span-2" />

            </div>

          </div>

        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 lg:px-10">

        <div className="mx-auto max-w-4xl">

          <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl">
              ⚠️
            </div>

            <h1 className="text-xl font-bold text-gray-900">
              Learning Plan
            </h1>

            <p className="mt-3 text-sm leading-6 text-red-600">
              {error}
            </p>

            <button
              onClick={loadLearningData}
              className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Try Again
            </button>

          </div>

        </div>

      </main>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-8 lg:px-10">

      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="mb-2 text-sm font-semibold text-indigo-600">
                Personalized Learning
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                What to Learn
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Your learning resources are selected based
                on your assessment results and target career.
              </p>

            </div>

            {role && (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">

                <p className="text-xs font-medium text-gray-400">
                  Target Career
                </p>

                <p className="mt-1 text-sm font-bold text-gray-900">
                  {role.name}
                </p>

              </div>
            )}

          </div>

        </div>

        {/* ================================================= */}
        {/* OVERVIEW CARDS */}
        {/* ================================================= */}

        <section className="mb-8 grid gap-5 md:grid-cols-3">

          {/* Current Level */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Current Skill Level
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {overallScore}%
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Average assessment performance
            </p>

          </div>

          {/* Skills To Improve */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Skills to Improve
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {
                skillGaps.filter(
                  (skill) =>
                    skill.status !==
                    "Strong"
                ).length
              }
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Based on your latest assessment
            </p>

          </div>

          {/* Recommended */}

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">

            <p className="text-sm font-semibold text-indigo-700">
              Recommended Next
            </p>

            <p className="mt-3 text-xl font-bold text-gray-900">
              {skillGaps[0]?.skill_name ??
                "Complete your assessment"}
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-600">
              Focus on your largest current
              skill gap first.
            </p>

          </div>

        </section>

        {/* ================================================= */}
        {/* NO ASSESSMENT */}
        {/* ================================================= */}

        {skillGaps.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
              📚
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No learning plan yet
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
              Complete your career assessment first.
              CareerPath will then identify your skill
              gaps and recommend learning resources.
            </p>

          </div>

        ) : (

          /* ================================================= */
          /* SKILLS + RESOURCES */
          /* ================================================= */

          <div className="grid gap-6 lg:grid-cols-3">

            {/* ================================================= */}
            {/* SKILL GAP SIDEBAR */}
            {/* ================================================= */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="mb-5">

                <h2 className="text-lg font-bold text-gray-900">
                  Your Skill Gaps
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Select a skill to see recommended
                  resources.
                </p>

              </div>

              <div className="space-y-3">

                {skillGaps.map(
                  (skill) => {

                    const active =
                      selectedSkill ===
                      skill.skill_id;

                    return (
                      <button
                        key={
                          skill.skill_id
                        }
                        onClick={() =>
                          setSelectedSkill(
                            skill.skill_id
                          )
                        }
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          active
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                        }`}
                      >

                        {/* Skill Header */}

                        <div className="flex items-center justify-between gap-3">

                          <span className="text-sm font-semibold text-gray-900">
                            {skill.skill_name}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                              skill.status ===
                              "Strong"
                                ? "bg-green-100 text-green-700"
                                : skill.status ===
                                  "Good"
                                ? "bg-blue-100 text-blue-700"
                                : skill.status ===
                                  "Needs Improvement"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {skill.status}
                          </span>

                        </div>

                        {/* Score */}

                        <div className="mt-3 flex items-center justify-between text-xs">

                          <span className="text-gray-500">
                            Current
                          </span>

                          <span className="font-bold text-gray-800">
                            {Math.round(
                              Number(
                                skill.skill_score
                              )
                            )}
                            %
                          </span>

                        </div>

                        {/* Progress */}

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">

                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${Math.min(
                                Number(
                                  skill.skill_score
                                ),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                        {/* Priority */}

                        <div className="mt-3 flex items-center justify-between">

                          <span className="text-[11px] text-gray-400">
                            Priority
                          </span>

                          <span
                            className={`text-[11px] font-semibold ${
                              skill.priority
                                ?.toLowerCase()
                                .includes(
                                  "high"
                                )
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            {skill.priority}
                          </span>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>

            </section>

            {/* ================================================= */}
            {/* LEARNING RESOURCES */}
            {/* ================================================= */}

            <section className="lg:col-span-2">

              {/* Current Focus */}

              {selectedSkillData && (

                <div className="mb-5 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">

                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        Current Focus
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-gray-900">
                        {
                          selectedSkillData.skill_name
                        }
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-gray-500">

                        Your current score is{" "}

                        <strong>
                          {Math.round(
                            Number(
                              selectedSkillData.skill_score
                            )
                          )}
                          %
                        </strong>

                        . The required level for
                        your target career is{" "}

                        <strong>
                          {
                            selectedSkillData.required_level
                          }
                          %
                        </strong>
                        .

                      </p>

                    </div>

                    <div className="rounded-xl bg-gray-50 px-4 py-3">

                      <p className="text-xs text-gray-400">
                        Skill Gap
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {Math.round(
                          Number(
                            selectedSkillData.skill_gap
                          )
                        )}
                        %
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* Resource List */}

              <div className="space-y-4">

                {selectedResources.length === 0 ? (

                  <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-xl">
                      📖
                    </div>

                    <p className="mt-4 text-sm text-gray-500">
                      No learning resources have been
                      added for this skill yet.
                    </p>

                  </div>

                ) : (

                  selectedResources.map(
                    (resource) => (

                      <article
                        key={
                          resource.id
                        }
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >

                        <div className="flex flex-col justify-between gap-5 md:flex-row">

                          {/* Resource Information */}

                          <div className="flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                                {
                                  resource.resource_type
                                }
                              </span>

                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                                {
                                  resource.difficulty
                                }
                              </span>

                            </div>

                            <h3 className="mt-3 text-lg font-bold text-gray-900">
                              {resource.name}
                            </h3>

                            <p className="mt-1 text-sm font-medium text-gray-500">
                              {resource.provider}
                            </p>

                            {resource.description && (

                              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                                {
                                  resource.description
                                }
                              </p>

                            )}

                            {resource.estimated_hours && (

                              <p className="mt-4 text-xs font-medium text-gray-400">
                                Estimated time:{" "}
                                {
                                  resource.estimated_hours
                                }{" "}
                                hours
                              </p>

                            )}

                          </div>

                          {/* Start Button */}

                          <div className="flex items-center">

                            {resource.url && (

                              <a
                                href={
                                  resource.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                              >
                                Start Learning →
                              </a>

                            )}

                          </div>

                        </div>

                      </article>

                    )
                  )

                )}

              </div>

            </section>

          </div>

        )}

      </div>

    </main>
  );
}