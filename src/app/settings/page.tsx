"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AssessmentAttempt = {
  id: number;
  role_id: number;
  total_questions: number;
  correct_answers: number;
  score: number;
  started_at: string;
  completed_at: string | null;
};

type AssessmentAnswer = {
  id: number;
  attempt_id: number;
  question_id: number;
  selected_option: string;
  is_correct: boolean;
};

type AssessmentQuestion = {
  id: number;
  skill_id: number;
  sector: string | null;
  priority: string | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  difficulty: string | null;
};

type Profile = {
  full_name: string | null;
  target_role_id: number | null;
  experience_level: string | null;
};

type CareerRole = {
  id: number;
  name: string;
};

type SkillGap = {
  skill_name: string;
  skill_score: number | null;
  required_level: number | null;
  skill_gap: number | null;
  status: string | null;
  priority: string | null;
};

type ProjectProgress = {
  project_id: number;
  progress: number | null;
  completed: boolean | null;
  updated_at: string | null;
};

type CareerProject = {
  id: number;
  title: string;
  difficulty: string | null;
};

type LearningProgress = {
  id: number;
  resource_id?: number;
  learning_resource_id?: number;
  progress: number | null;
  completed: boolean | null;
  updated_at?: string | null;
};

type LearningResource = {
  id: number;
  name: string;
  provider: string | null;
};

type CertificationProgress = {
  certification_id: number;
  progress: number | null;
  completed: boolean | null;
  updated_at: string | null;
};

