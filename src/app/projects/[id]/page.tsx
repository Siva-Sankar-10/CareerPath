"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Clock3,
    GitBranch,
    Target,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Project = {
    id: number;
    title: string;
    description: string | null;
    difficulty: string | null;
    estimated_hours: number | null;
    project_type: string | null;
    objective: string | null;
    prerequisites: string | null;
    tools: string | null;
    github_required: boolean | null;
};

type Phase = {
    id: number;
    project_id: number;
    phase_number: number;
    title: string;
    description: string | null;
    estimated_hours: number | null;
};

type Task = {
    id: number;
    phase_id: number;
    title: string;
    description: string | null;
    task_order: number;
    estimated_hours: number | null;
    estimated_minutes: number | null;
};

export default function ProjectRoadmapPage() {
    const params = useParams();
    const router = useRouter();

    const projectId = Number(params.id);

    const [project, setProject] =
        useState<Project | null>(null);

    const [phases, setPhases] =
        useState<Phase[]>([]);

    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [taskProgress, setTaskProgress] =
        useState<Record<number, boolean>>({});

    const [selectedPhase, setSelectedPhase] =
        useState<number | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [savingTask, setSavingTask] =
        useState<number | null>(null);

    const [error, setError] =
        useState("");

    // ----------------------------------------
    // LOAD
    // ----------------------------------------

    useEffect(() => {
        async function loadProject() {
            try {
                setLoading(true);
                setError("");

                const supabase = createClient();

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) {
                    throw userError;
                }

                if (!user) {
                    router.push("/login");
                    return;
                }

                if (
                    !projectId ||
                    Number.isNaN(projectId)
                ) {
                    throw new Error(
                        "Invalid project ID."
                    );
                }

                // ------------------------------------
                // PROJECT
                // ------------------------------------

                const {
                    data: projectData,
                    error: projectError,
                } = await supabase
                    .from("career_projects")
                    .select(`
            id,
            title,
            description,
            difficulty,
            estimated_hours,
            project_type,
            objective,
            prerequisites,
            tools,
            github_required
          `)
                    .eq("id", projectId)
                    .maybeSingle();

                if (projectError) {
                    throw projectError;
                }

                if (!projectData) {
                    throw new Error(
                        `Project ${projectId} was not found.`
                    );
                }

                setProject(projectData);

                // ------------------------------------
                // PHASES
                // ------------------------------------

                const {
                    data: phaseData,
                    error: phaseError,
                } = await supabase
                    .from("project_phases")
                    .select(`
            id,
            project_id,
            phase_number,
            title,
            description,
            estimated_hours
          `)
                    .eq("project_id", projectId)
                    .order("phase_number", {
                        ascending: true,
                    });

                if (phaseError) {
                    throw phaseError;
                }

                const loadedPhases =
                    (phaseData ?? []) as Phase[];

                setPhases(loadedPhases);

                if (loadedPhases.length > 0) {
                    setSelectedPhase(
                        loadedPhases[0].id
                    );
                }

                // ------------------------------------
                // TASKS
                // ------------------------------------

                const phaseIds =
                    loadedPhases.map(
                        (phase) => phase.id
                    );

                let loadedTasks: Task[] = [];

                if (phaseIds.length > 0) {
                    const {
                        data: taskData,
                        error: taskError,
                    } = await supabase
                        .from("project_tasks")
                        .select(`
              id,
              phase_id,
              title,
              description,
              task_order,
              estimated_hours,
              estimated_minutes
            `)
                        .in("phase_id", phaseIds)
                        .order("task_order", {
                            ascending: true,
                        });

                    if (taskError) {
                        throw taskError;
                    }

                    loadedTasks =
                        (taskData ?? []) as Task[];
                }

                setTasks(loadedTasks);

                // ------------------------------------
                // TASK PROGRESS
                // ------------------------------------

                const taskIds =
                    loadedTasks.map(
                        (task) => task.id
                    );

                if (taskIds.length > 0) {
                    const {
                        data: progressData,
                        error: progressError,
                    } = await supabase
                        .from(
                            "user_project_task_progress"
                        )
                        .select(`
              task_id,
              completed
            `)
                        .eq("user_id", user.id)
                        .in("task_id", taskIds);

                    if (progressError) {
                        throw progressError;
                    }

                    const progressMap: Record<
                        number,
                        boolean
                    > = {};

                    (
                        progressData ?? []
                    ).forEach((item: any) => {
                        progressMap[item.task_id] =
                            item.completed;
                    });

                    setTaskProgress(progressMap);
                }
            } catch (err: any) {
                console.error(
                    "PROJECT ROADMAP ERROR:",
                    JSON.stringify(
                        {
                            message: err?.message,
                            details: err?.details,
                            hint: err?.hint,
                            code: err?.code,
                        },
                        null,
                        2
                    )
                );

                setError(
                    err?.message ||
                    "Unable to load project roadmap."
                );
            } finally {
                setLoading(false);
            }
        }

        loadProject();
    }, [projectId, router]);

    // ----------------------------------------
    // CALCULATIONS
    // ----------------------------------------

    const completedTasks =
        tasks.filter(
            (task) =>
                taskProgress[task.id] === true
        ).length;

    const totalTasks = tasks.length;

    const overallProgress =
        totalTasks === 0
            ? 0
            : Math.round(
                (completedTasks / totalTasks) *
                100
            );

    const selectedPhaseData =
        phases.find(
            (phase) =>
                phase.id === selectedPhase
        );

    const selectedPhaseTasks =
        tasks.filter(
            (task) =>
                task.phase_id === selectedPhase
        );

    const phaseProgress = useMemo(() => {
        const result: Record<
            number,
            number
        > = {};

        phases.forEach((phase) => {
            const phaseTasks =
                tasks.filter(
                    (task) =>
                        task.phase_id === phase.id
                );

            const completed =
                phaseTasks.filter(
                    (task) =>
                        taskProgress[task.id] === true
                ).length;

            result[phase.id] =
                phaseTasks.length === 0
                    ? 0
                    : Math.round(
                        (completed /
                            phaseTasks.length) *
                        100
                    );
        });

        return result;
    }, [
        phases,
        tasks,
        taskProgress,
    ]);

    const nextTask = tasks.find(
        (task) =>
            taskProgress[task.id] !== true
    );

    // ----------------------------------------
    // TOGGLE TASK
    // ----------------------------------------

    async function toggleTask(
        task: Task
    ) {
        try {
            const supabase = createClient();

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const completed =
                taskProgress[task.id] !== true;

            setSavingTask(task.id);

            const now =
                new Date().toISOString();

            const { error: saveError } =
                await supabase
                    .from(
                        "user_project_task_progress"
                    )
                    .upsert(
                        {
                            user_id: user.id,
                            task_id: task.id,
                            completed,
                            completed_at: completed
                                ? now
                                : null,
                            updated_at: now,
                        },
                        {
                            onConflict:
                                "user_id,task_id",
                        }
                    );

            if (saveError) {
                throw saveError;
            }

            setTaskProgress(
                (previous) => ({
                    ...previous,
                    [task.id]: completed,
                })
            );

            // ------------------------------------
            // UPDATE PROJECT PROGRESS
            // ------------------------------------

            const newCompletedCount =
                tasks.filter((item) => {
                    if (item.id === task.id) {
                        return completed;
                    }

                    return (
                        taskProgress[item.id] === true
                    );
                }).length;

            const newProgress =
                tasks.length === 0
                    ? 0
                    : Math.round(
                        (newCompletedCount /
                            tasks.length) *
                        100
                    );

            await supabase
                .from("user_project_progress")
                .upsert(
                    {
                        user_id: user.id,
                        project_id: projectId,
                        progress: newProgress,
                        completed:
                            newProgress === 100,
                        started_at:
                            newProgress > 0
                                ? now
                                : null,
                        completed_at:
                            newProgress === 100
                                ? now
                                : null,
                        updated_at: now,
                    },
                    {
                        onConflict:
                            "user_id,project_id",
                    }
                );
        } catch (err: any) {
            console.error(
                "TASK UPDATE ERROR:",
                err
            );

            alert(
                err?.message ||
                "Unable to update task."
            );
        } finally {
            setSavingTask(null);
        }
    }

    // ----------------------------------------
    // LOADING
    // ----------------------------------------

    if (loading) {
        return (
            <main className="min-h-screen bg-[#f8f9fc] p-8">
                <div className="mx-auto max-w-7xl">

                    <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

                    <div className="mt-8 h-40 animate-pulse rounded-2xl bg-slate-200" />

                    <div className="mt-6 h-96 animate-pulse rounded-2xl bg-slate-200" />

                </div>
            </main>
        );
    }

    // ----------------------------------------
    // ERROR
    // ----------------------------------------

    if (error) {
        return (
            <main className="min-h-screen bg-[#f8f9fc] p-8">

                <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8">

                    <h1 className="text-xl font-semibold">
                        Unable to load project
                    </h1>

                    <p className="mt-3 text-sm text-red-600">
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            router.push("/projects")
                        }
                        className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Back to Projects
                    </button>

                </div>

            </main>
        );
    }

    if (!project) {
        return null;
    }

    // ----------------------------------------
    // UI
    // ----------------------------------------

    return (
        <main className="min-h-screen bg-[#f8f9fc] text-slate-900">

            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

                {/* BACK */}

                <button
                    onClick={() =>
                        router.push("/projects")
                    }
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
                >
                    <ArrowLeft size={17} />
                    Back to Projects
                </button>

                {/* HEADER */}

                <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

                    <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">

                        <div className="max-w-3xl">

                            <div className="mb-4 flex flex-wrap items-center gap-3">

                                {project.difficulty && (
                                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                                        {project.difficulty}
                                    </span>
                                )}

                                {project.project_type && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                        {project.project_type}
                                    </span>
                                )}

                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Clock3 size={14} />
                                    {project.estimated_hours ?? 0} hours
                                </span>

                            </div>

                            <h1 className="text-3xl font-bold">
                                {project.title}
                            </h1>

                            <p className="mt-3 text-base leading-7 text-slate-600">
                                {project.description}
                            </p>

                        </div>

                        <div className="min-w-[190px] rounded-2xl bg-slate-50 p-5">

                            <p className="text-xs text-slate-500">
                                Project Progress
                            </p>

                            <p className="mt-1 text-3xl font-bold text-indigo-600">
                                {overallProgress}%
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {completedTasks} of{" "}
                                {totalTasks} tasks completed
                            </p>

                        </div>

                    </div>

                    <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                            style={{
                                width: `${overallProgress}%`,
                            }}
                        />

                    </div>

                </section>

                {/* INFO */}

                <section className="mt-6 grid gap-6 lg:grid-cols-3">

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">

                        <div className="flex items-center gap-3">

                            <Target
                                size={19}
                                className="text-indigo-600"
                            />

                            <h2 className="font-semibold">
                                Objective
                            </h2>

                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            {project.objective ||
                                "Complete the project according to the roadmap."}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">

                        <h2 className="font-semibold">
                            Prerequisites
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            {project.prerequisites ||
                                "No prerequisites specified."}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">

                        <h2 className="font-semibold">
                            Tools
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            {project.tools ||
                                "Tools will be specified in the roadmap."}
                        </p>

                    </div>

                </section>

                {/* NEXT TASK */}

                {nextTask && (

                    <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">

                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                            Recommended Next Task
                        </p>

                        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <h2 className="font-semibold">
                                    {nextTask.title}
                                </h2>

                                <p className="mt-1 text-sm text-slate-600">
                                    {nextTask.description}
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setSelectedPhase(
                                        nextTask.phase_id
                                    )
                                }
                                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Go to Task
                            </button>

                        </div>

                    </section>

                )}

                {/* ROADMAP */}

                <section className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">

                    {/* PHASES */}

                    <aside className="rounded-2xl border border-slate-200 bg-white p-4">

                        <div className="px-3 pb-4">

                            <h2 className="font-semibold">
                                Project Roadmap
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                {phases.length} phases ·{" "}
                                {tasks.length} tasks
                            </p>

                        </div>

                        <div className="space-y-2">

                            {phases.map((phase) => {

                                const progress =
                                    phaseProgress[phase.id] ??
                                    0;

                                const selected =
                                    selectedPhase ===
                                    phase.id;

                                return (

                                    <button
                                        key={phase.id}
                                        onClick={() =>
                                            setSelectedPhase(
                                                phase.id
                                            )
                                        }
                                        className={`w-full rounded-xl border p-4 text-left transition ${selected
                                                ? "border-indigo-200 bg-indigo-50"
                                                : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                                            }`}
                                    >

                                        <div className="flex gap-3">

                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${progress === 100
                                                        ? "bg-green-100 text-green-700"
                                                        : selected
                                                            ? "bg-indigo-100 text-indigo-700"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                            >

                                                {progress === 100 ? (
                                                    <CheckCircle2
                                                        size={17}
                                                    />
                                                ) : (
                                                    phase.phase_number
                                                )}

                                            </div>

                                            <div className="min-w-0 flex-1">

                                                <p className="text-sm font-semibold">
                                                    {phase.title}
                                                </p>

                                                <div className="mt-2 flex justify-between">

                                                    <span className="text-xs text-slate-500">
                                                        {progress}% complete
                                                    </span>

                                                    <span className="text-xs text-slate-400">
                                                        {phase.estimated_hours ?? 0}h
                                                    </span>

                                                </div>

                                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">

                                                    <div
                                                        className="h-full rounded-full bg-indigo-500 transition-all"
                                                        style={{
                                                            width: `${progress}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    </button>

                                );
                            })}

                        </div>

                    </aside>

                    {/* TASKS */}

                    <div className="rounded-2xl border border-slate-200 bg-white">

                        {selectedPhaseData && (

                            <>

                                <div className="border-b border-slate-200 p-6">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                        Phase{" "}
                                        {selectedPhaseData.phase_number}
                                    </p>

                                    <h2 className="mt-1 text-2xl font-bold">
                                        {selectedPhaseData.title}
                                    </h2>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                        {selectedPhaseData.description}
                                    </p>

                                </div>

                                <div className="divide-y divide-slate-100">

                                    {selectedPhaseTasks.map(
                                        (task, index) => {

                                            const completed =
                                                taskProgress[
                                                task.id
                                                ] === true;

                                            const saving =
                                                savingTask ===
                                                task.id;

                                            return (

                                                <div
                                                    key={task.id}
                                                    className={`p-5 ${completed
                                                            ? "bg-slate-50/70"
                                                            : "bg-white"
                                                        }`}
                                                >

                                                    <div className="flex gap-4">

                                                        <button
                                                            onClick={() =>
                                                                toggleTask(
                                                                    task
                                                                )
                                                            }
                                                            disabled={saving}
                                                            className="mt-0.5 shrink-0"
                                                        >

                                                            {completed ? (

                                                                <CheckCircle2
                                                                    size={23}
                                                                    className="text-green-600"
                                                                />

                                                            ) : (

                                                                <Circle
                                                                    size={23}
                                                                    className="text-slate-300 hover:text-indigo-500"
                                                                />

                                                            )}

                                                        </button>

                                                        <div className="min-w-0 flex-1">

                                                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">

                                                                <div>

                                                                    <p className="text-xs text-slate-400">
                                                                        Task{" "}
                                                                        {index + 1}
                                                                    </p>

                                                                    <h3
                                                                        className={`font-semibold ${completed
                                                                                ? "text-slate-500 line-through"
                                                                                : "text-slate-900"
                                                                            }`}
                                                                    >
                                                                        {task.title}
                                                                    </h3>

                                                                </div>

                                                                <div className="flex items-center gap-1 text-xs text-slate-400">

                                                                    <Clock3
                                                                        size={13}
                                                                    />

                                                                    {task.estimated_minutes
                                                                        ? `${task.estimated_minutes} min`
                                                                        : `${task.estimated_hours ?? 0} hr`}

                                                                </div>

                                                            </div>

                                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                                {task.description}
                                                            </p>

                                                            {saving && (
                                                                <p className="mt-2 text-xs text-indigo-500">
                                                                    Saving...
                                                                </p>
                                                            )}

                                                        </div>

                                                    </div>

                                                </div>

                                            );
                                        }
                                    )}

                                </div>

                            </>

                        )}

                    </div>

                </section>

                {/* COMPLETED */}

                {overallProgress === 100 && (

                    <section className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">

                        <div className="flex gap-4">

                            <CheckCircle2
                                size={25}
                                className="text-green-600"
                            />

                            <div>

                                <h2 className="font-semibold text-green-800">
                                    Project completed
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-green-700">
                                    You have completed all
                                    project tasks. Make sure your
                                    documentation and GitHub
                                    repository are ready.
                                </p>

                                {project.github_required && (

                                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700">

                                        <GitBranch size={16} />

                                        GitHub repository required

                                    </div>

                                )}

                            </div>

                        </div>

                    </section>

                )}

            </div>

        </main>
    );
}