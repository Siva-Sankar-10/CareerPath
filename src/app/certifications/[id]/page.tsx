"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  PlayCircle,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Certification = {
  id: number;
  role_id: number;
  title: string;
  provider: string | null;
  description: string | null;
  difficulty: string | null;
  estimated_hours: number | null;
  certification_url: string | null;
  skills_covered: string | null;
};

type Resource = {
  id: number;
  certification_id: number;
  title: string;
  provider: string | null;
  description: string | null;
  resource_type: string;
  difficulty: string | null;
  estimated_hours: number | null;
  resource_url: string | null;
  item_order: number;
};

type CertificationProgress = {
  id: number;
  certification_id: number;
  progress: number;
  completed: boolean;
  started_at: string | null;
  completed_at: string | null;
  credential_url: string | null;
};

export default function CertificationDetailPage() {
  const router = useRouter();
  const params = useParams();

  const certificationId = Number(params.id);

  const [certification, setCertification] =
    useState<Certification | null>(null);

  const [resources, setResources] = useState<Resource[]>([]);

  const [progressData, setProgressData] =
    useState<CertificationProgress | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCertification() {
      try {
        setLoading(true);
        setError("");

        if (!Number.isFinite(certificationId)) {
          setError("Invalid certification.");
          return;
        }

        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          router.push("/login");
          return;
        }

        /* ================================
           CERTIFICATION
        ================================= */

        const { data: certificationData, error: certificationError } =
          await supabase
            .from("certifications")
            .select(
              `
                id,
                role_id,
                title,
                provider,
                description,
                difficulty,
                estimated_hours,
                certification_url,
                skills_covered
              `
            )
            .eq("id", certificationId)
            .maybeSingle();

        if (certificationError) throw certificationError;

        if (!certificationData) {
          setError("Certification not found.");
          return;
        }

        setCertification(certificationData);

        /* ================================
           PREPARATION RESOURCES
        ================================= */

        const { data: resourceData, error: resourceError } =
          await supabase
            .from("certification_resources")
            .select(
              `
                id,
                certification_id,
                title,
                provider,
                description,
                resource_type,
                difficulty,
                estimated_hours,
                resource_url,
                item_order
              `
            )
            .eq("certification_id", certificationId)
            .order("item_order", { ascending: true });

        if (resourceError) throw resourceError;

        setResources(resourceData || []);

        /* ================================
           USER PROGRESS
        ================================= */

        const { data: userProgress, error: progressError } =
          await supabase
            .from("user_certification_progress")
            .select(
              `
                id,
                certification_id,
                progress,
                completed,
                started_at,
                completed_at,
                credential_url
              `
            )
            .eq("user_id", user.id)
            .eq("certification_id", certificationId)
            .maybeSingle();

        if (progressError) throw progressError;

        setProgressData(userProgress || null);
      } catch (err) {
        console.error("CERTIFICATION DETAIL ERROR:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load certification."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCertification();
  }, [certificationId, router]);

  /* ================================
     PROGRESS
  ================================= */

  const progress = Math.min(
    Math.max(progressData?.progress ?? 0, 0),
    100
  );

  const completed =
    progressData?.completed === true || progress >= 100;

  /* ================================
     RESOURCE GROUPS
     
     These match the actual
     certification_resources resource_type
     values used by CareerPath.
  ================================= */

  const groupedResources = useMemo(() => {
    const courses: Resource[] = [];
    const labs: Resource[] = [];
    const practiceTests: Resource[] = [];
    const other: Resource[] = [];

    resources.forEach((resource) => {
      const type = resource.resource_type
        ?.trim()
        .toLowerCase();

      if (
        type === "course" ||
        type === "learning path"
      ) {
        courses.push(resource);
      } else if (type === "lab") {
        labs.push(resource);
      } else if (
        type === "practice test" ||
        type === "practice"
      ) {
        practiceTests.push(resource);
      } else {
        other.push(resource);
      }
    });

    return {
      courses,
      labs,
      practiceTests,
      other,
    };
  }, [resources]);

  /* ================================
     START / CONTINUE
  ================================= */

  async function startPreparation() {
    try {
      setSaving(true);
      setError("");

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const existingProgress = progressData;

      const { data, error: upsertError } = await supabase
        .from("user_certification_progress")
        .upsert(
          {
            user_id: user.id,
            certification_id: certificationId,
            progress:
              existingProgress?.progress ??
              5,
            completed:
              existingProgress?.completed ??
              false,
            started_at:
              existingProgress?.started_at ??
              new Date().toISOString(),
            completed_at:
              existingProgress?.completed_at ??
              null,
            credential_url:
              existingProgress?.credential_url ??
              null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict:
              "user_id,certification_id",
          }
        )
        .select(
          `
            id,
            certification_id,
            progress,
            completed,
            started_at,
            completed_at,
            credential_url
          `
        )
        .single();

      if (upsertError) throw upsertError;

      setProgressData(data);

      setTimeout(() => {
        document
          .getElementById("preparation-path")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (err) {
      console.error("START CERTIFICATION ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start certification preparation."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ================================
     LOADING
  ================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading certification...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ================================
     ERROR
  ================================= */

  if (error || !certification) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() =>
              router.push("/certifications")
            }
            className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-indigo-600"
          >
            <ArrowLeft size={17} />
            Back to Certifications
          </button>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">
              Unable to load certification
            </p>

            <p className="mt-2 text-sm text-red-600">
              {error || "Certification not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const skills = certification.skills_covered
    ? certification.skills_covered
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">

        {/* ================================
            BACK
        ================================= */}

        <button
          onClick={() =>
            router.push("/certifications")
          }
          className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-indigo-600"
        >
          <ArrowLeft size={17} />
          Back to Certifications
        </button>

        {/* ================================
            HERO
        ================================= */}

        <section className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-3xl">

              <div className="flex items-start gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600">
                  {(
                    certification.provider ||
                    certification.title
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <p className="text-sm font-medium text-indigo-600">
                    {certification.provider ||
                      "Professional Certification"}
                  </p>

                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {certification.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">

                    {certification.difficulty && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        {certification.difficulty}
                      </span>
                    )}

                    {certification.estimated_hours && (
                      <span className="flex items-center gap-1.5">
                        <Clock3 size={15} />
                        {certification.estimated_hours} hours
                      </span>
                    )}

                    <span className="flex items-center gap-1.5">
                      <BookOpen size={15} />
                      {resources.length}{" "}
                      preparation{" "}
                      {resources.length === 1
                        ? "resource"
                        : "resources"}
                    </span>

                  </div>
                </div>

              </div>

              <p className="mt-6 text-sm leading-7 text-gray-500">
                {certification.description ||
                  "Prepare for this professional certification through a structured learning path, practical resources and assessment preparation."}
              </p>

              {skills.length > 0 && (
                <div className="mt-6">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Skills Covered
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                </div>
              )}

            </div>

            {/* ================================
                PROGRESS CARD
            ================================= */}

            <div className="w-full rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 lg:max-w-xs">

              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Preparation Progress
              </p>

              <p className="mt-3 text-4xl font-bold text-gray-900">
                {progress}%
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${
                    completed
                      ? "bg-green-500"
                      : "bg-indigo-600"
                  }`}
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-500">
                {completed
                  ? "Your preparation is marked as completed."
                  : progress > 0
                  ? "Continue working through your preparation path."
                  : "Start your certification preparation journey."}
              </p>

              <button
                onClick={startPreparation}
                disabled={saving}
                className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Starting..."
                  : progress > 0
                  ? "Continue Preparation"
                  : "Start Preparation"}
              </button>

            </div>

          </div>
        </section>

        {/* ================================
            PREPARATION OVERVIEW
        ================================= */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <OverviewCard
            icon={<Target size={20} />}
            title="Understand"
            description="Review the certification objectives and the skills covered by the certification."
          />

          <OverviewCard
            icon={<BookOpen size={20} />}
            title="Learn"
            description="Use the structured preparation resources to build the required knowledge."
          />

          <OverviewCard
            icon={<FlaskConical size={20} />}
            title="Practice"
            description="Apply your knowledge through practical exercises, labs and hands-on activities."
          />

          <OverviewCard
            icon={<Trophy size={20} />}
            title="Validate"
            description="Use practice assessments and review your readiness before attempting the exam."
          />

        </section>

        {/* ================================
            PREPARATION PATH
        ================================= */}

        <section
          id="preparation-path"
          className="mt-10"
        >

          <div>
            <p className="text-sm font-medium text-indigo-600">
              CareerPath Preparation Path
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Prepare step by step
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Follow the available preparation resources
              in order. Start with the fundamentals, build
              practical knowledge and validate your readiness.
            </p>
          </div>

          {/* ================================
              EMPTY
          ================================= */}

          {resources.length === 0 && (
            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-6">

              <p className="text-sm font-semibold text-amber-700">
                Preparation resources are being prepared.
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-600">
                No CareerPath preparation resources have
                been added to this certification yet.
              </p>

              {certification.certification_url && (
                <a
                  href={certification.certification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:text-indigo-600"
                >
                  Official Certification Information
                  <ExternalLink size={15} />
                </a>
              )}

            </div>
          )}

          {/* ================================
              COURSES
          ================================= */}

          {groupedResources.courses.length > 0 && (
            <ResourceSection
              title="Courses & Learning Paths"
              description="Build the knowledge required for the certification."
              icon={<BookOpen size={19} />}
              resources={groupedResources.courses}
              iconType="course"
            />
          )}

          {/* ================================
              LABS
          ================================= */}

          {groupedResources.labs.length > 0 && (
            <ResourceSection
              title="Practical Labs"
              description="Apply the concepts through hands-on practice."
              icon={<FlaskConical size={19} />}
              resources={groupedResources.labs}
              iconType="lab"
            />
          )}

          {/* ================================
              PRACTICE
          ================================= */}

          {groupedResources.practiceTests.length > 0 && (
            <ResourceSection
              title="Practice Tests"
              description="Validate your knowledge before attempting the official exam."
              icon={<ShieldCheck size={19} />}
              resources={groupedResources.practiceTests}
              iconType="test"
            />
          )}

          {/* ================================
              OTHER
          ================================= */}

          {groupedResources.other.length > 0 && (
            <ResourceSection
              title="Additional Resources"
              description="Additional preparation material related to this certification."
              icon={<GraduationCap size={19} />}
              resources={groupedResources.other}
              iconType="other"
            />
          )}

        </section>

        {/* ================================
            OFFICIAL EXAM
        ================================= */}

        <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  INDUSTRY CERTIFICATION
                </span>

              </div>

              <h2 className="mt-3 text-xl font-bold text-gray-900">
                Ready for the official certification?
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                CareerPath helps you prepare and track your
                progress. The official certification exam,
                registration and credential are managed by
                the certification provider.
              </p>

            </div>

            {certification.certification_url && (
              <a
                href={certification.certification_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Official Certification Page
                <ExternalLink size={16} />
              </a>
            )}

          </div>

        </section>

        {/* ================================
            COMPLETED
        ================================= */}

        {completed && (
          <section className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <CheckCircle2 size={22} />
              </div>

              <div>

                <h2 className="font-semibold text-gray-900">
                  Preparation completed
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  CareerPath has recorded this certification
                  preparation as 100% complete.
                </p>

                {progressData?.credential_url && (
                  <a
                    href={progressData.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
                  >
                    View Credential
                    <ExternalLink size={15} />
                  </a>
                )}

              </div>

            </div>

          </section>
        )}

      </div>
    </main>
  );
}

/* =========================================================
   OVERVIEW CARD
========================================================= */

function OverviewCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <p className="mt-4 text-sm font-semibold text-gray-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   RESOURCE SECTION
========================================================= */

function ResourceSection({
  title,
  description,
  icon,
  resources,
  iconType,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  resources: Resource[];
  iconType: "course" | "lab" | "test" | "other";
}) {
  return (
    <div className="mt-9">

      <div className="mb-4 flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>

        <div>

          <h3 className="font-semibold text-gray-900">
            {title}
          </h3>

          <p className="text-xs text-gray-500">
            {description}
          </p>

        </div>

      </div>

      <div className="space-y-4">

        {resources.map((resource, index) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            number={index + 1}
            icon={iconType}
          />
        ))}

      </div>

    </div>
  );
}

/* =========================================================
   RESOURCE CARD
========================================================= */

function ResourceCard({
  resource,
  number,
  icon,
}: {
  resource: Resource;
  number: number;
  icon: "course" | "lab" | "test" | "other";
}) {
  const iconElement =
    icon === "lab" ? (
      <FlaskConical size={19} />
    ) : icon === "test" ? (
      <ShieldCheck size={19} />
    ) : icon === "course" ? (
      <BookOpen size={19} />
    ) : (
      <GraduationCap size={19} />
    );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

        {/* NUMBER + ICON */}

        <div className="flex items-start gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sm font-semibold text-gray-500">
            {number}
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {iconElement}
          </div>

        </div>

        {/* CONTENT */}

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <h4 className="font-semibold text-gray-900">
              {resource.title}
            </h4>

            {resource.difficulty && (
              <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                {resource.difficulty}
              </span>
            )}

          </div>

          {resource.provider && (
            <p className="mt-1 text-xs font-medium text-indigo-600">
              {resource.provider}
            </p>
          )}

          {resource.description && (
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {resource.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">

            <span className="flex items-center gap-1.5">
              <PlayCircle size={14} />
              {resource.resource_type}
            </span>

            {resource.estimated_hours && (
              <span className="flex items-center gap-1.5">
                <Clock3 size={14} />
                {resource.estimated_hours} hrs
              </span>
            )}

          </div>

        </div>

        {/* OPEN */}

        {resource.resource_url && (
          <a
            href={resource.resource_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Open
            <ExternalLink size={15} />
          </a>
        )}

      </div>

    </div>
  );
}