type Certification = {
  id: number;
  title: string;
  provider: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(true);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadSettings();

    const savedEmailNotifications =
      localStorage.getItem("emailNotifications");

    const savedTaskReminders =
      localStorage.getItem("taskReminders");

    const savedProgressUpdates =
      localStorage.getItem("progressUpdates");

    if (savedEmailNotifications !== null) {
      setEmailNotifications(
        savedEmailNotifications === "true"
      );
    }

    if (savedTaskReminders !== null) {
      setTaskReminders(
        savedTaskReminders === "true"
      );
    }

    if (savedProgressUpdates !== null) {
      setProgressUpdates(
        savedProgressUpdates === "true"
      );
    }
  }, []);

  async function loadSettings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setEmail(user.email || "");
    setLoading(false);
  }

  function saveNotificationSetting(
    key: string,
    value: boolean
  ) {
    localStorage.setItem(key, String(value));
  }

  async function handleSendPasswordReset() {
    setPasswordLoading(true);
    setPasswordMessage("");
    setPasswordError("");

    if (!email) {
      setPasswordError(
        "Unable to find your email address."
      );
      setPasswordLoading(false);
      return;
    }

    const redirectTo =
      `${window.location.origin}/auth/callback?next=/auth/reset-password`;

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo,
        }
      );

    if (error) {
      console.error(
        "Password reset error:",
        error
      );

      setPasswordError(error.message);
      setPasswordLoading(false);
      return;
    }

    setPasswordMessage(
      "Password reset email sent. Please check your email and follow the verification link."
    );

    setPasswordLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  /* ============================================================
     PDF PROGRESS REPORT
  ============================================================ */

  async function handleDownloadProgressPDF() {
    if (pdfLoading) {
      return;
    }

    setPdfLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      /* ========================================================
         1. LOAD PROFILE
      ======================================================== */

      const { data: profileData } =
        await supabase
          .from("profiles")
          .select(
            "full_name,target_role_id,experience_level"
          )
          .eq("id", user.id)
          .maybeSingle();

      const profile =
        profileData as Profile | null;

      /* ========================================================
         2. LOAD CAREER ROLES
      ======================================================== */

      const { data: rolesData } =
        await supabase
          .from("career_roles")
          .select("id,name");

      const roles =
        (rolesData || []) as CareerRole[];

      const targetRole =
        roles.find(
          (role) =>
            role.id ===
            profile?.target_role_id
        );

      /* ========================================================
         3. LOAD ALL ASSESSMENT ATTEMPTS
      ======================================================== */

      const { data: assessmentData } =
        await supabase
          .from("assessment_attempts")
          .select(
            "id,role_id,total_questions,correct_answers,score,started_at,completed_at"
          )
          .eq("user_id", user.id)
          .order("started_at", {
            ascending: false,
          });

      const assessments =
        (assessmentData || []) as AssessmentAttempt[];

      /* ========================================================
         4. LOAD ALL ASSESSMENT ANSWERS
      ======================================================== */

      const attemptIds =
        assessments.map(
          (assessment) => assessment.id
        );

      let assessmentAnswers: AssessmentAnswer[] =
        [];

      if (attemptIds.length > 0) {
        const { data: answersData } =
          await supabase
            .from("assessment_answers")
            .select(
              "id,attempt_id,question_id,selected_option,is_correct"
            )
            .in("attempt_id", attemptIds)
            .order("id", {
              ascending: true,
            });

        assessmentAnswers =
          (answersData || []) as AssessmentAnswer[];
      }

      /* ========================================================
         5. LOAD ALL QUESTIONS USED IN ASSESSMENTS
      ======================================================== */

      const questionIds = Array.from(
        new Set(
          assessmentAnswers.map(
            (answer) => answer.question_id
          )
        )
      );

      let assessmentQuestions: AssessmentQuestion[] =
        [];

      if (questionIds.length > 0) {
        const { data: questionsData } =
          await supabase
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
                correct_option,
                explanation,
                difficulty
              `
            )
            .in("id", questionIds);

        assessmentQuestions =
          (questionsData ||
            []) as AssessmentQuestion[];
      }

      /* ========================================================
         6. LOAD SKILL GAPS
      ======================================================== */

      const { data: skillGapsData } =
        await supabase
          .from("user_skill_gaps")
          .select(
            "skill_name,skill_score,required_level,skill_gap,status,priority"
          )
          .eq("user_id", user.id)
          .eq(
            "role_id",
            profile?.target_role_id || -1
          )
          .order("skill_gap", {
            ascending: false,
          });

      const skillGaps =
        (skillGapsData || []) as SkillGap[];

      /* ========================================================
         7. LOAD PROJECTS
      ======================================================== */

      let projects: CareerProject[] = [];

      if (profile?.target_role_id) {
        const { data: projectData } =
          await supabase
            .from("career_projects")
            .select(
              "id,title,difficulty"
            )
            .eq(
              "role_id",
              profile.target_role_id
            )
            .order("item_order", {
              ascending: true,
            });

        projects =
          (projectData || []) as CareerProject[];
      }

      /* ========================================================
         8. LOAD PROJECT PROGRESS
      ======================================================== */

      const { data: projectProgressData } =
        await supabase
          .from("user_project_progress")
          .select(
            "project_id,progress,completed,updated_at"
          )
          .eq("user_id", user.id);

      const projectProgress =
        (projectProgressData ||
          []) as ProjectProgress[];

      /* ========================================================
         9. LOAD LEARNING PROGRESS
      ======================================================== */

      const { data: learningProgressData } =
        await supabase
          .from("user_learning_progress")
          .select("*")
          .eq("user_id", user.id);

      const learningProgress =
        (learningProgressData ||
          []) as LearningProgress[];

      /* ========================================================
         10. LOAD LEARNING RESOURCES
      ======================================================== */

      const learningResourceIds =
        learningProgress
          .map(
            (item) =>
              item.learning_resource_id ??
              item.resource_id
          )
          .filter(
            (
              id
            ): id is number =>
              typeof id === "number"
          );

      let learningResources: LearningResource[] =
        [];

      if (
        learningResourceIds.length > 0
      ) {
        const {
          data: resourceData,
        } = await supabase
          .from("learning_resources")
          .select(
            "id,name,provider"
          )
          .in(
            "id",
            learningResourceIds
          );

        learningResources =
          (resourceData ||
            []) as LearningResource[];
      }

      /* ========================================================
         11. LOAD CERTIFICATIONS
      ======================================================== */

      let certifications: Certification[] =
        [];

      if (profile?.target_role_id) {
        const {
          data: certificationData,
        } = await supabase
          .from("certifications")
          .select(
            "id,title,provider"
          )
          .eq(
            "role_id",
            profile.target_role_id
          )
          .order("item_order", {
            ascending: true,
          });

        certifications =
          (certificationData ||
            []) as Certification[];
      }

      /* ========================================================
         12. LOAD CERTIFICATION PROGRESS
      ======================================================== */

      const {
        data: certificationProgressData,
      } = await supabase
        .from(
          "user_certification_progress"
        )
        .select(
          "certification_id,progress,completed,updated_at"
        )
        .eq("user_id", user.id);

      const certificationProgress =
        (certificationProgressData ||
          []) as CertificationProgress[];

      /* ========================================================
         CALCULATIONS
      ======================================================== */

      const latestAssessment =
        assessments.length > 0
          ? assessments[0]
          : null;

      const assessmentAverage =
        assessments.length > 0
          ? assessments.reduce(
              (sum, assessment) =>
                sum +
                Number(
                  assessment.score || 0
                ),
              0
            ) / assessments.length
          : 0;

      const assessedSkills =
        skillGaps.filter(
          (skill) =>
            skill.skill_score !== null &&
            skill.skill_score !== undefined
        );

      const averageSkillScore =
        assessedSkills.length > 0
          ? assessedSkills.reduce(
              (sum, skill) =>
                sum +
                Number(
                  skill.skill_score || 0
                ),
              0
            ) / assessedSkills.length
          : 0;

      const completedProjects =
        projectProgress.filter(
          (project) =>
            project.completed === true ||
            Number(project.progress || 0) >=
              100
        ).length;

      const activeProjects =
        projectProgress.filter(
          (project) =>
            Number(project.progress || 0) >
              0 &&
            Number(project.progress || 0) <
              100
        ).length;

      const completedLearning =
        learningProgress.filter(
          (item) =>
            item.completed === true ||
            Number(item.progress || 0) >=
              100
        ).length;

      const activeLearning =
        learningProgress.filter(
          (item) =>
            Number(item.progress || 0) >
              0 &&
            Number(item.progress || 0) <
              100
        ).length;

      const completedCertifications =
        certificationProgress.filter(
          (item) =>
            item.completed === true ||
            Number(item.progress || 0) >=
              100
        ).length;

      const activeCertifications =
        certificationProgress.filter(
          (item) =>
            Number(item.progress || 0) >
              0 &&
            Number(item.progress || 0) <
              100
        ).length;

      /* ========================================================
         PDF INITIALIZATION
      ======================================================== */

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      const margin = 15;

      let y = 18;

      /* ========================================================
         PDF HELPERS
      ======================================================== */

      function addPageIfNeeded(
        requiredHeight = 20
      ) {
        if (
          y + requiredHeight >
          pageHeight - 18
        ) {
          doc.addPage();
          y = 18;
        }
      }

      function formatDate(
        value:
          | string
          | null
          | undefined
      ) {
        if (!value) {
          return "—";
        }

        const date = new Date(value);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return "—";
        }

        return date.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );
      }

      function formatScore(
        value: number
      ) {
        return `${Number(value || 0).toFixed(
          1
        )}%`;
      }

      function getOptionText(
        question: AssessmentQuestion,
        option: string
      ) {
        switch (
          option.toUpperCase()
        ) {
          case "A":
            return question.option_a;

          case "B":
            return question.option_b;

          case "C":
            return question.option_c;

          case "D":
            return question.option_d;

          default:
            return option;
        }
      }

      function addSectionTitle(
        title: string
      ) {
        addPageIfNeeded(18);

        doc.setFontSize(14);
        doc.setFont(
          "helvetica",
          "bold"
        );
        doc.setTextColor(
          31,
          41,
          55
        );

        doc.text(
          title,
          margin,
          y
        );

        y += 8;

        doc.setDrawColor(
          220,
          223,
          230
        );

        doc.line(
          margin,
          y,
          pageWidth - margin,
          y
        );

        y += 7;
      }

      function addParagraph(
        text: string,
        fontSize = 9
      ) {
        doc.setFontSize(fontSize);
        doc.setFont(
          "helvetica",
          "normal"
        );
        doc.setTextColor(
          75,
          85,
          99
        );

        const lines =
          doc.splitTextToSize(
            text,
            pageWidth -
              margin * 2
          );

        addPageIfNeeded(
          lines.length * 5 + 3
        );

        doc.text(
          lines,
          margin,
          y
        );

        y +=
          lines.length * 5 + 3;
      }

      function addLabelValue(
        label: string,
        value: string
      ) {
        addPageIfNeeded(8);

        doc.setFontSize(9);

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setTextColor(
          55,
          65,
          81
        );

        doc.text(
          `${label}:`,
          margin,
          y
        );

        const labelWidth =
          doc.getTextWidth(
            `${label}: `
          );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.text(
          value,
          margin +
            labelWidth,
          y
        );

        y += 6;
      }

      /* ========================================================
         HEADER
      ======================================================== */

      doc.setFillColor(
        238,
        242,
        255
      );

      doc.roundedRect(
        margin,
        y,
        pageWidth -
          margin * 2,
        36,
        4,
        4,
        "F"
      );

      doc.setTextColor(
        67,
        56,
        202
      );

      doc.setFontSize(23);
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "CareerPath",
        margin + 7,
        y + 12
      );

      doc.setTextColor(
        31,
        41,
        55
      );

      doc.setFontSize(15);

      doc.text(
        "Progress & Assessment Report",
        margin + 7,
        y + 22
      );

      doc.setFontSize(8);
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setTextColor(
        107,
        114,
        128
      );

      doc.text(
        `Generated ${formatDate(
          new Date().toISOString()
        )}`,
        pageWidth -
          margin -
          7,
        y + 12,
        {
          align: "right",
        }
      );

      y += 47;

      /* ========================================================
         PROFILE
      ======================================================== */

      addSectionTitle(
        "Profile"
      );

      addLabelValue(
        "Name",
        profile?.full_name ||
          "Not provided"
      );

      addLabelValue(
        "Email",
        user.email ||
          "Not provided"
      );

      addLabelValue(
        "Target Career",
        targetRole?.name ||
          "Not selected"
      );

      addLabelValue(
        "Experience Level",
        profile?.experience_level ||
          "Not provided"
      );

      y += 3;

      /* ========================================================
         PROGRESS SUMMARY
      ======================================================== */

      addSectionTitle(
        "Progress Summary"
      );

      autoTable(doc, {
        startY: y,

        head: [
          [
            "Area",
            "Result",
            "Completed",
            "In Progress",
          ],
        ],

        body: [
          [
            "Assessments",
            assessments.length > 0
              ? formatScore(
                  assessmentAverage
                )
              : "Not started",
            `${assessments.length}`,
            "—",
          ],

          [
            "Skills",
            assessedSkills.length >
            0
              ? formatScore(
                  averageSkillScore
                )
              : "Not assessed",
            `${assessedSkills.length}`,
            `${Math.max(
              0,
              skillGaps.length -
                assessedSkills.length
            )}`,
          ],

          [
            "Projects",
            projects.length > 0
              ? `${completedProjects}/${projects.length}`
              : "No projects",
            `${completedProjects}`,
            `${activeProjects}`,
          ],

          [
            "Learning",
            learningProgress.length >
            0
              ? `${completedLearning}/${learningProgress.length}`
              : "Not started",
            `${completedLearning}`,
            `${activeLearning}`,
          ],

          [
            "Certifications",
            certifications.length >
            0
              ? `${completedCertifications}/${certifications.length}`
              : "No certifications",
            `${completedCertifications}`,
            `${activeCertifications}`,
          ],
        ],

        theme: "grid",

        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [
            55,
            65,
            81,
          ],
        },

        headStyles: {
          fillColor: [
            79,
            70,
            229,
          ],
          textColor: [
            255,
            255,
            255,
          ],
          fontStyle:
            "bold",
        },

        alternateRowStyles: {
          fillColor: [
            248,
            250,
            252,
          ],
        },

        margin: {
          left: margin,
          right: margin,
        },
      });

      y =
        (doc as any)
          .lastAutoTable
          .finalY + 12;

      /* ========================================================
         ASSESSMENT HISTORY
      ======================================================== */

      addSectionTitle(
        "Assessment History"
      );

      if (
        assessments.length ===
        0
      ) {
        addParagraph(
          "No assessments have been completed yet."
        );
      } else {
        autoTable(doc, {
          startY: y,

          head: [
            [
              "Attempt",
              "Questions",
              "Correct",
              "Score",
              "Date",
            ],
          ],

          body: assessments.map(
            (
              assessment,
              index
            ) => [
              `#${
                assessments.length -
                index
              }`,
              assessment.total_questions,
              assessment.correct_answers,
              formatScore(
                Number(
                  assessment.score ||
                    0
                )
              ),
              formatDate(
                assessment.completed_at ||
                  assessment.started_at
              ),
            ]
          ),

          theme: "grid",

          styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [
              55,
              65,
              81,
            ],
          },

          headStyles: {
            fillColor: [
              79,
              70,
              229,
            ],
            textColor: [
              255,
              255,
              255,
            ],
            fontStyle:
              "bold",
          },

          alternateRowStyles: {
            fillColor: [
              248,
              250,
              252,
            ],
          },

          margin: {
            left: margin,
            right: margin,
          },
        });

        y =
          (doc as any)
            .lastAutoTable
            .finalY + 12;
      }

      /* ========================================================
         DETAILED ASSESSMENT BREAKDOWN
      ======================================================== */

      addSectionTitle(
        "Detailed Assessment Breakdown"
      );

      if (
        assessments.length ===
        0
      ) {
        addParagraph(
          "Detailed assessment information will appear here after you complete an assessment."
        );
      } else {
        for (
          let assessmentIndex = 0;
          assessmentIndex <
          assessments.length;
          assessmentIndex++
        ) {
          const assessment =
            assessments[
              assessmentIndex
            ];

          const answersForAttempt =
            assessmentAnswers.filter(
              (answer) =>
                answer.attempt_id ===
                assessment.id
            );

          const questionsForAttempt =
            answersForAttempt
              .map((answer) => {
                const question =
                  assessmentQuestions.find(
                    (item) =>
                      item.id ===
                      answer.question_id
                  );

                return {
                  answer,
                  question,
                };
              })
              .filter(
                (
                  item
                ): item is {
                  answer: AssessmentAnswer;
                  question: AssessmentQuestion;
                } =>
                  Boolean(
                    item.question
                  )
              );

          addPageIfNeeded(
            25
          );

          doc.setFillColor(
            248,
            250,
            252
          );

          doc.roundedRect(
            margin,
            y,
            pageWidth -
              margin * 2,
            20,
            3,
            3,
            "F"
          );

          doc.setFontSize(
            11
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setTextColor(
            31,
            41,
            55
          );

          doc.text(
            `Assessment #${
              assessments.length -
              assessmentIndex
            }`,
            margin + 5,
            y + 7
          );

          doc.setFontSize(
            8
          );

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setTextColor(
            107,
            114,
            128
          );

          doc.text(
            `${formatDate(
              assessment.completed_at ||
                assessment.started_at
            )}  •  ${
              assessment.correct_answers
            }/${
              assessment.total_questions
            } correct  •  ${formatScore(
              Number(
                assessment.score ||
                  0
              )
            )}`,
            margin + 5,
            y + 14
          );

          y += 27;

          if (
            questionsForAttempt.length ===
            0
          ) {
            addParagraph(
              "Question-level answer data is not available for this assessment."
            );

            continue;
          }

          for (
            let questionIndex = 0;
            questionIndex <
            questionsForAttempt.length;
            questionIndex++
          ) {
            const {
              answer,
              question,
            } =
              questionsForAttempt[
                questionIndex
              ];

            const questionNumber =
              questionIndex +
              1;

            const selectedText =
              getOptionText(
                question,
                answer.selected_option
              );

            const correctText =
              getOptionText(
                question,
                question.correct_option
              );

            const resultText =
              answer.is_correct
                ? "Correct"
                : "Incorrect";

            const questionLines =
              doc.splitTextToSize(
                `${questionNumber}. ${question.question}`,
                pageWidth -
                  margin * 2 -
                  6
              );

            const selectedLines =
              doc.splitTextToSize(
                `Your answer: ${answer.selected_option} — ${selectedText}`,
                pageWidth -
                  margin * 2 -
                  10
              );

            const correctLines =
              doc.splitTextToSize(
                `Correct answer: ${question.correct_option} — ${correctText}`,
                pageWidth -
                  margin * 2 -
                  10
              );

            const explanationText =
              question.explanation
                ? `Explanation: ${question.explanation}`
                : "Explanation: Not provided.";

            const explanationLines =
              doc.splitTextToSize(
                explanationText,
                pageWidth -
                  margin * 2 -
                  10
              );

            const blockHeight =
              questionLines.length *
                4.5 +
              selectedLines.length *
                4.5 +
              correctLines.length *
                4.5 +
              explanationLines.length *
                4.5 +
              18;

            addPageIfNeeded(
              Math.min(
                blockHeight,
                45
              )
            );

            doc.setDrawColor(
              229,
              231,
              235
            );

            doc.roundedRect(
              margin,
              y,
              pageWidth -
                margin * 2,
              Math.min(
                blockHeight,
                pageHeight -
                  y -
                  20
              ),
              3,
              3,
              "S"
            );

            let questionY =
              y + 6;

            doc.setFontSize(
              9.5
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setTextColor(
              31,
              41,
              55
            );

            doc.text(
              questionLines,
              margin + 4,
              questionY
            );

            questionY +=
              questionLines.length *
                4.5 +
              3;

            doc.setFontSize(
              8.5
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setTextColor(
              75,
              85,
              99
            );

            doc.text(
              selectedLines,
              margin + 5,
              questionY
            );

            questionY +=
              selectedLines.length *
                4.5 +
              2;

            doc.text(
              correctLines,
              margin + 5,
              questionY
            );

            questionY +=
              correctLines.length *
                4.5 +
              2;

            doc.setFontSize(
              8
            );

            doc.setTextColor(
              answer.is_correct
                ? 22
                : 185,
              answer.is_correct
                ? 101
                : 28,
              answer.is_correct
                ? 52
                : 28
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.text(
              `Result: ${resultText}`,
              margin + 5,
              questionY
            );

            questionY +=
              5;

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setTextColor(
              75,
              85,
              99
            );

            doc.text(
              explanationLines,
              margin + 5,
              questionY
            );

            y +=
              blockHeight + 5;

            if (
              y >
              pageHeight - 25
            ) {
              doc.addPage();
              y = 18;
            }
          }

          y += 5;
        }
      }

      /* ========================================================
         SKILL ANALYSIS
      ======================================================== */

      addSectionTitle(
        "Skill Assessment & Gap Analysis"
      );

      if (
        skillGaps.length ===
        0
      ) {
        addParagraph(
          "No skill gap information is available yet."
        );
      } else {
        autoTable(doc, {
          startY: y,

          head: [
            [
              "Skill",
              "Your Score",
              "Required",
              "Gap",
              "Status",
            ],
          ],

          body: skillGaps.map(
            (skill) => [
              skill.skill_name,

              skill.skill_score !==
                null &&
              skill.skill_score !==
                undefined
                ? formatScore(
                    Number(
                      skill.skill_score
                    )
                  )
                : "Not assessed",

              skill.required_level !==
                null &&
              skill.required_level !==
                undefined
                ? formatScore(
                    Number(
                      skill.required_level
                    )
                  )
                : "—",

              skill.skill_gap !==
                null &&
              skill.skill_gap !==
                undefined
                ? formatScore(
                    Math.max(
                      0,
                      Number(
                        skill.skill_gap
                      )
                    )
                  )
                : "—",

              skill.status ||
                "—",
            ]
          ),

          theme: "grid",

          styles: {
            fontSize: 8,
            cellPadding: 2.5,
            textColor: [
              55,
              65,
              81,
            ],
          },

          headStyles: {
            fillColor: [
              79,
              70,
              229,
            ],
            textColor: [
              255,
              255,
              255,
            ],
            fontStyle:
              "bold",
          },

          alternateRowStyles: {
            fillColor: [
              248,
              250,
              252,
            ],
          },

          margin: {
            left: margin,
            right: margin,
          },
        });

        y =
          (doc as any)
            .lastAutoTable
            .finalY + 10;

        if (
          assessedSkills.length >
          0
        ) {
          const strongest =
            [...assessedSkills].sort(
              (a, b) =>
                Number(
                  b.skill_score || 0
                ) -
                Number(
                  a.skill_score || 0
                )
            )[0];

          const weakest =
            [...assessedSkills].sort(
              (a, b) =>
                Number(
                  a.skill_score || 0
                ) -
                Number(
                  b.skill_score || 0
                )
            )[0];

          addLabelValue(
            "Strongest Assessed Skill",
            `${strongest.skill_name} — ${formatScore(
              Number(
                strongest.skill_score ||
                  0
              )
            )}`
          );

          addLabelValue(
            "Skill Requiring Most Attention",
            `${weakest.skill_name} — ${formatScore(
              Number(
                weakest.skill_score ||
                  0
              )
            )}`
          );

          y += 3;
        }
      }

      /* ========================================================
         PROJECT PROGRESS
      ======================================================== */

      addSectionTitle(
        "Project Progress"
      );

      if (
        projects.length ===
        0
      ) {
        addParagraph(
          "No recommended projects are currently available for the selected career."
        );
      } else {
        const projectRows =
          projects.map(
            (project) => {
              const progress =
                projectProgress.find(
                  (item) =>
                    item.project_id ===
                    project.id
                );

              const progressValue =
                Number(
                  progress?.progress ||
                    0
                );

              let status =
                "Not started";

              if (
                progress?.completed ===
                  true ||
                progressValue >=
                  100
              ) {
                status =
                  "Completed";
              } else if (
                progressValue >
                0
              ) {
                status =
                  "In progress";
              }

              return [
                project.title,
                project.difficulty ||
                  "—",
                `${Math.round(
                  progressValue
                )}%`,
                status,
              ];
            }
          );

        autoTable(doc, {
          startY: y,

          head: [
            [
              "Project",
              "Difficulty",
              "Progress",
              "Status",
            ],
          ],

          body: projectRows,

          theme: "grid",

          styles: {
            fontSize: 8.5,
            cellPadding: 3,
            textColor: [
              55,
              65,
              81,
            ],
          },

          headStyles: {
            fillColor: [
              79,
              70,
              229,
            ],
            textColor: [
              255,
              255,
              255,
            ],
            fontStyle:
              "bold",
          },

          alternateRowStyles: {
            fillColor: [
              248,
              250,
              252,
            ],
          },

          margin: {
            left: margin,
            right: margin,
          },
        });

        y =
          (doc as any)
            .lastAutoTable
            .finalY + 10;
      }

      /* ========================================================
         LEARNING PROGRESS
      ======================================================== */

      addSectionTitle(
        "Learning Progress"
      );

      if (
        learningProgress.length ===
        0
      ) {
        addParagraph(
          "No learning resources have been started yet."
        );
      } else {
        const learningRows =
          learningProgress.map(
            (item) => {
              const resourceId =
                item.learning_resource_id ??
                item.resource_id;

              const resource =
                learningResources.find(
                  (resource) =>
                    resource.id ===
                    resourceId
                );

              const progressValue =
                Number(
                  item.progress ||
                    0
                );

              let status =
                "Not started";

              if (
                item.completed ===
                  true ||
                progressValue >=
                  100
              ) {
                status =
                  "Completed";
              } else if (
                progressValue >
                0
              ) {
                status =
                  "In progress";
              }

              return [
                resource?.name ||
                  `Learning Resource #${
                    resourceId ||
                    "—"
                  }`,
                resource?.provider ||
                  "—",
                `${Math.round(
                  progressValue
                )}%`,
                status,
              ];
            }
          );

        autoTable(doc, {
          startY: y,

          head: [
            [
              "Resource",
              "Provider",
              "Progress",
              "Status",
            ],
          ],

          body: learningRows,

          theme: "grid",

          styles: {
            fontSize: 8,
            cellPadding: 2.5,
            textColor: [
              55,
              65,
              81,
            ],
          },

          headStyles: {
            fillColor: [
              79,
              70,
              229,
            ],
            textColor: [
              255,
              255,
              255,
            ],
            fontStyle:
              "bold",
          },

          alternateRowStyles: {
            fillColor: [
              248,
              250,
              252,
            ],
          },

          margin: {
            left: margin,
            right: margin,
          },
        });

        y =
          (doc as any)
            .lastAutoTable
            .finalY + 10;
      }

      /* ========================================================
         CERTIFICATION PROGRESS
      ======================================================== */

      addSectionTitle(
        "Certification Progress"
      );

      if (
        certifications.length ===
        0
      ) {
        addParagraph(
          "No certifications are currently available for the selected career."
        );
      } else {
        const certificationRows =
          certifications.map(
            (certification) => {
              const progress =
                certificationProgress.find(
                  (item) =>
                    item.certification_id ===
                    certification.id
                );

              const progressValue =
                Number(
                  progress?.progress ||
                    0
                );

              let status =
                "Not started";

              if (
                progress?.completed ===
                  true ||
                progressValue >=
                  100
              ) {
                status =
                  "Completed";
              } else if (
                progressValue >
                0
              ) {
                status =
                  "In progress";
              }

              return [
                certification.title,
                certification.provider ||
                  "—",
                `${Math.round(
                  progressValue
                )}%`,
                status,
              ];
            }
          );

        autoTable(doc, {
          startY: y,

          head: [
            [
              "Certification",
              "Provider",
              "Progress",
              "Status",
            ],
          ],

          body: certificationRows,

          theme: "grid",

          styles: {
            fontSize: 8.5,
            cellPadding: 3,
            textColor: [
              55,
              65,
              81,
            ],
          },

          headStyles: {
            fillColor: [
              79,
              70,
              229,
            ],
            textColor: [
              255,
              255,
              255,
            ],
            fontStyle:
              "bold",
          },

          alternateRowStyles: {
            fillColor: [
              248,
              250,
              252,
            ],
          },

          margin: {
            left: margin,
            right: margin,
          },
        });

        y =
          (doc as any)
            .lastAutoTable
            .finalY + 10;
      }

      /* ========================================================
         FINAL REPORT NOTE
      ======================================================== */

      addPageIfNeeded(
        35
      );

      doc.setFillColor(
        248,
        250,
        252
      );

      doc.roundedRect(
        margin,
        y,
        pageWidth -
          margin * 2,
        27,
        4,
        4,
        "F"
      );

      doc.setFontSize(
        10
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setTextColor(
        31,
        41,
        55
      );

      doc.text(
        "CareerPath Progress Report",
        margin + 6,
        y + 9
      );

      doc.setFontSize(
        8
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setTextColor(
        107,
        114,
        128
      );

      const note =
        "This report summarizes the progress, assessments, skill gaps, learning activity, projects, and certifications recorded in your CareerPath account at the time it was generated.";

      const noteLines =
        doc.splitTextToSize(
          note,
          pageWidth -
            margin * 2 -
            12
        );

      doc.text(
        noteLines,
        margin + 6,
        y + 16
      );

      /* ========================================================
         FOOTER ON EVERY PAGE
      ======================================================== */

      const totalPages =
        doc.getNumberOfPages();

      for (
        let page = 1;
        page <= totalPages;
        page++
      ) {
        doc.setPage(page);

        doc.setFontSize(
          8
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setTextColor(
          156,
          163,
          175
        );

        doc.text(
          "CareerPath",
          margin,
          pageHeight - 8
        );

        doc.text(
          `Page ${page} of ${totalPages}`,
          pageWidth -
            margin,
          pageHeight - 8,
          {
            align: "right",
          }
        );
      }

      /* ========================================================
         DOWNLOAD
      ======================================================== */

      const safeName =
        (
          profile?.full_name ||
          "Student"
        )
          .replace(
            /[^a-z0-9]/gi,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          )
          .toLowerCase();

      doc.save(
        `careerpath-${safeName}-progress-report.pdf`
      );
    } catch (error) {
      console.error(
        "Progress PDF generation error:",
        error
      );

      window.alert(
        "Unable to generate the progress report. Please try again."
      );
    } finally {
      setPdfLoading(false);
    }
  }

  /* ============================================================
     DELETE ACCOUNT
  ============================================================ */

  async function handleDeleteAccount() {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);

    /*
      IMPORTANT:
      Supabase Auth users should NOT be deleted directly
      from the browser using the service role key.

      A secure server-side account deletion endpoint
      should be implemented later.

      For now we sign the user out safely.
    */

    await supabase.auth.signOut();

    localStorage.clear();

    router.push("/login");
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] p-8 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <p className="text-gray-500">
              Loading settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ============================================================
     UI
  ============================================================ */

  return (
    <main className="min-h-screen bg-[#f8f9fc] p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Settings
          </h1>

          <p className="text-gray-500 mt-1">
            Manage your CareerPath account and preferences.
          </p>
        </div>

        {/* Account */}

        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Account
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Your account information.
          </p>

          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              value={email}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600"
            />
          </div>
        </section>

        {/* Change Password */}

        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Change Password
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            We will send a secure password-reset verification link
            to your registered email address.
          </p>

          {passwordMessage && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {passwordMessage}
            </div>
          )}

          {passwordError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {passwordError}
            </div>
          )}

          <button
            type="button"
            onClick={
              handleSendPasswordReset
            }
            disabled={
              passwordLoading
            }
            className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordLoading
              ? "Sending verification email..."
              : "Send Password Reset Email"}
          </button>
        </section>

        {/* Notifications */}

        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Choose which notifications you want to receive.
          </p>

          <div className="mt-5 space-y-5">

            {/* Email Notifications */}

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">
                  Email Notifications
                </p>

                <p className="text-sm text-gray-500">
                  Receive important CareerPath updates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const value =
                    !emailNotifications;

                  setEmailNotifications(
                    value
                  );

                  saveNotificationSetting(
                    "emailNotifications",
                    value
                  );
                }}
                className={`relative h-6 w-11 rounded-full transition ${
                  emailNotifications
                    ? "bg-indigo-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    emailNotifications
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Task Reminders */}

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">
                  Task Reminders
                </p>

                <p className="text-sm text-gray-500">
                  Get reminders for your learning tasks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const value =
                    !taskReminders;

                  setTaskReminders(
                    value
                  );

                  saveNotificationSetting(
                    "taskReminders",
                    value
                  );
                }}
                className={`relative h-6 w-11 rounded-full transition ${
                  taskReminders
                    ? "bg-indigo-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    taskReminders
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Progress Updates */}

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">
                  Progress Updates
                </p>

                <p className="text-sm text-gray-500">
                  Receive updates about your CareerPath progress.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const value =
                    !progressUpdates;

                  setProgressUpdates(
                    value
                  );

                  saveNotificationSetting(
                    "progressUpdates",
                    value
                  );
                }}
                className={`relative h-6 w-11 rounded-full transition ${
                  progressUpdates
                    ? "bg-indigo-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    progressUpdates
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

          </div>
        </section>

        {/* Progress Report */}

        <section className="bg-white border border-gray-200 rounded-2xl p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Your Progress Report
              </h2>

              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                Generate a detailed PDF containing your profile,
                complete assessment history, question-by-question
                answers, skill gaps, projects, learning progress,
                and certifications.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleDownloadProgressPDF
              }
              disabled={pdfLoading}
              className="shrink-0 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pdfLoading
                ? "Generating PDF..."
                : "Download Progress PDF"}
            </button>

          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Assessments
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                Full Breakdown
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Skills
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                Skill Gaps
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Projects
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                Progress
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Learning
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                Activity
              </p>
            </div>

          </div>
        </section>

        {/* Sign Out */}

        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Session
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Sign out of your CareerPath account.
          </p>

          <button
            type="button"
            onClick={
              handleSignOut
            }
            className="mt-5 rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Sign Out
          </button>
        </section>

        {/* Danger Zone */}

        <section className="bg-white border border-red-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-red-600">
            Danger Zone
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Account deletion is permanent.
          </p>

          <button
            type="button"
            onClick={
              handleDeleteAccount
            }
            disabled={
              deleteLoading
            }
            className="mt-5 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleteLoading
              ? "Signing out..."
              : "Delete Account"}
          </button>
        </section>

      </div>
    </main>
  );
}