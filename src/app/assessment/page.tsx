"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  difficulty: "Basic" | "Intermediate" | "Advanced";
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

const TOTAL_QUESTIONS = 20;

/* =========================================================
   SHUFFLE
========================================================= */

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

/* =========================================================
   SELECT BALANCED QUESTIONS
========================================================= */

function selectBalancedQuestions(
  allQuestions: Question[]
): Question[] {
  if (allQuestions.length < TOTAL_QUESTIONS) {
    return [];
  }

  /*
    Target distribution:

    Basic          → 6
    Intermediate   → 8
    Advanced       → 6

    Total          → 20
  */

  const basic = shuffle(
    allQuestions.filter(
      (question) => question.difficulty === "Basic"
    )
  );

  const intermediate = shuffle(
    allQuestions.filter(
      (question) => question.difficulty === "Intermediate"
    )
  );

  const advanced = shuffle(
    allQuestions.filter(
      (question) => question.difficulty === "Advanced"
    )
  );

  const selected: Question[] = [];

  /*
    First try to maintain the desired
    difficulty distribution.
  */

  selected.push(...basic.slice(0, 6));
  selected.push(...intermediate.slice(0, 8));
  selected.push(...advanced.slice(0, 6));

  /*
    If there are not enough questions in
    one of the difficulty categories,
    fill the remaining slots from the
    unused question bank.
  */

  if (selected.length < TOTAL_QUESTIONS) {
    const selectedIds = new Set(
      selected.map((question) => question.id)
    );

    const remaining = shuffle(
      allQuestions.filter(
        (question) => !selectedIds.has(question.id)
      )
    );

    selected.push(
      ...remaining.slice(
        0,
        TOTAL_QUESTIONS - selected.length
      )
    );
  }

  /*
    Remove duplicates by question ID.
  */

  const uniqueQuestions = Array.from(
    new Map(
      selected.map((question) => [
        question.id,
        question,
      ])
    ).values()
  );

  /*
    Final random order.
  */

  return shuffle(uniqueQuestions).slice(
    0,
    TOTAL_QUESTIONS
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AssessmentPage() {
  const searchParams = useSearchParams();

  const roleFromUrl = searchParams.get("role");

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

  /* =======================================================
     LOAD ASSESSMENT
  ======================================================= */

  useEffect(() => {
    async function loadAssessment() {
      setLoading(true);
      setError("");

      /*
        Reset previous assessment state
        whenever the role changes.
      */

      setCareer(null);
      setQuestions([]);
      setCurrentQuestion(0);
      setAnswers({});

      const supabase = createClient();

      try {
        /* -------------------------------------------------
           1. CHECK USER
        ------------------------------------------------- */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError(
            "You must be logged in to take the assessment."
          );

          setLoading(false);
          return;
        }

        /* -------------------------------------------------
           2. FIND CAREER
        ------------------------------------------------- */

        let selectedCareer: Career | null = null;

        /*
          Case 1:
          URL contains role ID.

          Example:

          /assessment?role=5
        */

        if (roleFromUrl) {
          const roleId = Number(roleFromUrl);

          if (
            !Number.isInteger(roleId) ||
            roleId <= 0
          ) {
            setError(
              "Invalid career role selected."
            );

            setLoading(false);
            return;
          }

          const {
            data: careerData,
            error: careerError,
          } = await supabase
            .from("career_roles")
            .select("id, name")
            .eq("id", roleId)
            .maybeSingle();

          if (careerError) {
            console.error(
              "Career lookup error:",
              careerError
            );

            setError(
              `Unable to load the selected career: ${careerError.message}`
            );

            setLoading(false);
            return;
          }

          if (!careerData) {
            console.error(
              "Career not found for role ID:",
              roleId
            );

            setError(
              "Unable to find the selected career."
            );

            setLoading(false);
            return;
          }

          selectedCareer = careerData;
        }

        /*
          Case 2:
          No role was provided in the URL.

          In this case, use the user's
          target_role_id from profiles.
        */

        else {
          const {
            data: profileData,
            error: profileError,
          } = await supabase
            .from("profiles")
            .select("target_role_id")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) {
            console.error(
              "Profile lookup error:",
              profileError
            );

            setError(
              `Unable to load your career profile: ${profileError.message}`
            );

            setLoading(false);
            return;
          }

          if (!profileData?.target_role_id) {
            setError(
              "Please select a target career before starting the assessment."
            );

            setLoading(false);
            return;
          }

          const {
            data: careerData,
            error: careerError,
          } = await supabase
            .from("career_roles")
            .select("id, name")
            .eq(
              "id",
              profileData.target_role_id
            )
            .maybeSingle();

          if (careerError) {
            console.error(
              "Career lookup error:",
              careerError
            );

            setError(
              `Unable to load your target career: ${careerError.message}`
            );

            setLoading(false);
            return;
          }

          if (!careerData) {
            setError(
              "Your selected career could not be found."
            );

            setLoading(false);
            return;
          }

          selectedCareer = careerData;
        }

        /* -------------------------------------------------
           IMPORTANT:
           SAVE CAREER TO REACT STATE
        ------------------------------------------------- */

        if (!selectedCareer) {
          setError(
            "Unable to determine your selected career."
          );

          setLoading(false);
          return;
        }

        /*
          THIS WAS MISSING IN YOUR OLD CODE.

          Without this, career remained null and
          the page displayed "No Assessment Available".
        */

        setCareer(selectedCareer);

        console.log(
          "Selected career:",
          selectedCareer
        );

        /* -------------------------------------------------
           3. LOAD QUESTION BANK
        ------------------------------------------------- */

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
          .eq(
            "role_id",
            selectedCareer.id
          );

        if (questionError) {
          console.error(
            "Question loading error:",
            questionError
          );

          setError(
            `Unable to load assessment questions: ${questionError.message}`
          );

          setLoading(false);
          return;
        }

        console.log(
          "Total questions loaded:",
          questionData?.length ?? 0
        );

        if (
          !questionData ||
          questionData.length < TOTAL_QUESTIONS
        ) {
          setError(
            `Only ${questionData?.length ?? 0
            } questions are available. At least 20 questions are required.`
          );

          setLoading(false);
          return;
        }

        /* -------------------------------------------------
           4. SELECT EXACTLY 20
        ------------------------------------------------- */

        const selectedQuestions =
          selectBalancedQuestions(
            questionData as Question[]
          );

        console.log(
          "Selected assessment questions:",
          selectedQuestions.length
        );

        /*
          Verify that exactly 20 were selected.
        */

        if (
          selectedQuestions.length !==
          TOTAL_QUESTIONS
        ) {
          setError(
            "Unable to prepare exactly 20 assessment questions."
          );

          setLoading(false);
          return;
        }

        /* -------------------------------------------------
           5. SAVE QUESTIONS
        ------------------------------------------------- */

        setQuestions(
          selectedQuestions
        );

        setCurrentQuestion(0);
        setAnswers({});

        setLoading(false);
      } catch (err) {
        console.error(
          "Assessment loading exception:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load assessment."
        );

        setLoading(false);
      }
    }

    loadAssessment();
  }, [roleFromUrl]);

  /* =======================================================
     SELECT ANSWER
  ======================================================= */

  function selectAnswer(
    option: string
  ) {
    const question =
      questions[currentQuestion];

    if (!question || submitting) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [question.id]: option,
    }));

    setError("");
  }

  /* =======================================================
     NEXT
  ======================================================= */

  function nextQuestion() {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) =>
          previous + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* =======================================================
     PREVIOUS
  ======================================================= */

  function previousQuestion() {
    if (
      currentQuestion > 0
    ) {
      setCurrentQuestion(
        (previous) =>
          previous - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* =======================================================
     SUBMIT ASSESSMENT
  ======================================================= */

  async function submitAssessment() {
    if (
      !career ||
      questions.length !== TOTAL_QUESTIONS
    ) {
      setError(
        "Assessment information is missing."
      );

      return;
    }

    /* -----------------------------------------------------
       MAKE SURE ALL 20 ARE ANSWERED
    ----------------------------------------------------- */

    if (
      Object.keys(answers).length !==
      TOTAL_QUESTIONS
    ) {
      setError(
        "Please answer all 20 questions before submitting."
      );

      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const supabase =
        createClient();

      /* -------------------------------------------------
         1. VERIFY USER
      ------------------------------------------------- */

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        throw new Error(
          "You must be logged in to submit the assessment."
        );
      }

      /* -------------------------------------------------
         2. PREPARE EXACTLY 20 ANSWERS
      ------------------------------------------------- */

      const submittedAnswers =
        questions.map(
          (question) => ({
            question_id:
              question.id,

            selected_option:
              answers[
              question.id
              ],
          })
        );

      if (
        submittedAnswers.length !==
        TOTAL_QUESTIONS
      ) {
        throw new Error(
          "Exactly 20 answers are required."
        );
      }

      /*
        Extra safety check:
        Make sure every question has an answer.
      */

      const unanswered =
        submittedAnswers.filter(
          (answer) =>
            !answer.selected_option
        );

      if (unanswered.length > 0) {
        throw new Error(
          `There are ${unanswered.length} unanswered questions.`
        );
      }

      /* -------------------------------------------------
         3. SEND TO POSTGRESQL RPC
      ------------------------------------------------- */

      console.log(
        "Submitting assessment:",
        {
          role_id: career.id,
          question_count:
            submittedAnswers.length,
        }
      );

      const {
        data,
        error: submitError,
      } =
        await supabase.rpc(
          "submit_assessment",
          {
            p_role_id:
              career.id,

            p_answers:
              submittedAnswers,
          }
        );

      if (submitError) {
        console.error(
          "========== ASSESSMENT SUBMISSION ERROR =========="
        );

        console.error(
          "Error:",
          submitError
        );

        console.error(
          "Message:",
          submitError.message
        );

        console.error(
          "Details:",
          submitError.details
        );

        console.error(
          "Hint:",
          submitError.hint
        );

        console.error(
          "Code:",
          submitError.code
        );

        console.error(
          "JSON:",
          JSON.stringify(
            submitError,
            null,
            2
          )
        );

        console.error(
          "================================================="
        );

        setError(
          submitError.message ||
          submitError.details ||
          "Assessment submission failed."
        );

        setSubmitting(false);

        return;
      }

      console.log(
        "Raw assessment result:",
        data
      );

      if (!data) {
        throw new Error(
          "Assessment was submitted, but no result was returned."
        );
      }

      /* -------------------------------------------------
         4. HANDLE RPC RESULT
      ------------------------------------------------- */

      /*
        Supabase can return a single object or
        an array depending on the PostgreSQL
        function return type.

        Handle both safely.
      */

      const rawResult =
        Array.isArray(data)
          ? data[0]
          : data;

      if (!rawResult) {
        throw new Error(
          "Assessment result was empty."
        );
      }

      const result: AssessmentResult = {
        attempt_id:
          Number(
            rawResult.attempt_id
          ),

        total_questions:
          Number(
            rawResult.total_questions
          ),

        correct_answers:
          Number(
            rawResult.correct_answers
          ),

        score:
          Number(
            rawResult.score
          ),
      };

      console.log(
        "Processed assessment result:",
        result
      );

      /* -------------------------------------------------
         5. VERIFY RESULT
      ------------------------------------------------- */

      if (
        !Number.isFinite(
          result.attempt_id
        )
      ) {
        throw new Error(
          "Invalid assessment attempt ID returned by the database."
        );
      }

      if (
        result.total_questions !==
        TOTAL_QUESTIONS
      ) {
        throw new Error(
          `Assessment returned ${result.total_questions} questions instead of 20. Please check the assessment database function.`
        );
      }

      if (
        !Number.isFinite(
          result.correct_answers
        )
      ) {
        throw new Error(
          "Invalid correct answer count returned by the database."
        );
      }

      if (
        !Number.isFinite(
          result.score
        )
      ) {
        throw new Error(
          "Invalid assessment score returned by the database."
        );
      }

      /* -------------------------------------------------
         6. SAVE RESULT
      ------------------------------------------------- */

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

      /* -------------------------------------------------
         7. REDIRECT TO RESULT
      ------------------------------------------------- */

      window.location.href =
        "/assessment/result";
    } catch (err) {
      console.error(
        "Assessment submission exception:",
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

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading your assessment...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    questions.length === 0
  ) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">
              Assessment Error
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     NO QUESTIONS
  ======================================================= */

  if (
    !career ||
    questions.length !==
    TOTAL_QUESTIONS
  ) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">
              No Assessment Available
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Unable to prepare your
              20-question assessment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     CURRENT QUESTION
  ======================================================= */

  const question =
    questions[currentQuestion];

  /*
    Safety check in case the current
    question somehow does not exist.
  */

  if (!question) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">
              Assessment Error
            </h1>

            <p className="mt-2 text-sm text-red-600">
              Unable to load the current question.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const selectedAnswer =
    answers[question.id];

  const progress = Math.round(
    ((currentQuestion + 1) /
      TOTAL_QUESTIONS) *
    100
  );

  const answeredCount =
    Object.keys(answers).length;

  const options = [
    {
      key: "A",
      value:
        question.option_a,
    },
    {
      key: "B",
      value:
        question.option_b,
    },
    {
      key: "C",
      value:
        question.option_c,
    },
    {
      key: "D",
      value:
        question.option_d,
    },
  ];

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}

        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Career Assessment
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Test your knowledge
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Answer 20 questions to help
            CareerPath understand your
            current skills.
          </p>
        </div>

        {/* INFORMATION */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400">
              Target Career
            </p>

            <p className="mt-1 text-sm font-bold text-gray-900">
              {career.name}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400">
              Questions
            </p>

            <p className="mt-1 text-sm font-bold text-gray-900">
              20 Questions
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400">
              Answered
            </p>

            <p className="mt-1 text-sm font-bold text-gray-900">
              {answeredCount} / 20
            </p>
          </div>

        </div>

        {/* PROGRESS */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <span className="text-sm font-semibold text-gray-800">
              Question{" "}
              {currentQuestion + 1}{" "}
              of 20
            </span>

            <span className="text-sm font-medium text-gray-500">
              {progress}%
            </span>

          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width:
                  `${progress}%`,
              }}
            />

          </div>
        </div>

        {/* QUESTION CARD */}

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          {/* METADATA */}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-2">

              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {question.difficulty}
              </span>

              {question.priority && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Priority{" "}
                  {question.priority}
                </span>
              )}

            </div>

            {question.sector && (
              <span className="text-xs font-medium text-gray-400">
                {question.sector}
              </span>
            )}

          </div>

          {/* QUESTION */}

          <h2 className="text-xl font-semibold leading-8 text-gray-900">
            {question.question}
          </h2>

          {/* OPTIONS */}

          <div className="mt-8 space-y-3">

            {options.map(
              (option) => {

                const isSelected =
                  selectedAnswer ===
                  option.key;

                return (
                  <button
                    key={
                      option.key
                    }
                    type="button"
                    onClick={() =>
                      selectAnswer(
                        option.key
                      )
                    }
                    disabled={
                      submitting
                    }
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${isSelected
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                        : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
                      } ${submitting
                        ? "cursor-not-allowed opacity-70"
                        : ""
                      }`}
                  >

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {
                        option.key
                      }
                    </span>

                    <span
                      className={`text-sm font-medium ${isSelected
                          ? "text-indigo-900"
                          : "text-gray-700"
                        }`}
                    >
                      {
                        option.value
                      }
                    </span>

                  </button>
                );
              }
            )}

          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* NAVIGATION */}

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">

            <button
              type="button"
              onClick={
                previousQuestion
              }
              disabled={
                currentQuestion ===
                0 ||
                submitting
              }
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {currentQuestion <
              questions.length -
              1 ? (
              <button
                type="button"
                onClick={
                  nextQuestion
                }
                disabled={
                  !selectedAnswer ||
                  submitting
                }
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next Question
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

        {/* ANSWER STATUS */}

        <div className="mt-5 text-center text-sm text-gray-500">
          {answeredCount} of 20
          questions answered
        </div>

      </div>
    </main>
  );
}