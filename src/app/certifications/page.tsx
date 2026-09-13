"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Lock,
  ShieldCheck,
  Sparkles,
  Trophy,
  Network,
  Terminal,
  Globe,
  BarChart3,
  Search,
  Siren,
  Code2,
  Cloud,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type CareerRole = {
  id: number;
  name: string;
};

type RoleSkill = {
  skill_id: number;
};

type Skill = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
};

type LearningResource = {
  id: number;
  skill_id: number;
  name: string;
  provider: string;
  difficulty: string | null;
  estimated_hours: number | null;
  description: string | null;
  resource_type: string | null;
  url: string | null;
  cost_type: string | null;
  credential_type: string | null;
  is_free: boolean;
  credential_url: string | null;
};

type LearningProgress = {
  learning_resource_id: number;
  progress: number;
  completed: boolean;
};

type Certification = {
  id: number;
  role_id: number;
  title: string;
  provider: string;
  description: string | null;
  difficulty: string | null;
  estimated_hours: number | null;
  certification_url: string | null;
  skills_covered: string | null;
  item_order: number | null;
};

type CertificationProgress = {
  certification_id: number;
  progress: number;
  completed: boolean;
};

type Topic = {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
};

/*
|--------------------------------------------------------------------------
| TOPIC DEFINITIONS
|--------------------------------------------------------------------------
|
| These topics are used to organize the resources automatically.
| Resources are mapped to a topic using their skill name/category.
|
*/

const TOPICS: Topic[] = [
  {
    key: "networking",
    title: "Networking & Infrastructure",
    description:
      "Build the networking foundations needed for security, infrastructure and enterprise environments.",
    icon: Network,
  },
  {
    key: "linux",
    title: "Linux & Operating Systems",
    description:
      "Learn Linux, operating-system concepts and command-line skills used in technical roles.",
    icon: Terminal,
  },
  {
    key: "security",
    title: "Cybersecurity Fundamentals",
    description:
      "Understand security concepts, threats, vulnerabilities and core defensive practices.",
    icon: ShieldCheck,
  },
  {
    key: "web",
    title: "Web Security",
    description:
      "Practice identifying and understanding common web application security vulnerabilities.",
    icon: Globe,
  },
  {
    key: "siem",
    title: "SIEM & Security Operations",
    description:
      "Develop practical skills in monitoring, log analysis, SIEM platforms and security operations.",
    icon: BarChart3,
  },
  {
    key: "threat",
    title: "Threat Detection & Intelligence",
    description:
      "Learn threat detection, threat hunting and intelligence-driven security analysis.",
    icon: Search,
  },
  {
    key: "incident",
    title: "Incident Response & Digital Forensics",
    description:
      "Build skills for investigating incidents, collecting evidence and responding to security events.",
    icon: Siren,
  },
  {
    key: "python",
    title: "Python for Cybersecurity",
    description:
      "Use Python programming to automate security tasks and build technical problem-solving skills.",
    icon: Code2,
  },
  {
    key: "cloud",
    title: "Cloud Security & Infrastructure",
    description:
      "Develop cloud and infrastructure knowledge relevant to modern technical careers.",
    icon: Cloud,
  },
  {
    key: "other",
    title: "Additional Skills",
    description:
      "Other skills and resources relevant to your selected career.",
    icon: GraduationCap,
  },
];

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

/*
|--------------------------------------------------------------------------
| DETERMINE TOPIC FROM SKILL
|--------------------------------------------------------------------------
*/

