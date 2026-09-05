"use client";

import { useState } from "react";
import Link from "next/link";

type Project = {
  name: string;
  description: string;
  difficulty: string;
  duration: string;
  skills: string[];
  progress: number;
  status: "Completed" | "In Progress" | "Not Started" | "Locked";
  recommended: boolean;
};

const projects: Project[] = [
  {
    name: "Security Log Analyzer",
    description:
      "Build a tool that collects, parses, and analyzes security logs to identify suspicious events.",
    difficulty: "Foundation",
    duration: "1–2 weeks",
    skills: ["Python", "Linux", "Log Analysis"],
    progress: 100,
    status: "Completed",
    recommended: false,
  },
  {
    name: "SOC Monitoring Dashboard",
    description:
      "Build a security monitoring dashboard that analyzes logs, detects suspicious activity, and displays security alerts.",
    difficulty: "Intermediate",
    duration: "3–4 weeks",
    skills: ["SIEM", "Log Analysis", "Threat Detection", "Python"],
    progress: 64,
    status: "In Progress",
    recommended: true,
  },
  {
    name: "Network Intrusion Detection System",
    description:
      "Develop a system that monitors network traffic and detects suspicious or malicious activity.",
    difficulty: "Intermediate",
    duration: "3–4 weeks",
    skills: ["Networking", "Python", "IDS", "Threat Detection"],
    progress: 0,
    status: "Not Started",
    recommended: true,
  },
  {
    name: "Threat Detection Platform",
    description:
      "Create an advanced platform for collecting security events, applying detection rules, and investigating threats.",
    difficulty: "Advanced",
    duration: "5–7 weeks",
    skills: [
      "SIEM",
      "Threat Intelligence",
      "Detection Engineering",
      "Incident Response",
    ],
    progress: 0,
    status: "Locked",
    recommended: false,
  },
];

const filters = [
  "All",
  "Completed",
  "In Progress",
  "Not Started",
  "Locked",
];

export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredProjects = projects.filter((project) => {
    if (activeFilter === "All") return true;

    return project.status === activeFilter;
  });

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-8 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-indigo-600">
            CareerPath
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Projects
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Build practical projects that strengthen your skills and create
            portfolio evidence for your target career.
          </p>
        </div>

        {/* Target Career */}
        <section className="mb-8 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Target Career
              </p>

              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Cybersecurity Analyst
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Projects are selected according to your current skill gaps and
                roadmap position.
              </p>
            </div>

            <div className="min-w-[180px]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Portfolio Progress
                </span>

                <span className="text-sm font-semibold text-indigo-600">
                  41%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: "41%" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="mb-7 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Projects */}
        <section className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map((project) => (
            <article
              key={project.name}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {project.name}
                    </h2>

                    {project.recommended && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                        Recommended
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {project.description}
                  </p>
                </div>

                {/* Status */}
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    project.status === "Completed"
                      ? "bg-green-50 text-green-700"
                      : project.status === "In Progress"
                        ? "bg-blue-50 text-blue-700"
                        : project.status === "Locked"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {project.status}
                </span>
              </div>

              {/* Metadata */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Difficulty
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {project.difficulty}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Duration
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {project.duration}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Skills Demonstrated
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Project Progress
                  </span>

                  <span className="text-sm font-semibold text-gray-800">
                    {project.progress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      project.status === "Completed"
                        ? "bg-green-500"
                        : project.status === "In Progress"
                          ? "bg-blue-500"
                          : "bg-indigo-500"
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Action */}
              <div className="mt-6">
                {project.name === "SOC Monitoring Dashboard" ? (
                  <Link
                    href="/projects/soc-monitoring"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
                  >
                    {project.progress > 0
                      ? "Continue Project →"
                      : "Start Project →"}
                  </Link>
                ) : project.status === "Locked" ? (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-400"
                  >
                    Complete Previous Projects
                  </button>
                ) : project.status === "Completed" ? (
                  <button
                    type="button"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    View Project
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100"
                  >
                    Start Project →
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              No projects found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Try selecting a different project status.
            </p>
          </div>
        )}

        {/* Recommended Project */}
        <section className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Recommended Next Project
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                Continue the SOC Monitoring Dashboard
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Your current roadmap shows that Security Operations and SIEM
                are important areas to strengthen. Continuing this project
                will help you practice log analysis, detection rules, and
                security monitoring.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "SIEM",
                  "Log Analysis",
                  "Threat Detection",
                  "Python",
                ].map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0">
              <Link
                href="/projects/soc-monitoring"
                className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                Continue SOC Dashboard →
              </Link>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-center text-xs leading-5 text-gray-500">
            Projects are recommended based on your target role, skill gaps,
            roadmap phase, and current project progress.
          </p>
        </div>
      </div>
    </main>
  );
}