"use client";

import Link from "next/link";

const skillProgress = [
  {
    name: "Networking",
    current: 90,
    required: 85,
    status: "Strong",
  },
  {
    name: "Linux",
    current: 75,
    required: 80,
    status: "Almost Ready",
  },
  {
    name: "Python",
    current: 65,
    required: 80,
    status: "Needs Improvement",
  },
  {
    name: "Security Fundamentals",
    current: 72,
    required: 85,
    status: "Needs Improvement",
  },
  {
    name: "SIEM",
    current: 42,
    required: 80,
    status: "Priority",
  },
  {
    name: "Threat Detection",
    current: 25,
    required: 75,
    status: "Priority",
  },
];

const learningStats = [
  {
    label: "Courses Completed",
    value: "5 / 8",
    description: "3 courses remaining",
  },
  {
    label: "Learning Hours",
    value: "34h",
    description: "This learning path",
  },
  {
    label: "Tasks Completed",
    value: "42 / 60",
    description: "18 tasks remaining",
  },
];

const projectStats = [
  {
    name: "Security Log Analyzer",
    progress: 100,
    status: "Completed",
  },
  {
    name: "SOC Monitoring Dashboard",
    progress: 64,
    status: "In Progress",
  },
  {
    name: "Network Intrusion Detection System",
    progress: 0,
    status: "Not Started",
  },
];

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">

        {/* Header */}
        <div className="mb-8">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Progress
          </span>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            Track your journey
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            See your skill development, learning progress, projects and
            overall job-readiness in one place.
          </p>
        </div>

        {/* Overall progress */}
        <div className="mb-6 grid gap-5 lg:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Target Role
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  Cybersecurity Analyst
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Overall progress toward your target career.
                </p>
              </div>

              <div className="text-right">
                <p className="text-4xl font-bold text-indigo-600">
                  68%
                </p>

                <p className="text-xs font-medium text-gray-500">
                  Job Readiness
                </p>
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-2 flex justify-between">
                <span className="text-xs font-medium text-gray-500">
                  Overall completion
                </span>

                <span className="text-xs font-semibold text-gray-800">
                  68%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: "68%" }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
              <div>
                <p className="text-xs text-gray-400">
                  Skills
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  68%
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Learning
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  58%
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Projects
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  41%
                </p>
              </div>
            </div>
          </div>

          {/* Current focus */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Current Focus
            </p>

            <h2 className="mt-2 text-xl font-bold text-gray-900">
              SIEM Fundamentals
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              You are currently working on Security Operations.
              Complete this skill before moving to the next major phase.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-gray-500">
                  Progress
                </span>

                <span className="font-semibold text-indigo-700">
                  42%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: "42%" }}
                />
              </div>
            </div>

            <Link
              href="/learning"
              className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Continue Learning →
            </Link>
          </div>
        </div>

        {/* Learning stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {learningStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">
                {stat.label}
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Skill Progress
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current proficiency compared with the level required for
                your target role.
              </p>
            </div>

            <Link
              href="/skills"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View Skills →
            </Link>
          </div>

          <div className="space-y-6">
            {skillProgress.map((skill) => (
              <div key={skill.name}>

                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      {skill.name}
                    </span>

                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        skill.status === "Strong"
                          ? "bg-green-50 text-green-700"
                          : skill.status === "Priority"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-indigo-50 text-indigo-700"
                      }`}
                    >
                      {skill.status}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-gray-600">
                    {skill.current}% / {skill.required}%
                  </span>
                </div>

                <div className="relative h-2.5 overflow-hidden rounded-full bg-gray-100">
                  {/* Required level marker */}
                  <div
                    className="absolute top-0 z-10 h-full w-0.5 bg-gray-400"
                    style={{ left: `${skill.required}%` }}
                  />

                  <div
                    className={`h-full rounded-full ${
                      skill.current >= skill.required
                        ? "bg-green-500"
                        : skill.status === "Priority"
                        ? "bg-amber-500"
                        : "bg-indigo-600"
                    }`}
                    style={{ width: `${skill.current}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-5 border-t border-gray-100 pt-5 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
              Current Level
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-0.5 bg-gray-400" />
              Required Level
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Project Progress
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Build projects to turn your learning into practical evidence.
              </p>
            </div>

            <Link
              href="/projects"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View Projects →
            </Link>
          </div>

          <div className="space-y-5">
            {projectStats.map((project) => (
              <div
                key={project.name}
                className="rounded-xl border border-gray-100 bg-gray-50/70 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {project.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {project.status}
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-800">
                    {project.progress}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${
                      project.progress === 100
                        ? "bg-green-500"
                        : project.progress === 0
                        ? "bg-gray-300"
                        : "bg-indigo-600"
                    }`}
                    style={{
                      width: `${project.progress}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom action */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Keep moving forward
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your biggest current gap is Threat Detection. Focus on this
                after completing SIEM Fundamentals.
              </p>
            </div>

            <Link
              href="/roadmap"
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Open Roadmap
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}