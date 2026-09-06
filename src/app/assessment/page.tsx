"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Difficulty =
  | "Basic"
  | "Intermediate"
  | "Advanced";

type Question = {
  id: number;
  skill_id: number;
  sector: string | null;
  priority: string | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: Difficulty;
};

type Career = {
  id: number;
  name: string;
};

type AssessmentResult = {
  attempt_id: number;
  total_questions: number;
  correct_answers: number;
  score: number;
};

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const TOTAL_QUESTIONS = 20;

const DIFFICULTY_TARGETS: Record<Difficulty, number> = {
  Basic: 6,
  Intermediate: 8,
  Advanced: 6,
};

const PRIORITY_TARGETS: Record<string, number> = {
  "1": 12,
  "2": 8,
};

/*
|--------------------------------------------------------------------------
| Utility functions
|--------------------------------------------------------------------------
*/

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function getDifficultyScore(
  question: Question,
  selected: Question[]
): number {
  const currentCount = selected.filter(
    (item) => item.difficulty === question.difficulty
  ).length;

  const target = DIFFICULTY_TARGETS[question.difficulty];

  if (currentCount < target) {
    return 100;
  }

  return 0;
}

function getPriorityScore(
  question: Question,
  selected: Question[]
): number {
  const priority = question.priority ?? "2";

  const currentCount = selected.filter(
    (item) => (item.priority ?? "2") === priority
  ).length;

  const target = PRIORITY_TARGETS[priority] ?? 0;

  if (currentCount < target) {
    return 50;
  }

  return 0;
}

function getSectorCount(
  sector: string,
  selected: Question[]
): number {
  return selected.filter(
    (item) => item.sector === sector
  ).length;
}

/*
|--------------------------------------------------------------------------
| Balanced question selection
|--------------------------------------------------------------------------
|
| The assessment does NOT simply take the first 20 questions.
|
| It tries to achieve:
|
| - 20 total questions
| - coverage across available sectors
| - 6 Basic
| - 8 Intermediate
| - 6 Advanced
| - approximately 12 Priority 1
| - approximately 8 Priority 2
|
| If a particular role has different data, the algorithm adapts
| automatically instead of failing.
|--------------------------------------------------------------------------
*/

