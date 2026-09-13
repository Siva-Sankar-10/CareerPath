"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  PlayCircle,
  Target,
  Trophy,
  ChevronDown,
} from "lucide-react";

type SkillGap = {
  skill_id: number;
  skill_name: string;
  skill_score: number | null;
  required_level: number;
  skill_gap: number | null;
  status: string | null;
  priority: string | null;
};

type LearningResource = {
  id: number;
  skill_id: number;
  name: string;
  provider: string | null;
  difficulty: string | null;
  estimated_hours: number | null;
  description: string | null;
  resource_type: string;
  url: string | null;
  cost_type: string | null;
  credential_type: string | null;
  is_free: boolean;
};

type LearningProgress = {
  learning_resource_id: number;
  progress: number;
  completed: boolean;
  started_at: string | null;
  completed_at: string | null;
};

export default function LearningPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillGap[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [progressRows, setProgressRows] = useState<LearningProgress[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLearningData();
  }, []);

  async function loadLearningData() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // =====================================================
      // 1. GET LATEST SKILL GAPS
      // =====================================================

      const { data: gapData, error: gapError } = await supabase
        .from("user_skill_gaps")
        .select(
          `
            skill_id,
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
        .order("created_at", { ascending: false });

      if (gapError) {
        console.error("SKILL GAP ERROR:", gapError);
      }

      const latestSkills: SkillGap[] = [];
      const seenSkills = new Set<number>();

      for (const row of gapData || []) {
        const skillId = Number(row.skill_id);

        if (!seenSkills.has(skillId)) {
          seenSkills.add(skillId);

          latestSkills.push({
            skill_id: skillId,
            skill_name: row.skill_name,
            skill_score:
              row.skill_score === null
                ? null
                : Number(row.skill_score),
            required_level: Number(row.required_level ?? 0),
            skill_gap:
              row.skill_gap === null
                ? null
                : Number(row.skill_gap),
            status: row.status,
            priority: row.priority,
          });
        }
      }

      setSkills(latestSkills);

      // =====================================================
      // 2. GET LEARNING RESOURCES
      // =====================================================

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from("learning_resources")
        .select(
          `
            id,
            skill_id,
            name,
            provider,
            difficulty,
            estimated_hours,
            description,
            resource_type,
            url,
            cost_type,
            credential_type,
            is_free
          `
        )
        .order("id", { ascending: true });

      if (resourceError) {
        console.error("LEARNING RESOURCE ERROR:", resourceError);
      }

      setResources(resourceData || []);

      // =====================================================
      // 3. GET USER LEARNING PROGRESS
      // =====================================================

      const {
        data: progressData,
        error: progressError,
      } = await supabase
        .from("user_learning_progress")
        .select(
          `
            learning_resource_id,
            progress,
            completed,
            started_at,
            completed_at
          `
        )
        .eq("user_id", user.id);

      if (progressError) {
        console.error(
          "LEARNING PROGRESS ERROR:",
          progressError
        );
      }

      setProgressRows(progressData || []);
    } catch (error) {
      console.error("LEARNING PAGE ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  // ===========================================================
  // BIGGEST SKILL GAP
  // ===========================================================

  const biggestGapSkill = useMemo(() => {
    if (!skills.length) return null;

    return [...skills].sort(
      (a, b) =>
        (b.skill_gap ?? 0) -
        (a.skill_gap ?? 0)
    )[0];
  }, [skills]);

  // ===========================================================
  // ACTIVE SKILL
  // ===========================================================

  const activeSkillId =
    selectedSkillId ??
    biggestGapSkill?.skill_id ??
    null;

  const activeSkill = skills.find(
    (skill) => skill.skill_id === activeSkillId
  );

  // ===========================================================
  // PROGRESS MAP
  // IMPORTANT: THIS MUST COME BEFORE filteredResources
  // ===========================================================

  const progressMap = useMemo(() => {
    const map = new Map<number, LearningProgress>();

    for (const row of progressRows) {
      map.set(
        Number(row.learning_resource_id),
        {
          learning_resource_id: Number(
            row.learning_resource_id
          ),
          progress: Number(row.progress ?? 0),
          completed: Boolean(row.completed),
          started_at: row.started_at,
          completed_at: row.completed_at,
        }
      );
    }

    return map;
  }, [progressRows]);

  // ===========================================================
  // ACTIVE LEARNING RESOURCES
  //
  // Completed resources are hidden from the active list.
  // They remain in the database and progress history.
  // ===========================================================

  const filteredResources = useMemo(() => {
    if (!activeSkillId) return [];

    return resources.filter((resource) => {
      if (Number(resource.skill_id) !== Number(activeSkillId)) {
        return false;
      }

      const progress = progressMap.get(
        Number(resource.id)
      );

      const isCompleted =
        progress?.completed === true ||
        Number(progress?.progress ?? 0) >= 100;

      // Hide completed resources
      return !isCompleted;
    });
  }, [
    resources,
    activeSkillId,
    progressMap,
  ]);

  // ===========================================================
  // STATISTICS
  // ===========================================================

  const totalStarted = progressRows.filter(
    (item) => Number(item.progress) > 0
  ).length;

  const totalCompleted = progressRows.filter(
    (item) =>
      item.completed ||
      Number(item.progress) >= 100
  ).length;

  const overallLearningProgress =
    progressRows.length > 0
      ? Math.round(
          progressRows.reduce(
            (sum, item) =>
              sum +
              Math.min(
                Number(item.progress) || 0,
                100
              ),
            0
          ) / progressRows.length
        )
      : 0;

  // ===========================================================
  // UPDATE LEARNING PROGRESS
  // ===========================================================

  async function updateProgress(
    resource: LearningResource,
    newProgress: number
  ) {
    if (!userId) return;

    const progress = Math.max(
      0,
      Math.min(100, newProgress)
    );

    const completed = progress === 100;

    setSavingId(resource.id);

    try {
      const existing = progressMap.get(
        resource.id
      );

      const now = new Date().toISOString();

      const payload = {
        user_id: userId,
        learning_resource_id: resource.id,
        progress,
        completed,
        started_at:
          existing?.started_at ||
          (progress > 0 ? now : null),
        completed_at:
          completed
            ? existing?.completed_at || now
            : null,
        updated_at: now,
      };

      const {
        data,
        error,
      } = await supabase
        .from("user_learning_progress")
        .upsert(payload, {
          onConflict:
            "user_id,learning_resource_id",
        })
        .select(
          `
            learning_resource_id,
            progress,
            completed,
            started_at,
            completed_at
          `
        )
        .single();

      if (error) {
        console.error(
          "SAVE LEARNING PROGRESS ERROR:",
          error
        );

        alert(error.message);
        return;
      }

      // =====================================================
      // UPDATE LOCAL STATE
      // =====================================================

      setProgressRows((current) => {
        const filtered = current.filter(
          (item) =>
            Number(item.learning_resource_id) !==
            Number(resource.id)
        );

        return [
          ...filtered,
          {
            learning_resource_id: Number(
              data.learning_resource_id
            ),
            progress: Number(data.progress ?? 0),
            completed: Boolean(data.completed),
            started_at: data.started_at,
            completed_at: data.completed_at,
          },
        ];
      });
    } catch (error) {
      console.error(
        "UPDATE PROGRESS ERROR:",
        error
      );
    } finally {
      setSavingId(null);
    }
  }

  // ===========================================================
  // OPEN RESOURCE
  // ===========================================================

  function openResource(
    resource: LearningResource
  ) {
    if (resource.url) {
      window.open(
        resource.url,
        "_blank",
        "noopener,noreferrer"
      );
    }

    const current = progressMap.get(
      resource.id
    );

    if (
      !current ||
      Number(current.progress) === 0
    ) {
      updateProgress(resource, 10);
    }
  }

  // ===========================================================
  // LOADING
  // ===========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9fc] p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-gray-200" />

            <div className="mt-3 h-4 w-96 rounded bg-gray-200" />

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="h-32 rounded-2xl bg-gray-200" />
              <div className="h-32 rounded-2xl bg-gray-200" />
              <div className="h-32 rounded-2xl bg-gray-200" />
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
    <main className="min-h-screen bg-[#faf9fc] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Learning
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Learn the skills you need and track
                your progress toward job readiness.
              </p>
            </div>
          </div>
        </div>

        {/* STATS */}

        <div className="mb-8 grid gap-4 md:grid-cols-4">

          {/* SKILLS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Skills to Improve
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {skills.length}
                </p>
              </div>

              <Target className="h-7 w-7 text-indigo-500" />
            </div>
          </div>

          {/* STARTED */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Learning Started
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalStarted}
                </p>
              </div>

              <PlayCircle className="h-7 w-7 text-blue-500" />
            </div>
          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Completed
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalCompleted}
                </p>
              </div>

              <CheckCircle2 className="h-7 w-7 text-green-500" />
            </div>
          </div>

          {/* OVERALL */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Overall Progress
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {overallLearningProgress}%
                </p>
              </div>

              <Trophy className="h-7 w-7 text-amber-500" />
            </div>
          </div>

        </div>

        {/* PERSONALIZED RECOMMENDATION */}

        {biggestGapSkill && (
          <div className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />

                  <span className="text-sm font-semibold text-indigo-700">
                    Your biggest skill gap
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  {biggestGapSkill.skill_name}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Your current skill score is{" "}
                  <strong>
                    {biggestGapSkill.skill_score ??
                      "Not assessed"}
                  </strong>{" "}
                  and the required level is{" "}
                  <strong>
                    {biggestGapSkill.required_level}
                  </strong>
                  .
                </p>
              </div>

              <div className="rounded-xl bg-white px-5 py-3 shadow-sm">
                <p className="text-xs text-gray-500">
                  Skill gap
                </p>

                <p className="text-2xl font-bold text-red-600">
                  {biggestGapSkill.skill_gap ?? 0}%
                </p>
              </div>

            </div>
          </div>
        )}

        {/* SKILL SELECTOR */}

        {skills.length > 0 && (
          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Choose a skill
            </label>

            <div className="relative max-w-md">
              <select
                value={activeSkillId ?? ""}
                onChange={(e) =>
                  setSelectedSkillId(
                    e.target.value
                      ? Number(e.target.value)
                      : null
                  )
                }
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {skills.map((skill) => (
                  <option
                    key={skill.skill_id}
                    value={skill.skill_id}
                  >
                    {skill.skill_name} — Gap{" "}
                    {skill.skill_gap ?? 0}%
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}

        {/* ACTIVE SKILL */}

        {activeSkill && (
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

            <div>
              <p className="text-sm font-medium text-indigo-600">
                Recommended learning
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {activeSkill.skill_name}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Resources selected based on your assessed
                skill gap.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              {filteredResources.length} active resource
              {filteredResources.length !== 1
                ? "s"
                : ""}
            </div>

          </div>
        )}

        {/* RESOURCE LIST */}

        {filteredResources.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">

            {filteredResources.map((resource) => {
              const progress = progressMap.get(
                resource.id
              );

              const currentProgress =
                Number(progress?.progress ?? 0);

              const isCompleted =
                progress?.completed === true ||
                currentProgress >= 100;

              const isStarted =
                currentProgress > 0;

              return (
                <div
                  key={resource.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="p-6">

                    {/* RESOURCE TYPE */}

                    <div className="mb-4 flex flex-wrap items-center gap-2">

                      {resource.is_free && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          FREE
                        </span>
                      )}

                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {resource.resource_type}
                      </span>

                      {resource.credential_type && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {resource.credential_type}
                        </span>
                      )}

                    </div>

                    {/* TITLE */}

                    <h3 className="text-xl font-bold text-gray-900">
                      {resource.name}
                    </h3>

                    {resource.provider && (
                      <p className="mt-1 text-sm font-medium text-indigo-600">
                        {resource.provider}
                      </p>
                    )}

                    {resource.description && (
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {resource.description}
                      </p>
                    )}

                    {/* META */}

                    <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-500">

                      {resource.difficulty && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4" />
                          {resource.difficulty}
                        </div>
                      )}

                      {resource.estimated_hours && (
                        <div className="flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4" />
                          {resource.estimated_hours} hours
                        </div>
                      )}

                    </div>

                    {/* PROGRESS */}

                    <div className="mt-6">

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-sm font-semibold text-gray-700">
                          {isCompleted
                            ? "Completed"
                            : isStarted
                              ? "In progress"
                              : "Not started"}
                        </span>

                        <span className="text-sm font-bold text-indigo-600">
                          {currentProgress}%
                        </span>

                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className={`h-full rounded-full transition-all ${
                            isCompleted
                              ? "bg-green-500"
                              : "bg-indigo-600"
                          }`}
                          style={{
                            width: `${currentProgress}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* ACTION */}

                    <div className="mt-6 flex flex-wrap gap-3">

                      <button
                        onClick={() =>
                          openResource(resource)
                        }
                        disabled={
                          savingId === resource.id
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isStarted
                          ? "Continue Learning"
                          : "Start Learning"}

                        <ExternalLink className="h-4 w-4" />
                      </button>

                      {!isCompleted && (
                        <>
                          {currentProgress < 50 && (
                            <button
                              onClick={() =>
                                updateProgress(
                                  resource,
                                  50
                                )
                              }
                              disabled={
                                savingId === resource.id
                              }
                              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                            >
                              50%
                            </button>
                          )}

                          {currentProgress < 75 && (
                            <button
                              onClick={() =>
                                updateProgress(
                                  resource,
                                  75
                                )
                              }
                              disabled={
                                savingId === resource.id
                              }
                              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                            >
                              75%
                            </button>
                          )}

                          <button
                            onClick={() =>
                              updateProgress(
                                resource,
                                100
                              )
                            }
                            disabled={
                              savingId === resource.id
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Complete
                          </button>
                        </>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">

            <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              All recommended learning completed
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              You have completed all available learning
              resources for this skill. Continue to the
              next skill or check your personalized roadmap.
            </p>

          </div>
        )}

        {/* NEXT ACTION */}

        {activeSkill &&
          filteredResources.length > 0 && (
            <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Your next learning action
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Focus on{" "}
                    <strong className="text-gray-700">
                      {activeSkill.skill_name}
                    </strong>{" "}
                    and complete one learning resource
                    before moving to the next skill.
                  </p>
                </div>

                <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
                  Close your largest skill gap first
                </div>

              </div>

            </div>
          )}

      </div>
    </main>
  );
}