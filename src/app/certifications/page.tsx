"use client";

import { useState } from "react";

const certifications = [
  {
    name: "CompTIA Security+",
    provider: "CompTIA",
    level: "Beginner → Intermediate",
    description:
      "Build a strong foundation in cybersecurity, threats, vulnerabilities, networking and security operations.",
    skills: [
      "Security Fundamentals",
      "Networking",
      "Threats & Vulnerabilities",
      "Security Operations",
    ],
    progress: 35,
    status: "Preparing",
    recommended: true,
  },
  {
    name: "Google Cybersecurity Professional Certificate",
    provider: "Google",
    level: "Beginner",
    description:
      "Develop practical cybersecurity skills including Linux, Python, SIEM and security analysis.",
    skills: [
      "Linux",
      "Python",
      "SIEM",
      "Security Analysis",
    ],
    progress: 72,
    status: "In Progress",
    recommended: true,
  },
  {
    name: "CompTIA CySA+",
    provider: "CompTIA",
    level: "Intermediate",
    description:
      "Focus on threat detection, security analytics, incident response and security operations.",
    skills: [
      "Threat Detection",
      "Incident Response",
      "Security Analytics",
      "SOC",
    ],
    progress: 0,
    status: "Not Started",
    recommended: true,
  },
  {
    name: "Certified Ethical Hacker (CEH)",
    provider: "EC-Council",
    level: "Intermediate",
    description:
      "Learn ethical hacking methodologies, attack techniques and defensive security concepts.",
    skills: [
      "Ethical Hacking",
      "Web Security",
      "Network Security",
      "Penetration Testing",
    ],
    progress: 0,
    status: "Not Started",
    recommended: false,
  },
];

export default function CertificationsPage() {
  const [filter, setFilter] = useState("All");

  const filteredCertifications =
    filter === "Recommended"
      ? certifications.filter((cert) => cert.recommended)
      : filter === "In Progress"
      ? certifications.filter((cert) => cert.progress > 0)
      : certifications;

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-indigo-600">
            CareerPath Certifications
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Certifications
          </h1>

          <p className="mt-3 max-w-2xl text-gray-500">
            Build recognized credentials that strengthen your skills,
            projects and career profile.
          </p>
        </div>

        {/* Target Career */}
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Certifications for
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Cybersecurity Analyst
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                CareerPath selected these certifications based on your target
                role and skill gaps.
              </p>
            </div>

            <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-500">
                Certifications
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                4
              </p>
            </div>

          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-2">

          {["All", "Recommended", "In Progress"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filter === item
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              {item}
            </button>
          ))}

        </div>

        {/* Certification Cards */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {filteredCertifications.map((certification) => (
            <div
              key={certification.name}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >

              {/* Top */}
              <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
                    {certification.provider.charAt(0)}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {certification.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {certification.provider} · {certification.level}
                    </p>
                  </div>

                </div>

                {certification.recommended && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                    Recommended
                  </span>
                )}

              </div>

              {/* Description */}
              <p className="mt-5 text-sm leading-6 text-gray-500">
                {certification.description}
              </p>

              {/* Skills */}
              <div className="mt-5">

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Skills Covered
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {certification.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

              </div>

              {/* Progress */}
              <div className="mt-6">

                <div className="flex items-center justify-between">

                  <span className="text-sm font-medium text-gray-600">
                    Preparation Progress
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {certification.progress}%
                  </span>

                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      certification.progress === 100
                        ? "bg-green-500"
                        : certification.progress > 0
                        ? "bg-indigo-500"
                        : "bg-gray-300"
                    }`}
                    style={{
                      width: `${certification.progress}%`,
                    }}
                  />
                </div>

              </div>

              {/* Bottom */}
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">

                <span
                  className={`text-xs font-medium ${
                    certification.status === "In Progress"
                      ? "text-indigo-600"
                      : certification.status === "Preparing"
                      ? "text-amber-600"
                      : "text-gray-500"
                  }`}
                >
                  {certification.status}
                </span>

                <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
                  {certification.progress > 0
                    ? "Continue Preparation →"
                    : "Start Preparation →"}
                </button>

              </div>

            </div>
          ))}

        </div>

        {/* Recommendation */}
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">

          <p className="text-sm font-medium text-indigo-600">
            CareerPath Recommendation
          </p>

          <h2 className="mt-2 text-xl font-bold text-gray-900">
            Your next certification
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Focus on CompTIA Security+ after completing your current
            Security Fundamentals learning phase. It aligns with several
            skills in your current roadmap.
          </p>

          <button className="mt-5 rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600">
            View Certification Roadmap →
          </button>

        </div>

      </div>
    </main>
  );
}