function selectBalancedQuestions(
  questionPool: Question[]
): Question[] {
  if (questionPool.length <= TOTAL_QUESTIONS) {
    return shuffle(questionPool);
  }

  const shuffled = shuffle(questionPool);

  const sectors = Array.from(
    new Set(
      shuffled
        .map((question) => question.sector)
        .filter(
          (sector): sector is string =>
            Boolean(sector)
        )
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Step 1
  | Give every sector an opportunity to appear.
  |--------------------------------------------------------------------------
  */

  const selected: Question[] = [];

  for (const sector of sectors) {
    if (selected.length >= TOTAL_QUESTIONS) {
      break;
    }

    const sectorQuestions = shuffle(
      shuffled.filter(
        (question) =>
          question.sector === sector &&
          !selected.some(
            (item) => item.id === question.id
          )
      )
    );

    if (sectorQuestions.length === 0) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Prefer a question that helps satisfy the difficulty distribution.
    |--------------------------------------------------------------------------
    */

    const ranked = sectorQuestions.sort(
      (a, b) => {
        const scoreA =
          getDifficultyScore(a, selected) +
          getPriorityScore(a, selected);

        const scoreB =
          getDifficultyScore(b, selected) +
          getPriorityScore(b, selected);

        return scoreB - scoreA;
      }
    );

    selected.push(ranked[0]);

    /*
    |--------------------------------------------------------------------------
    | Give each sector a second question where possible.
    |--------------------------------------------------------------------------
    */

    if (selected.length < TOTAL_QUESTIONS) {
      const secondCandidates = shuffle(
        sectorQuestions.filter(
          (question) =>
            !selected.some(
              (item) => item.id === question.id
            )
        )
      );

      if (secondCandidates.length > 0) {
        const rankedSecond = secondCandidates.sort(
          (a, b) => {
            const scoreA =
              getDifficultyScore(a, selected) +
              getPriorityScore(a, selected);

            const scoreB =
              getDifficultyScore(b, selected) +
              getPriorityScore(b, selected);

            return scoreB - scoreA;
          }
        );

        selected.push(rankedSecond[0]);
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Step 2
  | Fill remaining positions while respecting difficulty and priority.
  |--------------------------------------------------------------------------
  */

  const remaining = shuffle(
    shuffled.filter(
      (question) =>
        !selected.some(
          (item) => item.id === question.id
        )
    )
  );

  while (
    selected.length < TOTAL_QUESTIONS &&
    remaining.length > 0
  ) {
    const ranked = remaining.sort(
      (a, b) => {
        const sectorCountA = getSectorCount(
          a.sector ?? "Unknown",
          selected
        );

        const sectorCountB = getSectorCount(
          b.sector ?? "Unknown",
          selected
        );

        const scoreA =
          getDifficultyScore(a, selected) +
          getPriorityScore(a, selected) -
          sectorCountA * 5;

        const scoreB =
          getDifficultyScore(b, selected) +
          getPriorityScore(b, selected) -
          sectorCountB * 5;

        return scoreB - scoreA;
      }
    );

    const next = ranked.shift();

    if (!next) {
      break;
    }

    selected.push(next);
  }

  /*
  |--------------------------------------------------------------------------
  | Step 3
  | Final shuffle so questions are not grouped by sector/difficulty.
  |--------------------------------------------------------------------------
  */

  return shuffle(selected.slice(0, TOTAL_QUESTIONS));
}

/*
|--------------------------------------------------------------------------
| Main component
|--------------------------------------------------------------------------
*/

export default function AssessmentPage() {
  const searchParams = useSearchParams();

  /*
  |--------------------------------------------------------------------------
  | role can be:
  |
  | /assessment?role=5
  |
  | OR legacy:
  |
  | /assessment?role=Cybersecurity%20Analyst
  |
  | OR omitted:
  |
  | /assessment
  |--------------------------------------------------------------------------
  */

  const roleParam = searchParams.get("role");

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [career, setCareer] =
    useState<Career | null>(null);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState<Record<number, string>>({});

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load assessment
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    async function loadAssessment() {
      setLoading(true);
      setError("");

      try {
        /*
        |--------------------------------------------------------------------------
        | 1. Get logged-in user
        |--------------------------------------------------------------------------
        */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(
            "You must be logged in to take the assessment."
          );
        }

        /*
        |--------------------------------------------------------------------------
        | 2. Determine role ID
        |--------------------------------------------------------------------------
        */

        let roleId: number | null = null;

        /*
        |--------------------------------------------------------------------------
        | Case A:
        | URL contains numeric role ID.
        |
        | /assessment?role=5
        |--------------------------------------------------------------------------
        */

        if (roleParam) {
          const parsedRole = Number(roleParam);

          if (
            Number.isInteger(parsedRole) &&
            parsedRole > 0
          ) {
            roleId = parsedRole;
          }
        }

        /*
        |--------------------------------------------------------------------------
        | Case B:
        | Legacy URL contains career name.
        |--------------------------------------------------------------------------
        */

        if (!roleId && roleParam) {
          const { data: careerByName } =
            await supabase
              .from("career_roles")
              .select("id, name")
              .eq("name", roleParam)
              .maybeSingle();

          if (careerByName) {
            roleId = Number(careerByName.id);
          }
        }

        /*
        |--------------------------------------------------------------------------
        | Case C:
        | No role in URL.
        |
        | Get target_role_id from user's profile.
        |--------------------------------------------------------------------------
        */

        if (!roleId) {
          const { data: profile, error: profileError } =
            await supabase
              .from("profiles")
              .select("target_role_id")
              .eq("id", user.id)
              .maybeSingle();

          if (profileError) {
            console.error(
              "Profile lookup error:",
              profileError
            );
          }

          if (profile?.target_role_id) {
            roleId = Number(
              profile.target_role_id
            );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | No career selected
        |--------------------------------------------------------------------------
        */

        if (!roleId) {
          throw new Error(
            "No career role selected. Please select your target career first."
          );
        }

        /*
        |--------------------------------------------------------------------------
        | 3. Get career
        |--------------------------------------------------------------------------
        */

        const {
          data: careerData,
          error: careerError,
        } = await supabase
          .from("career_roles")
          .select("id, name")
          .eq("id", roleId)
          .single();

        if (careerError || !careerData) {
          console.error(
            "Career lookup error:",
            careerError
          );

          throw new Error(
            "Unable to find the selected career."
          );
        }

        /*
        |--------------------------------------------------------------------------
        | 4. Get all questions for this role
        |
        | IMPORTANT:
        |
        | correct_option is NOT selected.
        | The browser never receives the answer key.
        |--------------------------------------------------------------------------
        */

        const {
          data: questionData,
          error: questionError,
        } = await supabase
          .from("assessment_questions")
          .select(
            `
              id,
              skill_id,
              sector,
              priority,
              question,
              option_a,
              option_b,
              option_c,
              option_d,
              difficulty
            `
          )
          .eq("role_id", roleId);

        if (questionError) {
          console.error(
            "Question loading error:",
            questionError
          );

          throw new Error(
            "Unable to load assessment questions."
          );
        }

        const allQuestions =
          (questionData ?? []) as Question[];

        if (allQuestions.length === 0) {
          throw new Error(
            `No assessment questions are available for ${careerData.name} yet.`
          );
        }

        /*
        |--------------------------------------------------------------------------
        | 5. Find questions previously answered by user
        |
        | This prevents the same question from repeatedly appearing.
        |--------------------------------------------------------------------------
        */

        let seenQuestionIds: number[] = [];

        const {
          data: previousAttempts,
          error: previousAttemptError,
        } = await supabase
          .from("assessment_attempts")
          .select("id")
          .eq("user_id", user.id);

        if (previousAttemptError) {
          console.warn(
            "Could not load previous attempts:",
            previousAttemptError
          );
        }

        if (
          previousAttempts &&
          previousAttempts.length > 0
        ) {
          const attemptIds =
            previousAttempts.map(
              (attempt) => attempt.id
            );

          const {
            data: previousAnswers,
            error: previousAnswersError,
          } = await supabase
            .from("assessment_answers")
            .select("question_id")
            .in("attempt_id", attemptIds);

          if (previousAnswersError) {
            console.warn(
              "Could not load previous answers:",
              previousAnswersError
            );
          } else {
            seenQuestionIds =
              (previousAnswers ?? [])
                .map((answer) =>
                  Number(answer.question_id)
                )
                .filter((id) =>
                  Number.isInteger(id)
                );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | 6. Prefer unseen questions
        |--------------------------------------------------------------------------
        */

        const unseenQuestions =
          allQuestions.filter(
            (question) =>
              !seenQuestionIds.includes(
                question.id
              )
          );

        /*
        |--------------------------------------------------------------------------
        | If enough unseen questions exist,
        | use only unseen questions.
        |
        | Otherwise use the entire bank so the assessment
        | can still contain 20 questions.
        |--------------------------------------------------------------------------
        */

        const questionPool =
          unseenQuestions.length >= TOTAL_QUESTIONS
            ? unseenQuestions
            : allQuestions;

        /*
        |--------------------------------------------------------------------------
        | 7. Select balanced 20-question assessment
        |--------------------------------------------------------------------------
        */

        const selectedQuestions =
          selectBalancedQuestions(
            questionPool
          );

        if (
          selectedQuestions.length <
          TOTAL_QUESTIONS
        ) {
          throw new Error(
            `CareerPath needs at least ${TOTAL_QUESTIONS} questions for this assessment. Only ${selectedQuestions.length} are currently available.`
          );
        }

        if (cancelled) return;

        setCareer({
          id: Number(careerData.id),
          name: careerData.name,
        });

        setQuestions(selectedQuestions);
        setCurrentQuestion(0);
        setAnswers({});
        setLoading(false);
      } catch (err) {
        console.error(
          "Assessment loading error:",
          err
        );

        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load assessment."
        );

        setLoading(false);
      }
    }

    loadAssessment();

    return () => {
      cancelled = true;
    };
  }, [roleParam, supabase]);

  /*
  |--------------------------------------------------------------------------
  | Select answer
  |--------------------------------------------------------------------------
  */

  function selectAnswer(option: string) {
    const question =
      questions[currentQuestion];

    if (!question) return;

    setAnswers((previous) => ({
      ...previous,
      [question.id]: option,
    }));

    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | Next
  |--------------------------------------------------------------------------
  */

  function nextQuestion() {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) => previous + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Previous
  |--------------------------------------------------------------------------
  */

  function previousQuestion() {
    if (currentQuestion > 0) {
      setCurrentQuestion(
        (previous) => previous - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Submit assessment
  |--------------------------------------------------------------------------
  */

  async function submitAssessment() {
    if (!career || questions.length === 0) {
      setError(
        "Assessment information is missing."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Make sure all 20 questions are answered.
    |--------------------------------------------------------------------------
    */

    if (
      Object.keys(answers).length !==
      questions.length
    ) {
      setError(
        `Please answer all ${questions.length} questions before submitting.`
      );

      return;
    }

    setSubmitting(true);
    setError("");

    try {
      /*
      |--------------------------------------------------------------------------
      | 1. Confirm logged-in user
      |--------------------------------------------------------------------------
      */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "You must be logged in to submit the assessment."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 2. Prepare answers
      |
      | Only question ID + selected option is sent.
      |
      | correct_option remains inside PostgreSQL.
      |--------------------------------------------------------------------------
      */

      const submittedAnswers =
        questions.map((question) => ({
          question_id: question.id,
          selected_option:
            answers[question.id],
        }));

      /*
      |--------------------------------------------------------------------------
      | 3. Secure PostgreSQL scoring
      |--------------------------------------------------------------------------
      */

      const {
        data,
        error: submitError,
      } = await supabase.rpc(
        "submit_assessment",
        {
          p_role_id: career.id,
          p_answers: submittedAnswers,
        }
      );

      if (submitError) {
        console.error(
          "Assessment submission error:",
          submitError
        );

        throw new Error(
          submitError.message ||
            "Unable to submit assessment."
        );
      }

      if (!data) {
        throw new Error(
          "Assessment was submitted, but no result was returned."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 4. Handle RPC result
      |
      | Supabase can return either an object or a one-row array
      | depending on the PostgreSQL function definition.
      |--------------------------------------------------------------------------
      */

      const rpcResult =
        Array.isArray(data)
          ? data[0]
          : data;

      if (!rpcResult) {
        throw new Error(
          "Assessment result is empty."
        );
      }

      const result: AssessmentResult = {
        attempt_id: Number(
          rpcResult.attempt_id
        ),

        total_questions: Number(
          rpcResult.total_questions
        ),

        correct_answers: Number(
          rpcResult.correct_answers
        ),

        score: Number(
          rpcResult.score
        ),
      };

      /*
      |--------------------------------------------------------------------------
      | 5. Store temporary result
      |--------------------------------------------------------------------------
      */

      sessionStorage.setItem(
        "assessment_result",
        JSON.stringify(result)
      );

      sessionStorage.setItem(
        "assessment_role",
        career.name
      );

      sessionStorage.setItem(
        "assessment_role_id",
        String(career.id)
      );

      /*
      |--------------------------------------------------------------------------
      | 6. Go to result page
      |--------------------------------------------------------------------------
      */

      window.location.href =
        "/assessment/result";
    } catch (err) {
      console.error(
        "Assessment submission failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit assessment."
      );

      setSubmitting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading screen
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading your assessment...
            </p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-600" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error screen
  |--------------------------------------------------------------------------
  */

  if (error && questions.length === 0) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              !
            </div>

            <h1 className="mt-5 text-xl font-semibold text-gray-900">
              Assessment Error
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-600">
              {error}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="/career-selection"
                className="rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Select Career
              </a>

              <a
                href="/dashboard"
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Back to Dashboard
              </a>
            </div>

          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | No questions
  |--------------------------------------------------------------------------
  */

  if (
    !career ||
    questions.length === 0
  ) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">
              No Assessment Available
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              No questions are currently available
              for your selected career.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Current question
  |--------------------------------------------------------------------------
  */

  const question =
    questions[currentQuestion];

  const selectedAnswer =
    answers[question.id];

  const progress = Math.round(
    ((currentQuestion + 1) /
      questions.length) *
      100
  );

  const answeredCount =
    Object.keys(answers).length;

  const options = [
    {
      key: "A",
      value: question.option_a,
    },
    {
      key: "B",
      value: question.option_b,
    },
    {
      key: "C",
      value: question.option_c,
    },
    {
      key: "D",
      value: question.option_d,
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
      <div className="mx-auto max-w-4xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-8">

          <p className="text-sm font-medium text-indigo-600">
            Career Assessment
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Test your knowledge
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Answer 20 questions to help CareerPath
            understand your current skills and
            identify where you should focus next.
          </p>

          {career && (
            <div className="mt-4 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              Target Career: {career.name}
            </div>
          )}
        </div>

        {/* =====================================================
            PROGRESS
        ====================================================== */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <span className="text-sm font-semibold text-gray-800">
              Question {currentQuestion + 1} of{" "}
              {questions.length}
            </span>

            <span className="text-sm font-medium text-gray-500">
              {progress}%
            </span>

          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">

            <span>
              {answeredCount} of{" "}
              {questions.length} answered
            </span>

            <span>
              {questions.length -
                answeredCount} remaining
            </span>

          </div>

        </div>

        {/* =====================================================
            QUESTION CARD
        ====================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          {/* Question metadata */}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-2">

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  question.difficulty ===
                  "Basic"
                    ? "bg-emerald-50 text-emerald-700"
                    : question.difficulty ===
                      "Intermediate"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {question.difficulty}
              </span>

              {question.priority && (
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                  Priority{" "}
                  {question.priority}
                </span>
              )}

            </div>

            <span className="text-xs font-medium text-gray-400">
              {question.sector ||
                "Core Skills"}
            </span>

          </div>

          {/* Question */}

          <h2 className="text-xl font-semibold leading-8 text-gray-900">
            {question.question}
          </h2>

          {/* ===================================================
              OPTIONS
          ==================================================== */}

          <div className="mt-8 space-y-3">

            {options.map((option) => {

              const isSelected =
                selectedAnswer ===
                option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    selectAnswer(
                      option.key
                    )
                  }
                  disabled={submitting}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
                  } ${
                    submitting
                      ? "cursor-not-allowed opacity-70"
                      : ""
                  }`}
                >

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {option.key}
                  </span>

                  <span
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-indigo-900"
                        : "text-gray-700"
                    }`}
                  >
                    {option.value}
                  </span>

                </button>
              );
            })}

          </div>

          {/* ===================================================
              ERROR
          ==================================================== */}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* ===================================================
              NAVIGATION
          ==================================================== */}

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">

            <button
              type="button"
              onClick={
                previousQuestion
              }
              disabled={
                currentQuestion === 0 ||
                submitting
              }
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            {currentQuestion <
            questions.length - 1 ? (
              <button
                type="button"
                onClick={nextQuestion}
                disabled={
                  !selectedAnswer ||
                  submitting
                }
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next Question →
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  submitAssessment
                }
                disabled={
                  !selectedAnswer ||
                  submitting
                }
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Assessment"}
              </button>
            )}

          </div>

        </div>

        {/* =====================================================
            ASSESSMENT INFO
        ====================================================== */}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-lg font-bold text-gray-900">
              20
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Questions
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-lg font-bold text-gray-900">
              {new Set(
                questions.map(
                  (question) =>
                    question.sector
                )
              ).size}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Skill Areas
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-lg font-bold text-gray-900">
              {answeredCount}/
              {questions.length}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Answered
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}