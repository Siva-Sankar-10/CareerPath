"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

const roleSkills: Record<string, string[]> = {
  "Software Developer": [
    "Programming",
    "Data Structures & Algorithms",
    "Git",
    "Databases",
    "APIs",
  ],

  "Data Scientist": [
    "Python",
    "Statistics",
    "SQL",
    "Machine Learning",
    "Data Visualization",
  ],

  "AI/ML Engineer": [
    "Python",
    "Machine Learning",
    "Deep Learning",
    "Mathematics",
    "MLOps",
  ],

  "Data Analyst": [
    "SQL",
    "Excel",
    "Python",
    "Statistics",
    "Data Visualization",
  ],

  "Cybersecurity Analyst": [
    "Networking",
    "Linux",
    "Python",
    "Security Fundamentals",
    "SIEM",
    "Log Analysis",
    "Threat Detection",
  ],

  "Cloud Engineer": [
    "Linux",
    "Networking",
    "AWS",
    "Cloud Security",
    "Docker",
  ],

  "DevOps Engineer": [
    "Linux",
    "Git",
    "Docker",
    "CI/CD",
    "Cloud",
  ],

  "Network Engineer": [
    "TCP/IP",
    "Routing",
    "Switching",
    "Network Security",
    "Troubleshooting",
  ],

  "Data Engineer": [
    "Python",
    "SQL",
    "ETL",
    "Data Pipelines",
    "Cloud",
  ],

  "UI/UX Designer": [
    "UX Research",
    "Wireframing",
    "Figma",
    "Design Systems",
    "Prototyping",
  ],
};

export default function AssessmentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = searchParams.get("role") || "";

  const skills = roleSkills[role] || [];

  const [levels, setLevels] = useState<Record<string, number>>({});

  const setSkillLevel = (skill: string, level: number) => {
    setLevels((previous) => ({
      ...previous,
      [skill]: level,
    }));
  };

  const handleContinue = () => {
    const incomplete = skills.some(
      (skill) => levels[skill] === undefined
    );

    if (incomplete) {
      alert("Please rate all skills before continuing.");
      return;
    }

    const skillData = encodeURIComponent(JSON.stringify(levels));

    router.push(
      `/skills?role=${encodeURIComponent(role)}&data=${skillData}`
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-4xl">

        <div>
          <p className="text-sm font-medium text-indigo-600">
            Step 2 of your CareerPath
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Assess your current skills
          </h1>

          <p className="mt-3 text-gray-500">
            You selected{" "}
            <span className="font-semibold text-gray-800">
              {role}
            </span>
            . Rate your current knowledge in each skill.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Your current skill level
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Be honest. CareerPath will use this to calculate your skill
              gaps and personalize your roadmap.
            </p>
          </div>

          <div className="space-y-6">
            {skills.map((skill) => {
              const selectedLevel = levels[skill];

              return (
                <div
                  key={skill}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {skill}
                    </h3>

                    <span className="text-sm text-gray-500">
                      {selectedLevel !== undefined
                        ? `${selectedLevel}%`
                        : "Not rated"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {[20, 40, 60, 80, 100].map((level) => (
                      <button
                        key={level}
                        onClick={() =>
                          setSkillLevel(skill, level)
                        }
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          selectedLevel === level
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {level}%
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleContinue}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Calculate Skill Gap →
          </button>
        </div>

      </div>
    </main>
  );
}