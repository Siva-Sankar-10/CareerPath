"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const careers = [
  {
    title: "Software Developer",
    description: "Build applications, APIs and software systems.",
    skills: ["Programming", "DSA", "Git", "Databases"],
  },
  {
    title: "Data Scientist",
    description: "Analyze data and build predictive models.",
    skills: ["Python", "Statistics", "Machine Learning", "SQL"],
  },
  {
    title: "AI/ML Engineer",
    description: "Build and deploy intelligent machine learning systems.",
    skills: ["Python", "ML", "Deep Learning", "MLOps"],
  },
  {
    title: "Data Analyst",
    description: "Turn data into useful insights for decision making.",
    skills: ["SQL", "Excel", "Python", "Visualization"],
  },
  {
    title: "Cybersecurity Analyst",
    description: "Monitor, investigate and respond to security threats.",
    skills: ["Networking", "Linux", "SIEM", "Threat Detection"],
  },
  {
    title: "Cloud Engineer",
    description: "Design, deploy and manage cloud infrastructure.",
    skills: ["Linux", "Networking", "AWS", "Cloud Security"],
  },
  {
    title: "DevOps Engineer",
    description: "Automate software development and infrastructure workflows.",
    skills: ["Linux", "Git", "Docker", "CI/CD"],
  },
  {
    title: "Network Engineer",
    description: "Design, configure and maintain computer networks.",
    skills: ["TCP/IP", "Routing", "Switching", "Security"],
  },
  {
    title: "Data Engineer",
    description: "Build reliable data pipelines and data platforms.",
    skills: ["Python", "SQL", "ETL", "Cloud"],
  },
  {
    title: "UI/UX Designer",
    description: "Design intuitive and engaging digital experiences.",
    skills: ["UX Research", "Wireframing", "Figma", "Design Systems"],
  },
];

export default function CareerPage() {
  const [selectedCareer, setSelectedCareer] = useState("");
  const router = useRouter();

  const handleContinue = () => {
    if (!selectedCareer) return;

    router.push(
      `/assessment?role=${encodeURIComponent(selectedCareer)}`
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">

        <Link
          href="/"
          className="text-sm font-medium text-gray-500 hover:text-indigo-600"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-8 max-w-2xl">
          <p className="text-sm font-medium text-indigo-600">
            Step 1 of your CareerPath
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What career do you want to pursue?
          </h1>

          <p className="mt-3 text-gray-500">
            Choose a target role and CareerPath will build your personalized
            skills, learning and project roadmap.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {careers.map((career) => {
            const selected = selectedCareer === career.title;

            return (
              <button
                key={career.title}
                onClick={() => setSelectedCareer(career.title)}
                className={`rounded-2xl border bg-white p-6 text-left transition ${
                  selected
                    ? "border-indigo-500 ring-2 ring-indigo-100"
                    : "border-gray-200 hover:border-indigo-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-lg font-semibold text-indigo-600">
                    {career.title.charAt(0)}
                  </div>

                  {selected && (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      Selected
                    </span>
                  )}
                </div>

                <h2 className="mt-5 text-lg font-semibold text-gray-900">
                  {career.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {career.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {career.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selectedCareer
              ? `Selected: ${selectedCareer}`
              : "Select a career to continue"}
          </p>

          <button
            disabled={!selectedCareer}
            onClick={handleContinue}
            className={`rounded-xl px-6 py-3 text-sm font-medium transition ${
              selectedCareer
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            Continue →
          </button>
        </div>

      </div>
    </main>
  );
}