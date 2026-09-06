"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AssessmentResult = {
  attempt_id?: number;
  total_questions: number;
  correct_answers: number;
  score: number;
};

export default function AssessmentResultPage() {
  const router = useRouter();

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [role, setRole] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedResult = sessionStorage.getItem("assessment_result");
    const storedRole = sessionStorage.getItem("assessment_role");

    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
      } catch (error) {
        console.error("Unable to read assessment result:", error);
      }
    }

    if (storedRole) {
      setRole(storedRole);
    }

    setHydrated(true);
  }, []);

  /*
   * Important:
   * Wait until the browser has loaded sessionStorage.
   * This prevents the server/client hydration mismatch.
   */
  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

            <p className="mt-4 text-sm font-medium text-gray-500">
              Loading your assessment result...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * If there is no result in sessionStorage,
   * show a recovery screen.
   */
  if (!result) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl">
              !
            </div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              Assessment Result Not Found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              We couldn't find your latest assessment result. Please take the
              assessment again to generate your personalized skill analysis.
            </p>

            <button
              onClick={() => router.push("/assessment")}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Take Assessment Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const score = Number(result.score);

  let performance = "";
  let performanceDescription = "";

  if (score >= 80) {
    performance = "Strong";
    performanceDescription =
      "You have a strong foundation for your selected career.";
  } else if (score >= 60) {
    performance = "Good";
    performanceDescription =
      "You have a good foundation, but there are some areas to improve.";
  } else if (score >= 40) {
    performance = "Needs Improvement";
    performanceDescription =
      "You have some foundational knowledge, but several skills need improvement.";
  } else {
    performance = "Weak";
    performanceDescription =
      "Your assessment shows several important skill gaps to work on.";
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            CareerPath Assessment
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Assessment Complete 🎉
          </h1>

          <p className="mt-2 text-gray-500">
            Here is your assessment result for{" "}
            <span className="font-semibold text-gray-700">
              {role || "your selected career"}
            </span>
            .
          </p>
        </div>

        {/* Score Card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

          <div className="grid gap-6 md:grid-cols-3">

            {/* Overall Score */}
            <div className="rounded-2xl bg-indigo-50 p-6 text-center">
              <p className="text-sm font-medium text-gray-500">
                Overall Score
              </p>

              <p className="mt-3 text-5xl font-bold text-indigo-600">
                {score}%
              </p>
            </div>

            {/* Correct Answers */}
            <div className="rounded-2xl bg-green-50 p-6 text-center">
              <p className="text-sm font-medium text-gray-500">
                Correct Answers
              </p>

              <p className="mt-3 text-4xl font-bold text-green-600">
                {result.correct_answers}
                <span className="text-xl text-gray-400">
                  /{result.total_questions}
                </span>
              </p>
            </div>

            {/* Performance */}
            <div className="rounded-2xl bg-amber-50 p-6 text-center">
              <p className="text-sm font-medium text-gray-500">
                Performance
              </p>

              <p className="mt-3 text-2xl font-bold text-amber-600">
                {performance}
              </p>
            </div>

          </div>

          {/* Progress */}
          <div className="mt-8">

            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Assessment Performance
              </span>

              <span className="text-sm font-semibold text-gray-900">
                {score}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${Math.min(Math.max(score, 0), 100)}%`,
                }}
              />
            </div>

          </div>

          {/* Performance Description */}
          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="font-semibold text-gray-900">
              What this means
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {performanceDescription}
            </p>
          </div>

          {/* Next Step */}
          <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">

            <p className="text-sm font-semibold text-indigo-600">
              NEXT STEP
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Analyze Your Skill Gaps
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              CareerPath will compare your assessment performance with the
              skills required for your target career and identify what you
              should focus on next.
            </p>

            <button
              onClick={() => router.push("/skills")}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              View My Skill Gaps
              <span className="ml-2 text-lg">→</span>
            </button>

          </div>

        </div>

        {/* CareerPath Flow */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">

          <div className="rounded-full bg-green-100 px-4 py-2 font-medium text-green-700">
            ✓ Assessment
          </div>

          <span className="text-gray-400">→</span>

          <div className="rounded-full bg-indigo-100 px-4 py-2 font-medium text-indigo-700">
            Skill Gaps
          </div>

          <span className="text-gray-400">→</span>

          <div className="rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-500">
            Roadmap
          </div>

          <span className="text-gray-400">→</span>

          <div className="rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-500">
            Learning
          </div>

          <span className="text-gray-400">→</span>

          <div className="rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-500">
            Projects
          </div>

        </div>

      </div>
    </main>
  );
}