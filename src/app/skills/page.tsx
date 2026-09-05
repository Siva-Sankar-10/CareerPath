"use client";

import { useSearchParams, useRouter } from "next/navigation";

const requiredLevels: Record<string, number> = {
  Programming: 80,
  "Data Structures & Algorithms": 75,
  Git: 70,
  Databases: 75,
  APIs: 70,

  Python: 80,
  Statistics: 75,
  SQL: 80,
  "Machine Learning": 80,
  "Data Visualization": 70,

  "Deep Learning": 75,
  Mathematics: 70,
  MLOps: 65,

  Excel: 70,

  Networking: 80,
  Linux: 75,
  "Security Fundamentals": 80,
  SIEM: 75,
  "Log Analysis": 75,
  "Threat Detection": 80,

  AWS: 75,
  "Cloud Security": 70,
  Docker: 70,

  "CI/CD": 75,
  Cloud: 75,

  "TCP/IP": 85,
  Routing: 80,
  Switching: 80,
  "Network Security": 75,
  Troubleshooting: 80,

  ETL: 75,
  "Data Pipelines": 75,

  "UX Research": 75,
  Wireframing: 80,
  Figma: 80,
  "Design Systems": 70,
  Prototyping: 75,
};

export default function SkillsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = searchParams.get("role") || "Unknown Role";
  const data = searchParams.get("data");

  let userSkills: Record<string, number> = {};

  try {
    if (data) {
      userSkills = JSON.parse(data);
    }
  } catch {
    userSkills = {};
  }

  const skills = Object.keys(userSkills);

  const skillData = skills.map((skill) => {
    const current = userSkills[skill] || 0;
    const required = requiredLevels[skill] || 75;
    const gap = Math.max(required - current, 0);

    let priority = "Low";

    if (gap >= 25) {
      priority = "High";
    } else if (gap >= 10) {
      priority = "Medium";
    }

    return {
      skill,
      current,
      required,
      gap,
      priority,
    };
  });

  const highPriority = skillData.filter(
    (skill) => skill.priority === "High"
  ).length;

  const mediumPriority = skillData.filter(
    (skill) => skill.priority === "Medium"
  ).length;

  const averageGap =
    skillData.length > 0
      ? Math.round(
          skillData.reduce((total, skill) => total + skill.gap, 0) /
            skillData.length
        )
      : 0;

  const prioritySkills = [...skillData]
    .filter((skill) => skill.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  const handleContinue = () => {
    router.push(`/roadmap?role=${encodeURIComponent(role)}`);
  };

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-indigo-600">
            Step 3 of your CareerPath
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Your Skill Gap
          </h1>

          <p className="mt-3 text-gray-500">
            We compared your current skills with the recommended
            proficiency for a{" "}
            <span className="font-semibold text-gray-800">
              {role}
            </span>
            .
          </p>
        </div>

        {/* Summary Cards */}
        <section className="mt-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              High Priority
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {highPriority}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Skills needing immediate attention
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Medium Priority
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {mediumPriority}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Skills to improve next
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Average Skill Gap
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {averageGap}%
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Across your assessed skills
            </p>
          </div>

        </section>

        {/* Skill Analysis */}
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-7">
            <h2 className="text-lg font-semibold text-gray-900">
              Skill Analysis
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your current proficiency compared with the target level.
            </p>
          </div>

          <div className="space-y-7">

            {skillData.map((item) => (

              <div key={item.skill}>

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {item.skill}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Current {item.current}% · Target {item.required}%
                    </p>
                  </div>

                  <div className="text-right">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.priority === "High"
                          ? "bg-red-50 text-red-600"
                          : item.priority === "Medium"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {item.priority}
                    </span>

                    <p className="mt-2 text-xs text-gray-400">
                      Gap {item.gap}%
                    </p>

                  </div>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                      width: `${Math.min(item.current, 100)}%`,
                    }}
                  />
                </div>

              </div>

            ))}

          </div>

        </section>

        {/* Recommended Focus */}
        <section className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">

          <p className="text-sm font-medium text-indigo-600">
            Recommended Focus
          </p>

          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            Start with these skills
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            These are currently your largest skill gaps. CareerPath
            will prioritize them when building your learning roadmap.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">

            {prioritySkills.length > 0 ? (
              prioritySkills.map((skill) => (
                <div
                  key={skill.skill}
                  className="rounded-xl border border-indigo-100 bg-white p-4"
                >
                  <p className="font-medium text-gray-900">
                    {skill.skill}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {skill.gap}% gap
                  </p>

                  <div className="mt-3 h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.min(skill.gap, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No major skill gaps found.
              </p>
            )}

          </div>

        </section>

        {/* Continue */}
        <div className="mt-8 flex justify-end">

          <button
            onClick={handleContinue}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Build My Roadmap →
          </button>

        </div>

      </div>
    </main>
  );
}