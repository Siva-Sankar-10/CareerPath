"use client";

import { useState } from "react";
import Link from "next/link";

const phases = [
  {
    id: 1,
    title: "Foundations",
    subtitle: "Build your technical foundation",
    progress: 100,
    status: "Completed",
    skills: ["Networking", "Linux", "Python"],
    description:
      "Build the core technical knowledge required before moving into cybersecurity specialization.",
    color: "green",
  },
  {
    id: 2,
    title: "Security Fundamentals",
    subtitle: "Understand core security concepts",
    progress: 72,
    status: "Current",
    skills: ["Security Fundamentals", "Web Security"],
    description:
      "Learn the fundamental concepts of cybersecurity, common attacks, vulnerabilities, and security controls.",
    color: "blue",
  },
  {
    id: 3,
    title: "Security Operations",
    subtitle: "Learn to detect and investigate threats",
    progress: 35,
    status: "Upcoming",
    skills: ["SIEM", "Log Analysis", "Threat Detection"],
    description:
      "Develop practical SOC skills by learning SIEM, security monitoring, log analysis, and threat detection.",
    color: "indigo",
  },
  {
    id: 4,
    title: "Advanced Security",
    subtitle: "Develop advanced security capabilities",
    progress: 0,
    status: "Locked",
    skills: ["Incident Response", "Threat Intelligence", "Digital Forensics"],
    description:
      "Move into advanced security concepts after completing the previous roadmap phases.",
    color: "gray",
  },
  {
    id: 5,
    title: "Portfolio & Job Preparation",
    subtitle: "Prepare for cybersecurity roles",
    progress: 0,
    status: "Locked",
    skills: ["Projects", "Certifications", "Interview Preparation"],
    description:
      "Build portfolio projects, complete relevant certifications, and prepare for job applications and interviews.",
    color: "gray",
  },
];

export default function RoadmapPage() {
  const [selectedPhase, setSelectedPhase] = useState(2);

  const selected = phases.find((phase) => phase.id === selectedPhase);

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
                Cybersecurity Analyst
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your roadmap is organized according to the skills required
                for your target role.
              </p>
            </div>

            <div className="w-full md:w-64">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Overall Progress
                </span>

                <span className="text-sm font-semibold text-indigo-600">
                  48%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: "48%" }}
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
              Complete each phase to unlock the next stage of your journey.
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
                        : phase.id}
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
                            Progress
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
                  Phase {selected.id}
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                  {selected.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {selected.description}
                </p>

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
              </div>

              {/* Action */}
              <div className="shrink-0">
                {selected.id === 3 ? (
                  <Link
                    href="/learning"
                    className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Continue Learning →
                  </Link>
                ) : selected.status === "Locked" ? (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-xl bg-gray-100 px-5 py-3 text-sm font-medium text-gray-400"
                  >
                    Locked
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    View Phase
                  </button>
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
            Strengthen your Security Operations skills
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            SIEM and log analysis are important gaps for your target
            Cybersecurity Analyst role. Continue learning these skills and
            apply them through your SOC Monitoring Dashboard project.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/learning"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Go to Learning →
            </Link>

            <Link
              href="/projects/soc-monitoring"
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Open Project →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}