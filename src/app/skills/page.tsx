"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type SkillGap = {
  skill_id: number;
  skill_name: string;
  skill_score: number | null;
  required_level: number;
  priority: string | null;
  skill_gap: number | null;
  status: string;
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

export default function SkillsPage() {
  const router = useRouter();

  const [skills, setSkills] = useState<SkillGap[]>([]);
  const [roleName, setRoleName] = useState("");
  const [overallScore, setOverallScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSkillAnalysis() {
      setLoading(true);
      setError("");

      const supabase = createClient();

      try {
        // =====================================================
        // 1. GET CURRENT USER
        // =====================================================

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(
            "You must be logged in to view your skill analysis."
          );
        }

        // =====================================================
        // 2. GET LATEST COMPLETED ASSESSMENT
        // =====================================================

        const {
          data: attempt,
          error: attemptError,
        } = await supabase
          .from("assessment_attempts")
          .select(
            `
              id,
              role_id,
              score,
              total_questions,
              correct_answers,
              completed_at
            `
          )
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .order("completed_at", {
            ascending: false,
          })
          .order("id", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (attemptError) {
          console.error(
            "LATEST ASSESSMENT ERROR:",
            attemptError
          );

          throw new Error(
            `Unable to load your assessment: ${attemptError.message}`
          );
        }

        if (!attempt) {
          throw new Error(
            "Complete your career assessment first."
          );
        }

        console.log(
          "Latest assessment:",
          attempt
        );

        // =====================================================
        // 3. OVERALL ASSESSMENT SCORE
        // =====================================================

        const assessmentScore = Number(
          attempt.score ?? 0
        );

        setOverallScore(
          Math.max(
            0,
            Math.min(100, assessmentScore)
          )
        );

        // =====================================================
        // 4. GET CAREER ROLE
        // =====================================================

        const {
          data: role,
          error: roleError,
        } = await supabase
          .from("career_roles")
          .select("id, name")
          .eq("id", attempt.role_id)
          .maybeSingle();

        if (roleError || !role) {
          console.error(
            "ROLE ERROR:",
            roleError
          );

          throw new Error(
            "Unable to load your selected career."
          );
        }

        setRoleName(role.name);

        // =====================================================
        // 5. FIRST TRY user_skill_gaps
        // =====================================================

        const {
          data: existingGaps,
          error: gapError,
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
          .eq("user_id", user.id)
          .eq("attempt_id", attempt.id)
          .eq("role_id", attempt.role_id)
          .order("skill_gap", {
            ascending: false,
            nullsFirst: false,
          });

        if (gapError) {
          console.warn(
            "user_skill_gaps query failed:",
            gapError
          );
        }

        // =====================================================
        // 6. IF GAPS EXIST, USE THEM
        // =====================================================

        if (
          existingGaps &&
          existingGaps.length > 0
        ) {
          console.log(
            "Using existing skill gaps:",
            existingGaps
          );

          setSkills(
            existingGaps.map((row) => ({
              skill_id: Number(row.skill_id),
              skill_name:
                row.skill_name ??
                "Unnamed skill",
              skill_score:
                row.skill_score === null
                  ? null
                  : Number(row.skill_score),
              required_level:
                Number(
                  row.required_level ?? 0
                ),
              priority:
                row.priority ?? null,
              skill_gap:
                row.skill_gap === null
                  ? null
                  : Number(row.skill_gap),
              status:
                row.status ??
                "Not Assessed",
            }))
          );

          setLoading(false);
          return;
        }

        // =====================================================
        // 7. FALLBACK:
        // GET ROLE REQUIREMENTS
        // =====================================================

        console.log(
          "No user_skill_gaps found. Building skill analysis from role_skills + assessment scores."
        );

        const {
          data: roleSkills,
          error: roleSkillsError,
        } = await supabase
          .from("role_skills")
          .select(
            `
              skill_id,
              required_level,
              priority
            `
          )
          .eq("role_id", attempt.role_id);

        if (roleSkillsError) {
          console.error(
            "ROLE SKILLS ERROR:",
            roleSkillsError
          );

          throw new Error(
            `Unable to load career skill requirements: ${roleSkillsError.message}`
          );
        }

        // =====================================================
        // 8. GET SKILL SCORES FROM ASSESSMENT
        // =====================================================

        const {
          data: skillScores,
          error: skillScoresError,
        } = await supabase
          .from("user_skill_assessment_scores")
          .select(
            `
              skill_id,
              skill_name,
              skill_score
            `
          )
          .eq("user_id", user.id)
          .eq("attempt_id", attempt.id)
          .eq("role_id", attempt.role_id);

        if (skillScoresError) {
          console.error(
            "SKILL SCORES ERROR:",
            skillScoresError
          );

          throw new Error(
            `Unable to load your skill scores: ${skillScoresError.message}`
          );
        }

        // =====================================================
        // 9. BUILD SCORE MAP
        // =====================================================

        const scoreMap =
          new Map<number, SkillScore>();

        (
          (skillScores ?? []) as SkillScore[]
        ).forEach((row) => {
          scoreMap.set(
            Number(row.skill_id),
            {
              skill_id:
                Number(row.skill_id),
              skill_name:
                row.skill_name,
              skill_score:
                row.skill_score === null
                  ? null
                  : Number(row.skill_score),
            }
          );
        });

        // =====================================================
        // 10. GET SKILL NAMES FOR ROLE SKILLS
        // =====================================================

        const roleSkillIds =
          (roleSkills ?? []).map(
            (row: RoleSkill) =>
              Number(row.skill_id)
          );

        let skillNameMap =
          new Map<number, string>();

        if (roleSkillIds.length > 0) {
          const {
            data: skillRows,
            error: skillRowsError,
          } = await supabase
            .from("skills")
            .select("id, name")
            .in("id", roleSkillIds);

          if (skillRowsError) {
            console.warn(
              "SKILL NAME ERROR:",
              skillRowsError
            );
          } else {
            (skillRows ?? []).forEach(
              (row) => {
                skillNameMap.set(
                  Number(row.id),
                  row.name
                );
              }
            );
          }
        }

        // =====================================================
        // 11. BUILD COMPLETE SKILL ANALYSIS
        // =====================================================

        const calculatedSkills: SkillGap[] =
          (roleSkills ?? []).map(
            (roleSkill: RoleSkill) => {
              const skillId =
                Number(roleSkill.skill_id);

              const scoreRow =
                scoreMap.get(skillId);

              const isAssessed =
                Boolean(scoreRow);

              const score =
                scoreRow && scoreRow.skill_score !== null
                  ? Number(
                    scoreRow.skill_score
                  )
                  : null;

              const required =
                Number(
                  roleSkill.required_level ?? 0
                );

              const gap =
                score === null
                  ? null
                  : Math.max(
                    0,
                    required - score
                  );

              let status =
                "Not Assessed";

              if (score !== null) {
                if (score >= required) {
                  status = "Strong";
                } else if (
                  gap !== null &&
                  gap >= 25
                ) {
                  status = "Critical Gap";
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
                skill_id: skillId,

                skill_name:
                  scoreRow?.skill_name ??
                  skillNameMap.get(
                    skillId
                  ) ??
                  "Unnamed skill",

                skill_score: score,

                required_level: required,

                priority:
                  roleSkill.priority ??
                  null,

                skill_gap: gap,

                status,
              };
            }
          );

        // =====================================================
        // 12. SORT
        // =====================================================

        calculatedSkills.sort(
          (a, b) => {
            const gapA =
              a.skill_gap ?? -1;

            const gapB =
              b.skill_gap ?? -1;

            return gapB - gapA;
          }
        );

        console.log(
          "Calculated skill analysis:",
          calculatedSkills
        );

        setSkills(
          calculatedSkills
        );
      } catch (err) {
        console.error(
          "SKILL ANALYSIS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSkillAnalysis();
  }, []);

  // ===========================================================
  // STRONGEST SKILL
  // ===========================================================

  const strongestSkill = useMemo(() => {
    const assessedSkills =
      skills.filter(
        (skill) =>
          skill.skill_score !== null
      );

    if (
      assessedSkills.length === 0
    ) {
      return null;
    }

    return [...assessedSkills].sort(
      (a, b) =>
        Number(b.skill_score) -
        Number(a.skill_score)
    )[0];
  }, [skills]);

  // ===========================================================
  // BIGGEST GAP
  // ===========================================================

  const biggestGap = useMemo(() => {
    const skillsWithGaps =
      skills.filter(
        (skill) =>
          skill.skill_gap !== null &&
          Number(skill.skill_gap) > 0
      );

    if (
      skillsWithGaps.length === 0
    ) {
      return null;
    }

    return [...skillsWithGaps].sort(
      (a, b) =>
        Number(b.skill_gap) -
        Number(a.skill_gap)
    )[0];
  }, [skills]);

  // ===========================================================
  // STATUS STYLE
  // ===========================================================

  function getStatusStyle(
    status: string
  ) {
    switch (status) {
      case "Strong":
        return "bg-green-50 text-green-700";

      case "Good Progress":
        return "bg-blue-50 text-blue-700";

      case "Needs Improvement":
        return "bg-amber-50 text-amber-700";

      case "Critical Gap":
        return "bg-red-50 text-red-700";

      case "Not Assessed":
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  // ===========================================================
  // LOADING
  // ===========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Analyzing your assessment results...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ===========================================================
  // ERROR
  // ===========================================================

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load skill analysis
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/assessment"
                )
              }
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Take Assessment Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ===========================================================
  // PAGE
  // ===========================================================

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            Skill Analysis
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Your skills for {roleName}
          </h1>

          <p className="mt-2 max-w-2xl text-gray-500">
            Your skill levels are calculated from
            your latest assessment and compared
            with the requirements for your target
            career.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="grid gap-4 md:grid-cols-3">

          {/* OVERALL */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Overall Assessment Score
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {overallScore.toFixed(0)}%
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Latest 20-question assessment
            </p>
          </div>

          {/* STRONGEST */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Strongest Skill
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              {strongestSkill
                ? strongestSkill.skill_name
                : "Not Assessed"}
            </p>

            {strongestSkill && (
              <p className="mt-1 text-sm text-green-600">
                {Number(
                  strongestSkill.skill_score
                ).toFixed(0)}
                % proficiency
              </p>
            )}
          </div>

          {/* BIGGEST GAP */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Biggest Skill Gap
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              {biggestGap
                ? biggestGap.skill_name
                : "No major gap"}
            </p>

            {biggestGap && (
              <p className="mt-1 text-sm text-red-600">
                {Number(
                  biggestGap.skill_gap
                ).toFixed(0)}
                % gap
              </p>
            )}
          </div>
        </div>

        {/* BREAKDOWN */}

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-900">
              Skill Breakdown
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Skills are ranked by the size of
              the current gap.
            </p>
          </div>

          {skills.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium text-gray-900">
                No skill analysis available yet.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Complete an assessment to
                generate your personalized
                skill analysis.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">

              {skills.map((skill) => {
                const isAssessed =
                  skill.skill_score !== null;

                const score =
                  skill.skill_score !== null
                    ? Number(
                      skill.skill_score
                    )
                    : 0;

                const required =
                  Number(
                    skill.required_level
                  );

                const gap =
                  skill.skill_gap !== null
                    ? Number(
                      skill.skill_gap
                    )
                    : null;

                return (
                  <div
                    key={skill.skill_id}
                    className="p-6"
                  >

                    {/* TOP */}

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-semibold text-gray-900">
                            {skill.skill_name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                              skill.status
                            )}`}
                          >
                            {skill.status}
                          </span>

                          {skill.priority && (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              Priority{" "}
                              {skill.priority}
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          Required level:{" "}
                          {required}%
                        </p>

                      </div>

                      {/* SCORE */}

                      <div className="text-left md:text-right">

                        {isAssessed ? (
                          <>
                            <p className="text-2xl font-bold text-gray-900">
                              {score.toFixed(0)}%
                            </p>

                            {gap !== null &&
                              gap > 0 ? (
                              <p className="text-sm font-medium text-amber-600">
                                {gap.toFixed(
                                  0
                                )}
                                % gap
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-green-600">
                                Requirement met
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm font-medium text-gray-500">
                            Not assessed
                          </p>
                        )}

                      </div>
                    </div>

                    {/* PROGRESS */}

                    <div className="mt-4">

                      <div className="relative h-3 overflow-hidden rounded-full bg-gray-100">

                        {isAssessed && (
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all"
                            style={{
                              width: `${Math.min(
                                score,
                                100
                              )}%`,
                            }}
                          />
                        )}

                      </div>

                      {isAssessed && (
                        <div className="mt-2 flex justify-between text-xs text-gray-400">
                          <span>
                            Current:{" "}
                            {score.toFixed(
                              0
                            )}
                            %
                          </span>

                          <span>
                            Required:{" "}
                            {required}%
                          </span>
                        </div>
                      )}

                    </div>

                    {/* CRITICAL */}

                    {skill.status ===
                      "Critical Gap" && (
                        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                          <p className="text-sm text-red-800">
                            <span className="font-semibold">
                              Priority focus:
                            </span>{" "}
                            Your{" "}
                            {skill.skill_name}{" "}
                            knowledge needs
                            significant
                            improvement.
                          </p>
                        </div>
                      )}

                    {/* NEEDS IMPROVEMENT */}

                    {skill.status ===
                      "Needs Improvement" && (
                        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                          <p className="text-sm text-amber-800">
                            <span className="font-semibold">
                              Recommended focus:
                            </span>{" "}
                            Continue improving{" "}
                            {skill.skill_name}{" "}
                            to reach the
                            required{" "}
                            {required}% level.
                          </p>
                        </div>
                      )}

                    {/* NOT ASSESSED */}

                    {skill.status ===
                      "Not Assessed" && (
                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                          <p className="text-sm text-gray-600">
                            This skill was not
                            covered by your
                            latest 20-question
                            assessment.
                          </p>
                        </div>
                      )}

                  </div>
                );
              })}

            </div>
          )}
        </div>

        {/* ROADMAP */}

        <div className="mt-8 flex justify-end">
          <button
            onClick={() =>
              router.push(
                "/roadmap"
              )
            }
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            View My Personalized Roadmap →
          </button>
        </div>

      </div>
    </main>
  );
}