function getTopicKey(skill: Skill | undefined): string {
  if (!skill) return "other";

  const name = normalize(skill.name);
  const category = normalize(skill.category);

  /*
  |--------------------------------------------------------------------------
  | Networking
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("network") ||
    name.includes("ccna") ||
    name.includes("routing") ||
    name.includes("switching") ||
    name.includes("tcp") ||
    name.includes("ip")
  ) {
    return "networking";
  }

  /*
  |--------------------------------------------------------------------------
  | Linux
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("linux") ||
    name.includes("operating system") ||
    name.includes("unix") ||
    category.includes("operating")
  ) {
    return "linux";
  }

  /*
  |--------------------------------------------------------------------------
  | Web Security
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("web security") ||
    name.includes("web application") ||
    name.includes("owasp") ||
    name.includes("sql injection") ||
    name.includes("cross-site") ||
    name.includes("xss")
  ) {
    return "web";
  }

  /*
  |--------------------------------------------------------------------------
  | SIEM / Security Operations
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("siem") ||
    name.includes("log analysis") ||
    name.includes("security operations") ||
    name.includes("sentinel") ||
    name.includes("splunk") ||
    name.includes("kql")
  ) {
    return "siem";
  }

  /*
  |--------------------------------------------------------------------------
  | Threat Detection / Intelligence
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("threat detection") ||
    name.includes("threat intelligence") ||
    name.includes("threat hunting") ||
    name.includes("detection engineering") ||
    name.includes("malware")
  ) {
    return "threat";
  }

  /*
  |--------------------------------------------------------------------------
  | Incident Response / Forensics
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("incident response") ||
    name.includes("digital forensics") ||
    name.includes("forensics") ||
    name.includes("incident handling")
  ) {
    return "incident";
  }

  /*
  |--------------------------------------------------------------------------
  | Python
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("python") ||
    name.includes("programming") ||
    name.includes("scripting")
  ) {
    return "python";
  }

  /*
  |--------------------------------------------------------------------------
  | Security Fundamentals
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("security fundamental") ||
    name.includes("cybersecurity") ||
    name.includes("cyber security") ||
    name.includes("information security") ||
    name.includes("security fundamental")
  ) {
    return "security";
  }

  /*
  |--------------------------------------------------------------------------
  | Cloud
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("cloud") ||
    name.includes("aws") ||
    name.includes("azure") ||
    name.includes("gcp")
  ) {
    return "cloud";
  }

  /*
  |--------------------------------------------------------------------------
  | Category-based fallback
  |--------------------------------------------------------------------------
  */

  if (category.includes("network")) return "networking";

  if (
    category.includes("security operations") ||
    category.includes("soc")
  ) {
    return "siem";
  }

  if (
    category.includes("cybersecurity") ||
    category.includes("security")
  ) {
    return "security";
  }

  if (category.includes("cloud")) return "cloud";

  if (category.includes("programming")) return "python";

  return "other";
}

/*
|--------------------------------------------------------------------------
| CHECK FREE CREDENTIAL
|--------------------------------------------------------------------------
*/

function isFreeCredential(resource: LearningResource) {
  if (!resource.is_free) return false;

  const type = normalize(resource.credential_type);

  return (
    type !== "" &&
    type !== "none" &&
    type !== "no credential" &&
    type !== "n/a"
  );
}

/*
|--------------------------------------------------------------------------
| FREE LEARNING WITHOUT CREDENTIAL
|--------------------------------------------------------------------------
*/

function isFreeLearning(resource: LearningResource) {
  return resource.is_free && !isFreeCredential(resource);
}

/*
|--------------------------------------------------------------------------
| CREDENTIAL LABEL
|--------------------------------------------------------------------------
*/

function credentialLabel(type: string | null) {
  const normalized = normalize(type);

  if (normalized.includes("badge")) {
    return "Digital Badge";
  }

  if (normalized.includes("certificate")) {
    return "Certificate";
  }

  if (normalized === "") {
    return "Free Credential";
  }

  return type;
}

/*
|--------------------------------------------------------------------------
| CERTIFICATION TOPIC MATCHING
|--------------------------------------------------------------------------
|
| Industry certifications don't have a skill_id, so their skills_covered
| field is used to determine their topic.
|
*/

function getCertificationTopicKey(certification: Certification): string {
  const text = normalize(
    `${certification.title} ${certification.provider} ${
      certification.skills_covered || ""
    }`
  );

  if (
    text.includes("network") ||
    text.includes("ccna") ||
    text.includes("routing") ||
    text.includes("switching")
  ) {
    return "networking";
  }

  if (
    text.includes("linux") ||
    text.includes("operating system")
  ) {
    return "linux";
  }

  if (
    text.includes("web security") ||
    text.includes("web application") ||
    text.includes("owasp")
  ) {
    return "web";
  }

  if (
    text.includes("siem") ||
    text.includes("sentinel") ||
    text.includes("splunk") ||
    text.includes("log analysis") ||
    text.includes("security operations")
  ) {
    return "siem";
  }

  if (
    text.includes("threat detection") ||
    text.includes("threat intelligence") ||
    text.includes("threat hunting")
  ) {
    return "threat";
  }

  if (
    text.includes("incident response") ||
    text.includes("digital forensics") ||
    text.includes("forensics")
  ) {
    return "incident";
  }

  if (
    text.includes("python") ||
    text.includes("programming")
  ) {
    return "python";
  }

  if (
    text.includes("aws") ||
    text.includes("azure") ||
    text.includes("cloud")
  ) {
    return "cloud";
  }

  return "security";
}

