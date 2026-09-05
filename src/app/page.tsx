import Sidebar from "./components/Sidebar";

const skills = [
  { name: "Networking", progress: 90 },
  { name: "Linux", progress: 75 },
  { name: "Python", progress: 65 },
  { name: "SIEM", progress: 42 },
];

const tasks = [
  {
    title: "Complete SIEM Fundamentals",
    type: "Learning",
    time: "45 min",
    completed: true,
  },
  {
    title: "Analyze Security Logs",
    type: "Practice",
    time: "30 min",
    completed: false,
  },
  {
    title: "Linux Security Exercise",
    type: "Skill",
    time: "30 min",
    completed: false,
  },
];

const roadmap = [
  {
    phase: "Foundations",
    progress: 100,
    status: "Completed",
  },
  {
    phase: "Security Fundamentals",
    progress: 82,
    status: "In Progress",
  },
  {
    phase: "Security Operations",
    progress: 38,
    status: "In Progress",
  },
  {
    phase: "Advanced Security",
    progress: 0,
    status: "Upcoming",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#f8f9fc]">
      <Sidebar />

      <main className="min-h-screen w-full px-6 py-6 sm:px-8 lg:px-10">

        {/* ================= HEADER ================= */}
        <header className="mb-8 flex items-center justify-between">

          <div>
            <p className="text-sm font-medium text-indigo-600">
              Good morning 👋
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Here&apos;s your current career progress and what you should
              focus on next.
            </p>
          </div>

          {/* Profile */}
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            SS
          </div>

        </header>

        {/* ================= OVERVIEW ================= */}
        <section className="grid gap-5 md:grid-cols-3">

          {/* Target Role */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">

            <p className="text-sm font-medium text-gray-500">
              Target Role
            </p>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              Cybersecurity Analyst
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your selected career direction
            </p>

            <div className="mt-5">
              <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Career Goal
              </span>
            </div>

          </div>

          {/* Job Readiness */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-gray-500">
                Job Readiness
              </p>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                Good
              </span>

            </div>

            <div className="mt-3 flex items-baseline gap-2">

              <span className="text-3xl font-bold text-gray-900">
                68%
              </span>

              <span className="text-sm text-gray-500">
                complete
              </span>

            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">

              <div
                className="h-full rounded-full bg-indigo-600"
                style={{ width: "68%" }}
              />

            </div>

            <p className="mt-3 text-xs text-gray-500">
              +6% from your previous progress
            </p>

          </div>

          {/* Current Focus */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">

            <p className="text-sm font-medium text-gray-500">
              Current Focus
            </p>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              SIEM Fundamentals
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              One of your highest-priority skill gaps
            </p>

            <div className="mt-5">

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Skill progress
                </span>

                <span className="font-medium text-gray-700">
                  42%
                </span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: "42%" }}
                />
              </div>

            </div>

          </div>

        </section>

        {/* ================= MAIN CONTENT ================= */}
        <section className="mt-6 grid gap-6 xl:grid-cols-3">

          {/* ================= TODAY'S TASKS ================= */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Today&apos;s Tasks
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Stay consistent by completing your daily priorities.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                1 / 3 completed
              </span>

            </div>

            <div className="mt-6 space-y-3">

              {tasks.map((task) => (
                <div
                  key={task.title}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition hover:border-indigo-100 hover:bg-gray-50"
                >

                  <input
                    type="checkbox"
                    defaultChecked={task.completed}
                    className="h-4 w-4 accent-indigo-600"
                  />

                  <div className="min-w-0 flex-1">

                    <p
                      className={`font-medium ${
                        task.completed
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {task.type} • {task.time}
                    </p>

                  </div>

                  <span
                    className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${
                      task.type === "Learning"
                        ? "bg-blue-50 text-blue-700"
                        : task.type === "Practice"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {task.type}
                  </span>

                </div>
              ))}

            </div>

            <button className="mt-5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all tasks →
            </button>

          </div>

          {/* ================= RECOMMENDED NEXT STEP ================= */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg">
              →
            </div>

            <p className="mt-5 text-sm font-medium text-indigo-600">
              Recommended Next Step
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              Complete SIEM Fundamentals
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              SIEM is currently one of your largest skill gaps for the
              Cybersecurity Analyst role.
            </p>

            <div className="mt-5 rounded-xl bg-white/70 p-4">

              <p className="text-xs font-medium text-gray-500">
                Why this matters
              </p>

              <p className="mt-1 text-sm text-gray-700">
                Improving this skill will increase your Security Operations
                readiness.
              </p>

            </div>

            <button className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700">
              Continue Learning
            </button>

          </div>

        </section>

        {/* ================= LOWER CONTENT ================= */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* ================= SKILLS ================= */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Skill Overview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your current skill levels for the selected role.
                </p>
              </div>

              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View all
              </button>

            </div>

            <div className="mt-6 space-y-5">

              {skills.map((skill) => (
                <div key={skill.name}>

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-sm font-medium text-gray-700">
                      {skill.name}
                    </span>

                    <span className="text-sm font-medium text-gray-500">
                      {skill.progress}%
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                    <div
                      className={`h-full rounded-full ${
                        skill.progress >= 80
                          ? "bg-green-500"
                          : skill.progress >= 60
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${skill.progress}%` }}
                    />

                  </div>

                </div>
              ))}

            </div>

          </div>

          {/* ================= ROADMAP ================= */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Career Roadmap
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your journey toward becoming job-ready.
                </p>
              </div>

              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Open roadmap
              </button>

            </div>

            <div className="mt-6 space-y-5">

              {roadmap.map((phase, index) => (
                <div key={phase.phase} className="flex gap-4">

                  {/* Timeline */}
                  <div className="flex flex-col items-center">

                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                        phase.progress === 100
                          ? "bg-green-100 text-green-700"
                          : phase.progress > 0
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {index !== roadmap.length - 1 && (
                      <div className="mt-2 h-full min-h-6 w-px bg-gray-200" />
                    )}

                  </div>

                  {/* Phase */}
                  <div className="flex-1 pb-2">

                    <div className="flex items-center justify-between">

                      <p className="text-sm font-medium text-gray-900">
                        {phase.phase}
                      </p>

                      <span className="text-xs text-gray-500">
                        {phase.progress}%
                      </span>

                    </div>

                    <div className="mt-2 h-1.5 rounded-full bg-gray-100">

                      <div
                        className={`h-full rounded-full ${
                          phase.progress === 100
                            ? "bg-green-500"
                            : phase.progress > 0
                            ? "bg-indigo-500"
                            : "bg-gray-200"
                        }`}
                        style={{ width: `${phase.progress}%` }}
                      />

                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      {phase.status}
                    </p>

                  </div>

                </div>
              ))}

            </div>

          </div>

        </section>

        {/* ================= FOOTER ================= */}
        <footer className="py-8 text-center text-xs text-gray-400">
          CareerPath • Build skills. Build projects. Build your career.
        </footer>

      </main>
    </div>
  );
}