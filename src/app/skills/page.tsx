"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type SkillGap = {
  skill_id: number;
  skill_name: string;
  skill_score: number;
  required_level: number;
  priority: string;
  skill_gap: number;
  status: string;
};

export default function SkillsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [skills, setSkills] = useState<SkillGap[]>([]);
  const [roleName, setRoleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSkillAnalysis() {
      setLoading(true);
      setError("");

      try {
        // Get logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(
            "You must be logged in to view your skill analysis."
          );
        }

        // Get user's latest assessment
        const { data: attempt, error: attemptError } =
          await supabase
            .from("assessment_attempts")
            .select("id, role_id, completed_at")
            .eq("user_id", user.id)
            .not("completed_at", "is", null)
            .order("completed_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (attemptError) {
          console.error(attemptError);
          throw new Error(
            "Unable to load your assessment."
          );
        }

        if (!attempt) {
          throw new Error(
            "Complete your career assessment first."
          );
        }

        // Get role name
        const { data: role, error: roleError } =
          await supabase
            .from("career_roles")
            .select("name")
            .eq("id", attempt.role_id)
            .single();

        if (roleError || !role) {
          throw new Error(
            "Unable to load your selected career."
          );
        }

        setRoleName(role.name);

        // Get skill gaps for this assessment
        const { data: skillData, error: skillError } =
          await supabase
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

        if (skillError) {
          console.error(skillError);
          throw new Error(
            "Unable to load your skill analysis."
          );
        }

        setSkills(skillData ?? []);
      } catch (err) {
        console.error(err);

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

  const overallScore = useMemo(() => {
    if (skills.length === 0) return 0;

    const total = skills.reduce(
      (sum, skill) => sum + Number(skill.skill_score),
      0
    );

    return Math.round(total / skills.length);
  }, [skills]);

  const strongestSkill = useMemo(() => {
    if (skills.length === 0) return null;

    return [...skills].sort(
      (a, b) =>
        Number(b.skill_score) -
        Number(a.skill_score)
    )[0];
  }, [skills]);

  const biggestGap = useMemo(() => {
    if (skills.length === 0) return null;

    return [...skills].sort(
      (a, b) =>
        Number(b.skill_gap) -
        Number(a.skill_gap)
    )[0];
  }, [skills]);

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
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            Skill Analysis
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Your skills for {roleName}
          </h1>

          <p className="mt-2 max-w-2xl text-gray-500">
            Your skill levels are calculated from your
            assessment answers and compared with the
            requirements for your target career.
          </p>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Overall Skill Score
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {overallScore}%
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Strongest Skill
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              {strongestSkill?.skill_name ?? "—"}
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

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Biggest Skill Gap
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              {biggestGap?.skill_name ?? "—"}
            </p>

            {biggestGap && (
              <p className="mt-1 text-sm text-amber-600">
                {Number(
                  biggestGap.skill_gap
                ).toFixed(0)}
                % gap
              </p>
            )}
          </div>

        </div>

        {/* Skill List */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-900">
              Skill Breakdown
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Ranked by the size of your current skill gap.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {skills.map((skill) => {
              const score = Number(skill.skill_score);
              const required = Number(
                skill.required_level
              );
              const gap = Number(skill.skill_gap);

              return (
                <div
                  key={skill.skill_id}
                  className="p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {skill.skill_name}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            skill.status === "Strong"
                              ? "bg-green-50 text-green-700"
                              : skill.status === "Good"
                              ? "bg-blue-50 text-blue-700"
                              : skill.status ===
                                "Needs Improvement"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {skill.status}
                        </span>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          {skill.priority}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        Required level: {required}%
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {score.toFixed(0)}%
                      </p>

                      <p
                        className={`text-sm font-medium ${
                          gap > 0
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        {gap > 0
                          ? `${gap.toFixed(0)}% gap`
                          : "Requirement met"}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{
                          width: `${Math.min(
                            score,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recommendation */}
                  {gap > 0 && (
                    <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">
                          Recommended focus:
                        </span>{" "}
                        Improve your{" "}
                        {skill.skill_name} skills
                        to reach the required
                        {` ${required}% `}
                        level.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
      <div className="mt-8 flex justify-end">
  <button
    onClick={() => router.push("/roadmap")}
    className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
  >
    View My Personalized Roadmap →
  </button>
</div>
    </main>
  );
}