type ResourceCardProps = {
  resource: LearningResource;
  progress: number;
};

function FreeCredentialCard({
  resource,
  progress,
}: ResourceCardProps) {
  const completed = progress >= 100;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            {normalize(resource.credential_type).includes("badge") ? (
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <Award className="h-5 w-5 text-emerald-600" />
            )}
          </div>

          {completed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              FREE
            </span>
          )}
        </div>

        <h3 className="mt-4 line-clamp-2 text-base font-semibold text-gray-900">
          {resource.name}
        </h3>

        <p className="mt-1 text-sm font-medium text-indigo-600">
          {resource.provider}
        </p>

        {resource.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-5 text-gray-500">
            {resource.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            {credentialLabel(resource.credential_type)}
          </span>

          {resource.estimated_hours ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
              <Clock className="h-3.5 w-3.5" />
              {resource.estimated_hours}h
            </span>
          ) : null}

          {resource.difficulty ? (
            <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
              {resource.difficulty}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-auto border-t border-emerald-100 bg-emerald-50/40 p-5">
        {progress > 0 && !completed && (
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-gray-500">Your progress</span>

              <span className="font-medium text-gray-700">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              {completed ? "Open Course" : "Start Free"}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {resource.credential_url && (
            <a
              href={resource.credential_url}
              target="_blank"
              rel="noopener noreferrer"
              title="View credential information"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 text-gray-600 transition hover:text-emerald-600"
            >
              <Award className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function FreeLearningCard({
  resource,
  progress,
}: ResourceCardProps) {
  const completed = progress >= 100;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-100 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
          <BookOpen className="h-5 w-5 text-indigo-600" />
        </div>

        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
          FREE
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-base font-semibold text-gray-900">
        {resource.name}
      </h3>

      <p className="mt-1 text-sm font-medium text-indigo-600">
        {resource.provider}
      </p>

      {resource.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-5 text-gray-500">
          {resource.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {resource.resource_type && (
          <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
            {resource.resource_type}
          </span>
        )}

        {resource.estimated_hours ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
            <Clock className="h-3.5 w-3.5" />
            {resource.estimated_hours}h
          </span>
        ) : null}

        {resource.difficulty && (
          <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
            {resource.difficulty}
          </span>
        )}
      </div>

      {progress > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-gray-500">Progress</span>

            <span className="font-medium text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-auto pt-5">
        {resource.url ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            {completed ? "Open Resource" : "Start Learning"}
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <div className="rounded-xl bg-gray-50 px-4 py-2.5 text-center text-sm text-gray-400">
            Resource link unavailable
          </div>
        )}
      </div>
    </div>
  );
}

function IndustryCertificationCard({
  certification,
  progress,
}: {
  certification: Certification;
  progress: number;
}) {
  const completed = progress >= 100;
  const started = progress > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
            <Trophy className="h-5 w-5 text-gray-700" />
          </div>

          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
            INDUSTRY
          </span>
        </div>

        <h3 className="mt-4 text-base font-semibold text-gray-900">
          {certification.title}
        </h3>

        <p className="mt-1 text-sm font-medium text-gray-600">
          {certification.provider}
        </p>

        {certification.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-5 text-gray-500">
            {certification.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {certification.difficulty && (
            <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
              {certification.difficulty}
            </span>
          )}

          {certification.estimated_hours ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
              <Clock className="h-3.5 w-3.5" />
              {certification.estimated_hours}h
            </span>
          ) : null}
        </div>

        {certification.skills_covered && (
          <p className="mt-4 line-clamp-2 text-xs leading-5 text-gray-500">
            <span className="font-medium text-gray-700">
              Skills:
            </span>{" "}
            {certification.skills_covered}
          </p>
        )}
      </div>

      <div className="mt-auto border-t border-gray-100 bg-gray-50/70 p-5">
        {started && (
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-gray-500">
                Preparation progress
              </span>

              <span className="font-medium text-gray-700">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gray-700"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <Link
          href={`/certifications/${certification.id}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {completed
            ? "View Certification"
            : started
              ? "Continue Preparation"
              : "View Preparation"}

          <ExternalLink className="h-4 w-4" />
        </Link>

        {certification.certification_url && (
          <a
            href={certification.certification_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
          >
            Official Certification Page
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function CertificationsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState<CareerRole | null>(null);

  const [skills, setSkills] = useState<Skill[]>([]);

  const [freeResources, setFreeResources] = useState<
    LearningResource[]
  >([]);

  const [learningProgress, setLearningProgress] = useState<
    LearningProgress[]
  >([]);

  const [certifications, setCertifications] = useState<
    Certification[]
  >([]);

  const [certProgress, setCertProgress] = useState<
    CertificationProgress[]
  >([]);

  const [filter, setFilter] = useState<
    "all" | "recommended" | "in-progress"
  >("all");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | PROFILE
      |--------------------------------------------------------------------------
      */

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("target_role_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setLoading(false);
        return;
      }

      if (!profile?.target_role_id) {
        setLoading(false);
        return;
      }

      const roleId = Number(profile.target_role_id);

      /*
      |--------------------------------------------------------------------------
      | ROLE
      |--------------------------------------------------------------------------
      */

      const { data: roleData, error: roleError } = await supabase
        .from("career_roles")
        .select("id, name")
        .eq("id", roleId)
        .single();

      if (roleError) {
        console.error("Role error:", roleError);
      }

      setRole(roleData || null);

      /*
      |--------------------------------------------------------------------------
      | ROLE SKILLS
      |--------------------------------------------------------------------------
      */

      const { data: roleSkills, error: roleSkillsError } =
        await supabase
          .from("role_skills")
          .select("skill_id")
          .eq("role_id", roleId);

      if (roleSkillsError) {
        console.error("Role skills error:", roleSkillsError);
      }

      const skillIds =
        roleSkills?.map((item: RoleSkill) =>
          Number(item.skill_id)
        ) || [];

      /*
      |--------------------------------------------------------------------------
      | SKILL INFORMATION
      |--------------------------------------------------------------------------
      */

      let skillData: Skill[] = [];

      if (skillIds.length > 0) {
        const { data: skillsResult, error: skillsError } =
          await supabase
            .from("skills")
            .select("id, name, description, category")
            .in("id", skillIds);

        if (skillsError) {
          console.error("Skills error:", skillsError);
        }

        skillData = (skillsResult || []) as Skill[];
      }

      setSkills(skillData);

      /*
      |--------------------------------------------------------------------------
      | FREE LEARNING RESOURCES
      |--------------------------------------------------------------------------
      */

      let resources: LearningResource[] = [];

      if (skillIds.length > 0) {
        const { data: resourceData, error: resourceError } =
          await supabase
            .from("learning_resources")
            .select(
              `
                id,
                skill_id,
                name,
                provider,
                difficulty,
                estimated_hours,
                description,
                resource_type,
                url,
                cost_type,
                credential_type,
                is_free,
                credential_url
              `
            )
            .in("skill_id", skillIds)
            .eq("is_free", true)
            .order("id", { ascending: true });

        if (resourceError) {
          console.error(
            "Learning resources error:",
            resourceError
          );
        }

        resources = (resourceData || []) as LearningResource[];
      }

      setFreeResources(resources);

      /*
      |--------------------------------------------------------------------------
      | LEARNING PROGRESS
      |--------------------------------------------------------------------------
      */

      const { data: progressData, error: progressError } =
        await supabase
          .from("user_learning_progress")
          .select(
            "learning_resource_id, progress, completed"
          )
          .eq("user_id", user.id);

      if (progressError) {
        console.error(
          "Learning progress error:",
          progressError
        );
      }

      setLearningProgress(
        (progressData || []) as LearningProgress[]
      );

      /*
      |--------------------------------------------------------------------------
      | INDUSTRY CERTIFICATIONS
      |--------------------------------------------------------------------------
      */

      const {
        data: certificationData,
        error: certificationError,
      } = await supabase
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
            skills_covered,
            item_order
          `
        )
        .eq("role_id", roleId)
        .order("item_order", { ascending: true });

      if (certificationError) {
        console.error(
          "Certification error:",
          certificationError
        );
      }

      setCertifications(
        (certificationData || []) as Certification[]
      );

      /*
      |--------------------------------------------------------------------------
      | CERTIFICATION PROGRESS
      |--------------------------------------------------------------------------
      */

      const {
        data: certificationProgressData,
        error: certificationProgressError,
      } = await supabase
        .from("user_certification_progress")
        .select(
          "certification_id, progress, completed"
        )
        .eq("user_id", user.id);

      if (certificationProgressError) {
        console.error(
          "Certification progress error:",
          certificationProgressError
        );
      }

      setCertProgress(
        (certificationProgressData || []) as CertificationProgress[]
      );
    } catch (error) {
      console.error(
        "Certifications page error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PROGRESS HELPERS
  |--------------------------------------------------------------------------
  */

  function getLearningProgress(resourceId: number) {
    return (
      learningProgress.find(
        (item) =>
          Number(item.learning_resource_id) ===
          Number(resourceId)
      )?.progress || 0
    );
  }

  function getCertificationProgress(certificationId: number) {
    return (
      certProgress.find(
        (item) =>
          Number(item.certification_id) ===
          Number(certificationId)
      )?.progress || 0
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FREE RESOURCES
  |--------------------------------------------------------------------------
  */

  const freeCredentials = useMemo(() => {
    return freeResources.filter(isFreeCredential);
  }, [freeResources]);

  const freeLearning = useMemo(() => {
    return freeResources.filter(isFreeLearning);
  }, [freeResources]);

  /*
  |--------------------------------------------------------------------------
  | TOPIC GROUPS
  |--------------------------------------------------------------------------
  */

  const topicGroups = useMemo(() => {
    return TOPICS.map((topic) => {
      const topicSkills = skills.filter(
        (skill) => getTopicKey(skill) === topic.key
      );

      const topicSkillIds = new Set(
        topicSkills.map((skill) => Number(skill.id))
      );

      const topicCredentials = freeCredentials.filter(
        (resource) =>
          topicSkillIds.has(Number(resource.skill_id))
      );

      const topicLearning = freeLearning.filter(
        (resource) =>
          topicSkillIds.has(Number(resource.skill_id))
      );

      const topicCertifications = certifications.filter(
        (certification) =>
          getCertificationTopicKey(certification) ===
          topic.key
      );

      return {
        ...topic,
        skills: topicSkills,
        credentials: topicCredentials,
        learning: topicLearning,
        certifications: topicCertifications,
      };
    }).filter(
      (topic) =>
        topic.credentials.length > 0 ||
        topic.learning.length > 0 ||
        topic.certifications.length > 0
    );
  }, [
    skills,
    freeCredentials,
    freeLearning,
    certifications,
  ]);

  /*
  |--------------------------------------------------------------------------
  | COUNTS
  |--------------------------------------------------------------------------
  */

  const completedFreeCredentialCount =
    freeCredentials.filter(
      (resource) =>
        getLearningProgress(resource.id) >= 100
    ).length;

  const inProgressIndustryCount =
    certifications.filter((certification) => {
      const progress = getCertificationProgress(
        certification.id
      );

      return progress > 0 && progress < 100;
    }).length;

  /*
  |--------------------------------------------------------------------------
  | FILTER INDUSTRY CERTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const filteredIndustryCertifications = useMemo(() => {
    if (filter === "recommended") {
      return certifications.slice(0, 3);
    }

    if (filter === "in-progress") {
      return certifications.filter((certification) => {
        const progress = getCertificationProgress(
          certification.id
        );

        return progress > 0 && progress < 100;
      });
    }

    return certifications;
  }, [certifications, certProgress, filter]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9fc]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-72 rounded-xl bg-gray-200" />

            <div className="h-36 rounded-3xl bg-gray-200" />

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 rounded-2xl bg-gray-200"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NO ROLE
  |--------------------------------------------------------------------------
  */

  if (!role) {
    return (
      <div className="min-h-screen bg-[#faf9fc] px-6 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Award className="mx-auto mb-4 h-12 w-12 text-indigo-500" />

          <h1 className="text-2xl font-semibold text-gray-900">
            Choose your career first
          </h1>

          <p className="mt-2 text-gray-500">
            Select a target career so CareerPath can organize
            your learning resources and credentials.
          </p>

          <Link
            href="/career"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Choose Career
          </Link>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#faf9fc]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
            <Award className="h-3.5 w-3.5" />
            Credentials & Career Growth
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Certifications & Credentials
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            Follow your career-specific topics, earn free credentials,
            strengthen your skills and explore professional certifications
            when you are ready.
          </p>

          <p className="mt-2 text-sm font-medium text-gray-700">
            Target role:{" "}
            <span className="text-indigo-600">
              {role.name}
            </span>
          </p>
        </div>

        {/* ======================================================
            FREE CREDENTIAL HERO
        ====================================================== */}

        <section className="mb-10 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Start with free credentials
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  Learn by Topic. Earn Credentials. Build Your Career.
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  CareerPath organizes your learning around the skills
                  required for your target role. Free certificates and
                  digital badges appear before paid industry certifications.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600">
                    {freeCredentials.length}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    Free credentials
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {completedFreeCredentialCount}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    Completed
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">
                    {topicGroups.length}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    Learning topics
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            TOPIC SECTIONS
        ====================================================== */}

        <div className="space-y-12">

          {topicGroups.map((topic, topicIndex) => {
            const TopicIcon = topic.icon;

            return (
              <section
                key={topic.key}
                className="scroll-mt-8"
              >
                {/* ----------------------------------------------
                    TOPIC HEADER
                ---------------------------------------------- */}

                <div className="mb-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                      <TopicIcon className="h-5 w-5 text-indigo-600" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                          Topic {topicIndex + 1}
                        </span>

                        {topic.credentials.length > 0 && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            {topic.credentials.length} FREE CREDENTIAL
                            {topic.credentials.length !== 1
                              ? "S"
                              : ""}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-1 text-xl font-bold text-gray-900">
                        {topic.title}
                      </h2>

                      <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ----------------------------------------------
                    FREE CREDENTIALS FIRST
                ---------------------------------------------- */}

                {topic.credentials.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-emerald-600" />

                      <h3 className="text-sm font-bold text-gray-900">
                        Free Certificates & Digital Badges
                      </h3>

                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        FREE
                      </span>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {topic.credentials.map((resource) => (
                        <FreeCredentialCard
                          key={resource.id}
                          resource={resource}
                          progress={getLearningProgress(
                            resource.id
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------
                    FREE LEARNING SECOND
                ---------------------------------------------- */}

                {topic.learning.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-600" />

                      <h3 className="text-sm font-bold text-gray-900">
                        Free Learning Resources
                      </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {topic.learning.map((resource) => (
                        <FreeLearningCard
                          key={resource.id}
                          resource={resource}
                          progress={getLearningProgress(
                            resource.id
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------
                    INDUSTRY CERTIFICATIONS LAST
                ---------------------------------------------- */}

                {topic.certifications.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-gray-700" />

                      <h3 className="text-sm font-bold text-gray-900">
                        Industry Certifications
                      </h3>

                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                        PROFESSIONAL
                      </span>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {topic.certifications.map(
                        (certification) => (
                          <IndustryCertificationCard
                            key={certification.id}
                            certification={certification}
                            progress={getCertificationProgress(
                              certification.id
                            )}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* ======================================================
            INDUSTRY CERTIFICATION FILTER
        ====================================================== */}

        {certifications.length > 0 && (
          <section className="mt-14 border-t border-gray-200 pt-10">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-gray-700" />

                  <h2 className="text-xl font-bold text-gray-900">
                    All Industry Certifications
                  </h2>
                </div>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                  Professional certification exams are kept separate from
                  free credentials. Some industry certification exams may
                  require payment.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    filter === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => setFilter("recommended")}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    filter === "recommended"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Recommended
                </button>

                <button
                  onClick={() => setFilter("in-progress")}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    filter === "in-progress"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  In Progress
                </button>
              </div>
            </div>

            {filteredIndustryCertifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-gray-300" />

                <h3 className="mt-4 font-semibold text-gray-900">
                  No certifications in this filter
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Try another filter or continue with the free
                  credentials above.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredIndustryCertifications.map(
                  (certification) => (
                    <IndustryCertificationCard
                      key={certification.id}
                      certification={certification}
                      progress={getCertificationProgress(
                        certification.id
                      )}
                    />
                  )
                )}
              </div>
            )}
          </section>
        )}

        {/* ======================================================
            HONEST CREDENTIAL NOTICE
        ====================================================== */}

        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                CareerPath keeps credentials honest
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Free learning does not automatically mean a free
                certificate. CareerPath only places a resource in the
                free credential section when its database identifies a
                certificate or digital badge for that resource.
                Professional certification exams remain separate.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================
            FOOTER STATS
        ====================================================== */}

        <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-500">
          <span>
            {topicGroups.length} learning topics
          </span>

          <span>•</span>

          <span>
            {freeCredentials.length} free credentials
          </span>

          <span>•</span>

          <span>
            {freeLearning.length} free learning resources
          </span>

          <span>•</span>

          <span>
            {inProgressIndustryCount} industry certifications in
            progress
          </span>
        </div>
      </div>
    </div>
  );
}