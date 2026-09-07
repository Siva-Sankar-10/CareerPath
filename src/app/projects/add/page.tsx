"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    FolderKanban,
    GitBranch,
    Globe,
    Save,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function AddProjectPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [technologies, setTechnologies] = useState("");
    const [projectType, setProjectType] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [liveUrl, setLiveUrl] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(
        e: FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            if (!title.trim()) {
                setError("Project title is required.");
                return;
            }

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

            const { error: insertError } =
                await supabase
                    .from("user_showcase_projects")
                    .insert({
                        user_id: user.id,
                        title: title.trim(),
                        description:
                            description.trim() || null,
                        technologies:
                            technologies.trim() || null,
                        project_type:
                            projectType.trim() || null,
                        github_url:
                            githubUrl.trim() || null,
                        live_url:
                            liveUrl.trim() || null,
                    });

            if (insertError) {
                throw insertError;
            }

            router.push("/projects");
        } catch (err: any) {
            console.error(
                "ADD PROJECT ERROR:",
                err
            );

            setError(
                err?.message ||
                "Unable to add project."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f8f9fc] text-slate-900">

            <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">

                {/* BACK */}

                <button
                    onClick={() =>
                        router.push("/projects")
                    }
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
                >
                    <ArrowLeft size={16} />
                    Back to Projects
                </button>

                {/* HEADER */}

                <div className="mb-8">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                            <FolderKanban
                                size={21}
                                className="text-indigo-600"
                            />
                        </div>

                        <div>

                            <p className="text-sm font-medium text-indigo-600">
                                Project Showcase
                            </p>

                            <h1 className="text-3xl font-bold tracking-tight">
                                Add Your Project
                            </h1>

                        </div>

                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        Add a project you have built during
                        college, internships, hackathons, or
                        personal learning.
                    </p>

                </div>

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                >

                    {/* ERROR */}

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* TITLE */}

                    <div>

                        <label className="text-sm font-medium text-slate-700">
                            Project Title
                        </label>

                        <input
                            type="text"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            placeholder="e.g. Network Intrusion Detection System"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        />

                    </div>

                    {/* DESCRIPTION */}

                    <div className="mt-5">

                        <label className="text-sm font-medium text-slate-700">
                            Description
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                            rows={5}
                            placeholder="Explain what your project does..."
                            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        />

                    </div>

                    {/* TECHNOLOGIES */}

                    <div className="mt-5">

                        <label className="text-sm font-medium text-slate-700">
                            Technologies
                        </label>

                        <input
                            type="text"
                            value={technologies}
                            onChange={(e) =>
                                setTechnologies(e.target.value)
                            }
                            placeholder="Python, React, Supabase, Docker"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        />

                        <p className="mt-1 text-xs text-slate-400">
                            Separate technologies with commas.
                        </p>

                    </div>

                    {/* PROJECT TYPE */}

                    <div className="mt-5">

                        <label className="text-sm font-medium text-slate-700">
                            Project Type
                        </label>

                        <select
                            value={projectType}
                            onChange={(e) =>
                                setProjectType(e.target.value)
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        >

                            <option value="">
                                Select project type
                            </option>

                            <option value="Academic Project">
                                Academic Project
                            </option>

                            <option value="Personal Project">
                                Personal Project
                            </option>

                            <option value="Internship Project">
                                Internship Project
                            </option>

                            <option value="Hackathon Project">
                                Hackathon Project
                            </option>

                            <option value="Open Source Project">
                                Open Source Project
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>

                    {/* GITHUB */}

                    <div className="mt-5">

                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">

                            <GitBranch size={16} />

                            GitHub URL

                        </label>

                        <input
                            type="url"
                            value={githubUrl}
                            onChange={(e) =>
                                setGithubUrl(e.target.value)
                            }
                            placeholder="https://github.com/username/project"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        />

                    </div>

                    {/* LIVE DEMO */}

                    <div className="mt-5">

                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">

                            <Globe size={16} />

                            Live Demo URL

                        </label>

                        <input
                            type="url"
                            value={liveUrl}
                            onChange={(e) =>
                                setLiveUrl(e.target.value)
                            }
                            placeholder="https://your-project.vercel.app"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        />

                    </div>

                    {/* SUBMIT */}

                    <button
                        type="submit"
                        disabled={saving}
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        <Save size={17} />

                        {saving
                            ? "Saving Project..."
                            : "Add Project to Showcase"}

                    </button>

                </form>

            </div>

        </main>
    );
}