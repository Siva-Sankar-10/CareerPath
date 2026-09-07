"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  PlayCircle,
  Target,
} from "lucide-react";

type LearningResource = {
  id: number;
  name: string;
  provider: string | null;
  difficulty: string | null;
  estimated_hours: number | null;
  description: string | null;
  resource_type: string | null;
  url: string | null;
  skill_id: number;
  skill_name: string;
  skill_score: number;
  required_level: number;
  skill_gap: number;
  status: string;
  priority: string | null;
};

type LearningProgress = {
  learning_resource_id: number;
  progress: number;
  completed: boolean;
};

export default function LearningPage() {
  const supabase = createClient();

  const [resources, setResources] = useState<LearningResource[]>([]);
  const [progress, setProgress] = useState<
    Record<number, LearningProgress>
  >({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLearningData();
  }, []);

  async function loadLearningData() {
    try {
      setLoading(true);
      setError("");

      // =====================================================
      // 1. GET CURRENT USER
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError(
          "Please login to view your learning roadmap."
        );
        return;
      }

      // =====================================================
      // 2. GET LATEST SKILL GAPS
      // =====================================================

      const {
        data: gaps,
        error: gapsError,
      } = await supabase
        .from("user_skill_gaps")
        .select(`
          skill_id,
          skill_name,
          skill_score,
          required_level,
          skill_gap,
          status,
          priority,
          attempt_id
        `)
        .eq("user_id", user.id)
        .order("skill_gap", {
          ascending: false,
          nullsFirst: false,
        });

      if (gapsError) {
        throw gapsError;
      }

      // =====================================================
      // 3. GET LEARNING RESOURCES
      // =====================================================

      const {
        data: learningData,
        error: learningError,
      } = await supabase
        .from("learning_resources")
        .select(`
          id,
          name,
          provider,
          difficulty,
          estimated_hours,
          description,
          resource_type,
          url,
          skill_id
        `);

      if (learningError) {
        throw learningError;
      }

      // =====================================================
      // 4. CREATE SKILL GAP LOOKUP
      // =====================================================

      const gapMap = new Map<number, any>();

      for (const gap of gaps ?? []) {
        if (!gapMap.has(gap.skill_id)) {
          gapMap.set(gap.skill_id, gap);
        }
      }

      // =====================================================
      // 5. COMBINE LEARNING RESOURCES + SKILL GAPS
      // =====================================================

      const combined: LearningResource[] = [];

      for (const resource of learningData ?? []) {
        const gap = gapMap.get(resource.skill_id);

        if (!gap) {
          continue;
        }

        // Don't recommend learning resources for
        // skills that have not been assessed yet.
        if (gap.status === "Not Assessed") {
          continue;
        }

        combined.push({
          ...resource,

          skill_name: gap.skill_name,

          skill_score: Number(
            gap.skill_score ?? 0
          ),

          required_level: Number(
            gap.required_level ?? 0
          ),

          skill_gap: Number(
            gap.skill_gap ?? 0
          ),

          status:
            gap.status ??
            "Needs Improvement",

          priority:
            gap.priority ?? null,
        });
      }

      // =====================================================
      // 6. BIGGEST GAPS FIRST
      // =====================================================

      combined.sort((a, b) => {
        if (b.skill_gap !== a.skill_gap) {
          return b.skill_gap - a.skill_gap;
        }

        return a.name.localeCompare(b.name);
      });

      // =====================================================
      // 7. GET LEARNING PROGRESS
      // =====================================================

      const {
        data: progressData,
        error: progressError,
      } = await supabase
        .from("user_learning_progress")
        .select(`
          learning_resource_id,
          progress,
          completed
        `)
        .eq("user_id", user.id);

      if (progressError) {
        throw progressError;
      }

      const progressMap: Record<
        number,
        LearningProgress
      > = {};

      for (const item of progressData ?? []) {
        progressMap[item.learning_resource_id] = {
          learning_resource_id:
            item.learning_resource_id,

          progress: Number(
            item.progress ?? 0
          ),

          completed: Boolean(
            item.completed
          ),
        };
      }

      setResources(combined);
      setProgress(progressMap);
    } catch (err: any) {
      console.error(
        "LEARNING DATA ERROR:",
        err
      );

      setError(
        err?.message ||
        "Unable to load learning resources."
      );
    } finally {
      setLoading(false);
    }
  }

  // ===========================================================
  // UPDATE LEARNING PROGRESS
  // ===========================================================

  async function updateProgress(
    resource: LearningResource,
    value: number
  ) {
    try {
      setUpdating(resource.id);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("Please login first.");
        return;
      }

      const progressValue = Math.max(
        0,
        Math.min(100, value)
      );

      const completed =
        progressValue >= 100;

      const existing =
        progress[resource.id];

      const payload = {
        user_id: user.id,

        learning_resource_id:
          resource.id,

        progress: progressValue,

        completed,

        started_at:
          progressValue > 0
            ? existing
              ? undefined
              : new Date().toISOString()
            : null,

        completed_at: completed
          ? new Date().toISOString()
          : null,

        updated_at:
          new Date().toISOString(),
      };

      const {
        error: saveError,
      } = await supabase
        .from("user_learning_progress")
        .upsert(payload, {
          onConflict:
            "user_id,learning_resource_id",
        });

      if (saveError) {
        throw saveError;
      }

      setProgress((current) => ({
        ...current,

        [resource.id]: {
          learning_resource_id:
            resource.id,

          progress: progressValue,

          completed,
        },
      }));
    } catch (err: any) {
      console.error(
        "PROGRESS UPDATE ERROR:",
        err
      );

      setError(
        err?.message ||
        "Unable to update progress."
      );
    } finally {
      setUpdating(null);
    }
  }

  // ===========================================================
  // COMPLETED COUNT
  // ===========================================================

  const completedCount = useMemo(() => {
    return Object.values(progress).filter(
      (item) => item.completed
    ).length;
  }, [progress]);

  // ===========================================================
  // OVERALL LEARNING PROGRESS
  // ===========================================================

  const overallLearningProgress =
    useMemo(() => {
      if (resources.length === 0) {
        return 0;
      }

      const total = resources.reduce(
        (sum, resource) => {
          return (
            sum +
            (progress[resource.id]
              ?.progress ?? 0)
          );
        },
        0
      );

      return Math.round(
        total / resources.length
      );
    }, [resources, progress]);

  // ===========================================================
  // LOADING
  // ===========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafafa] p-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">

            <div className="h-10 w-72 rounded-lg bg-gray-200" />

            <div className="h-5 w-96 rounded bg-gray-200" />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-64 rounded-2xl bg-gray-200" />
              <div className="h-64 rounded-2xl bg-gray-200" />
            </div>

          </div>
        </div>
      </main>
    );
  }

  // ===========================================================
  // PAGE
  // ===========================================================

  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-8">

      <div className="mx-auto max-w-6xl space-y-8">

        {/* HEADER */}

        <section>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>

            <div>

              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Learning
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Learn the skills you need to close your biggest gaps.
              </p>

            </div>

          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* PROGRESS SUMMARY */}

        <section className="grid gap-4 md:grid-cols-3">

          {/* OVERALL */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <span className="text-sm text-gray-500">
                Overall Learning
              </span>

              <Target className="h-5 w-5 text-indigo-500" />

            </div>

            <div className="mt-3 text-3xl font-semibold text-gray-900">
              {overallLearningProgress}%
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${overallLearningProgress}%`,
                }}
              />

            </div>

          </div>

          {/* RECOMMENDED */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="text-sm text-gray-500">
              Recommended Resources
            </div>

            <div className="mt-3 text-3xl font-semibold text-gray-900">
              {resources.length}
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Based on your current skill gaps
            </p>

          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="text-sm text-gray-500">
              Completed
            </div>

            <div className="mt-3 text-3xl font-semibold text-gray-900">
              {completedCount}
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Learning resources completed
            </p>

          </div>

        </section>

        {/* EMPTY STATE */}

        {resources.length === 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <BookOpen className="mx-auto h-10 w-10 text-gray-400" />

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No learning recommendations yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
              Complete your career assessment first.
              CareerPath will use your skill gaps to
              recommend what you should learn next.
            </p>

          </section>
        )}

        {/* LEARNING RESOURCES */}

        <section className="space-y-5">

          {resources.map((resource) => {

            const currentProgress =
              progress[resource.id]
                ?.progress ?? 0;

            const completed =
              progress[resource.id]
                ?.completed ?? false;

            return (
              <article
                key={resource.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  {/* RESOURCE INFORMATION */}

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        {resource.skill_name}
                      </span>

                      {resource.status ===
                        "Critical Gap" && (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                            Critical Gap
                          </span>
                        )}

                      {resource.status ===
                        "Needs Improvement" && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            Needs Improvement
                          </span>
                        )}

                      {resource.status ===
                        "Good Progress" && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            Good Progress
                          </span>
                        )}

                      {resource.difficulty && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          {resource.difficulty}
                        </span>
                      )}

                      {resource.priority && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          Priority {resource.priority}
                        </span>
                      )}

                    </div>

                    <h2 className="mt-3 text-xl font-semibold text-gray-900">
                      {resource.name}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                      {resource.description ||
                        `Improve your ${resource.skill_name} skills through this learning resource.`}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">

                      {resource.provider && (
                        <span>
                          Provider:{" "}
                          <strong className="font-medium text-gray-700">
                            {resource.provider}
                          </strong>
                        </span>
                      )}

                      {resource.estimated_hours && (
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-4 w-4" />
                          {resource.estimated_hours} hours
                        </span>
                      )}

                      {resource.resource_type && (
                        <span>
                          {resource.resource_type}
                        </span>
                      )}

                    </div>

                    {/* SKILL GAP */}

                    <div className="mt-5 max-w-xl">

                      <div className="flex items-center justify-between text-xs">

                        <span className="text-gray-500">
                          Current skill level
                        </span>

                        <span className="font-medium text-gray-700">
                          {resource.skill_score}%
                          {" / "}
                          {resource.required_level}%
                        </span>

                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${Math.min(
                              resource.skill_score,
                              100
                            )}%`,
                          }}
                        />

                      </div>

                      {resource.skill_gap > 0 && (
                        <p className="mt-2 text-xs text-gray-500">
                          {resource.skill_gap.toFixed(0)}
                          {" points remaining to reach the required level."}
                        </p>
                      )}

                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="flex flex-col gap-3 lg:w-56">

                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                      >

                        <PlayCircle className="h-4 w-4" />

                        Start Learning

                        <ExternalLink className="h-3.5 w-3.5" />

                      </a>
                    )}

                    {completed ? (

                      <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">

                        <CheckCircle2 className="h-4 w-4" />

                        Completed

                      </div>

                    ) : (

                      <button
                        disabled={
                          updating === resource.id
                        }
                        onClick={() =>
                          updateProgress(
                            resource,
                            Math.min(
                              currentProgress + 25,
                              100
                            )
                          )
                        }
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        {updating === resource.id
                          ? "Saving..."
                          : currentProgress === 0
                            ? "Mark 25% Complete"
                            : `Mark ${Math.min(
                              currentProgress + 25,
                              100
                            )}% Complete`}

                      </button>

                    )}

                  </div>

                </div>

                {/* LEARNING PROGRESS */}

                <div className="mt-6 border-t border-gray-100 pt-5">

                  <div className="flex items-center justify-between text-sm">

                    <span className="font-medium text-gray-700">
                      Learning Progress
                    </span>

                    <span className="font-semibold text-indigo-600">
                      {currentProgress}%
                    </span>

                  </div>

                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">

                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{
                        width: `${currentProgress}%`,
                      }}
                    />

                  </div>

                </div>

              </article>
            );
          })}

        </section>

      </div>
    </main>
  );
}