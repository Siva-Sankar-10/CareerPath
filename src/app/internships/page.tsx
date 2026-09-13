"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Clock3,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Building2,
  Sparkles,
  Globe2,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Internship = {
  id: number;
  title: string;
  company: string;
  description: string | null;
  location: string | null;
  work_mode: string | null;
  internship_type: string | null;
  duration: string | null;
  stipend: string | null;
  application_url: string;
  source: string | null;
  role_id: number | null;
  skills: string[] | null;
  difficulty: string | null;
  is_active: boolean;
  deadline: string | null;
  created_at?: string;
};

type Profile = {
  target_role_id: number | null;
};

type Role = {
  id: number;
  name: string;
};

type SkillGap = {
  skill_name: string;
  skill_score: number | null;
  required_level: number | null;
  skill_gap: number | null;
};

type Application = {
  internship_id: number;
  status: string;
};

type Source = {
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  badge: string;
};

const sources: Source[] = [
  {
    name: "LinkedIn",
    description: "Professional internship and entry-level opportunities.",
    url: "https://www.linkedin.com/jobs/search/?keywords=cybersecurity%20intern",
    icon: <BriefcaseBusiness size={20} />,
    badge: "Jobs",
  },
  {
    name: "Unstop",
    description: "Internships, challenges and student opportunities.",
    url: "https://unstop.com/internship",
    icon: <Globe2 size={20} />,
    badge: "Student",
  },
  {
    name: "Internshala",
    description: "Internships across technology and other career fields.",
    url: "https://internshala.com/internships/",
    icon: <GraduationCap size={20} />,
    badge: "Internships",
  },
  {
    name: "AICTE",
    description: "Internships available through the National Internship Portal.",
    url: "https://internship.aicte-india.org/",
    icon: <ShieldCheck size={20} />,
    badge: "Official",
  },
];

const locations = [
  "All Locations",
  "Chennai",
  "Bengaluru",
  "Hyderabad",
  "Remote",
];

function getSourceName(source: string | null) {
  if (!source) return "CareerPath";

  const value = source.toLowerCase();

  if (value.includes("linkedin")) return "LinkedIn";
  if (value.includes("unstop")) return "Unstop";
  if (value.includes("internshala")) return "Internshala";
  if (value.includes("aicte")) return "AICTE";

  return source;
}

function getCategory(internship: Internship) {
  const type = internship.internship_type?.toLowerCase() || "";
  const title = internship.title.toLowerCase();
  const skills = (internship.skills || []).join(" ").toLowerCase();
  const description = (internship.description || "").toLowerCase();

  if (
    type.includes("soc") ||
    type.includes("security operations") ||
    title.includes("soc") ||
    skills.includes("siem") ||
    description.includes("security operations")
  ) {
    return "SOC / Security Operations";
  }

  if (
    type.includes("penetration") ||
    type.includes("vapt") ||
    type.includes("ethical") ||
    title.includes("penetration") ||
    title.includes("vapt") ||
    title.includes("ethical hacking") ||
    description.includes("penetration testing")
  ) {
    return "VAPT / Ethical Hacking";
  }

  if (
    type.includes("network") ||
    title.includes("network") ||
    skills.includes("networking")
  ) {
    return "Networking";
  }

  if (
    type.includes("cloud") ||
    title.includes("cloud") ||
    skills.includes("cloud")
  ) {
    return "Cloud Security";
  }

  return "Cybersecurity";
}

function calculateMatch(
  internshipSkills: string[] | null,
  skillGaps: SkillGap[]
) {
  if (!internshipSkills || internshipSkills.length === 0) {
    return {
      percentage: 0,
      matched: [],
      missing: [],
    };
  }

  const userSkillNames = new Set(
    skillGaps
      .filter((item) => (item.skill_score ?? 0) > 0)
      .map((item) => item.skill_name.toLowerCase().trim())
  );

  const matched = internshipSkills.filter((skill) =>
    userSkillNames.has(skill.toLowerCase().trim())
  );

  const missing = internshipSkills.filter(
    (skill) => !userSkillNames.has(skill.toLowerCase().trim())
  );

  const percentage = Math.round(
    (matched.length / internshipSkills.length) * 100
  );

  return {
    percentage,
    matched,
    missing,
  };
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return null;

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getSourceUrl(source: string | null, fallback: string) {
  const name = getSourceName(source);

  const sourceMap: Record<string, string> = {
    LinkedIn:
      "https://www.linkedin.com/jobs/search/?keywords=cybersecurity%20intern",
    Unstop: "https://unstop.com/internship",
    Internshala: "https://internshala.com/internships/",
    AICTE: "https://internship.aicte-india.org/",
  };

  return sourceMap[name] || fallback;
}

export default function InternshipsPage() {
  const supabase = createClient();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [sourceFilter, setSourceFilter] = useState("All Sources");

  const [savingId, setSavingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "recommended" | "all" | "applications"
  >("recommended");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("target_role_id")
        .eq("id", user.id)
        .maybeSingle();

      const userProfile = profileData as Profile | null;

      setProfile(userProfile);

      let roleData: Role | null = null;

      if (userProfile?.target_role_id) {
        const { data } = await supabase
          .from("career_roles")
          .select("id, name")
          .eq("id", userProfile.target_role_id)
          .maybeSingle();

        roleData = data as Role | null;

        setRole(roleData);
      }

      /*
       * CareerPath now uses the Supabase internship table
       * for curated opportunities.
       *
       * External sources are displayed separately below.
       * No Jooble / Adzuna request is made here.
       */
      let internshipQuery = supabase
        .from("internships")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (userProfile?.target_role_id) {
        internshipQuery = internshipQuery.or(
          `role_id.eq.${userProfile.target_role_id},role_id.is.null`
        );
      }

      const { data: internshipData, error: internshipError } =
        await internshipQuery;

      if (internshipError) {
        console.error("Internship loading error:", internshipError);
      }

      setInternships((internshipData || []) as Internship[]);

      if (userProfile?.target_role_id) {
        const { data: gaps, error: gapError } = await supabase
          .from("user_skill_gaps")
          .select(
            "skill_name, skill_score, required_level, skill_gap"
          )
          .eq("user_id", user.id)
          .eq("role_id", userProfile.target_role_id)
          .order("skill_gap", { ascending: false });

        if (gapError) {
          console.error("Skill gap loading error:", gapError);
        }

        setSkillGaps((gaps || []) as SkillGap[]);
      }

      const { data: applicationData, error: applicationError } =
        await supabase
          .from("user_internship_applications")
          .select("internship_id, status")
          .eq("user_id", user.id);

      if (applicationError) {
        console.error(
          "Application loading error:",
          applicationError
        );
      }

      setApplications((applicationData || []) as Application[]);
    } catch (error) {
      console.error("Failed to load internships:", error);
    } finally {
      setLoading(false);
    }
  }

  function getApplication(internshipId: number) {
    return applications.find(
      (application) => application.internship_id === internshipId
    );
  }

  async function toggleSave(internship: Internship) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setSavingId(internship.id);

    try {
      const existing = getApplication(internship.id);

      if (existing?.status === "Saved") {
        await supabase
          .from("user_internship_applications")
          .delete()
          .eq("user_id", user.id)
          .eq("internship_id", internship.id);
      } else if (!existing) {
        await supabase
          .from("user_internship_applications")
          .insert({
            user_id: user.id,
            internship_id: internship.id,
            status: "Saved",
          });
      }

      await loadData();
    } catch (error) {
      console.error("Failed to save internship:", error);
    } finally {
      setSavingId(null);
    }
  }

  async function markApplied(internship: Internship) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const existing = getApplication(internship.id);

    try {
      const { error } = await supabase
        .from("user_internship_applications")
        .upsert(
          {
            user_id: user.id,
            internship_id: internship.id,
            status: "Applied",
            applied_at:
              existing?.status === "Applied"
                ? undefined
                : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,internship_id",
          }
        );

      if (error) {
        console.error("Application update error:", error);
      }

      window.open(
        getSourceUrl(
          internship.source,
          internship.application_url
        ),
        "_blank",
        "noopener,noreferrer"
      );

      await loadData();
    } catch (error) {
      console.error("Failed to mark internship as applied:", error);

      window.open(
        internship.application_url,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  const internshipsWithMatch = useMemo(() => {
    return internships.map((internship) => ({
      internship,
      match: calculateMatch(internship.skills, skillGaps),
      category: getCategory(internship),
      source: getSourceName(internship.source),
    }));
  }, [internships, skillGaps]);

  const filteredInternships = useMemo(() => {
    const query = search.trim().toLowerCase();

    return internshipsWithMatch.filter(
      ({ internship, source }) => {
        const matchesSearch =
          !query ||
          internship.title.toLowerCase().includes(query) ||
          internship.company.toLowerCase().includes(query) ||
          (internship.description || "")
            .toLowerCase()
            .includes(query) ||
          (internship.skills || []).some((skill) =>
            skill.toLowerCase().includes(query)
          );

        const matchesSource =
          sourceFilter === "All Sources" ||
          source === sourceFilter;

        let matchesLocation = true;

        if (location === "Chennai") {
          matchesLocation =
            internship.location
              ?.toLowerCase()
              .includes("chennai") ?? false;
        } else if (location === "Bengaluru") {
          matchesLocation =
            internship.location
              ?.toLowerCase()
              .includes("bengaluru") ||
            internship.location
              ?.toLowerCase()
              .includes("bangalore") ||
            false;
        } else if (location === "Hyderabad") {
          matchesLocation =
            internship.location
              ?.toLowerCase()
              .includes("hyderabad") ?? false;
        } else if (location === "Remote") {
          matchesLocation =
            internship.work_mode?.toLowerCase() === "remote" ||
            internship.location
              ?.toLowerCase()
              .includes("remote") ||
            false;
        }

        return (
          matchesSearch &&
          matchesSource &&
          matchesLocation
        );
      }
    );
  }, [
    internshipsWithMatch,
    search,
    sourceFilter,
    location,
  ]);

  const recommendedInternships = useMemo(() => {
    return [...internshipsWithMatch]
      .filter(({ internship }) => {
        if (!role) return true;

        return (
          internship.role_id === role.id ||
          internship.role_id === null
        );
      })
      .sort((a, b) => {
        if (b.match.percentage !== a.match.percentage) {
          return b.match.percentage - a.match.percentage;
        }

        return (
          new Date(
            b.internship.created_at || 0
          ).getTime() -
          new Date(
            a.internship.created_at || 0
          ).getTime()
        );
      })
      .slice(0, 6);
  }, [internshipsWithMatch, role]);

  const savedCount = applications.filter(
    (application) => application.status === "Saved"
  ).length;

  const appliedCount = applications.filter(
    (application) => application.status === "Applied"
  ).length;

  const interviewCount = applications.filter(
    (application) => application.status === "Interview"
  ).length;

  const selectedCount = applications.filter(
    (application) => application.status === "Selected"
  ).length;

  const displayItems =
    activeTab === "recommended"
      ? recommendedInternships
      : activeTab === "all"
        ? filteredInternships
        : filteredInternships.filter(
            ({ internship }) =>
              applications.some(
                (application) =>
                  application.internship_id ===
                  internship.id
              )
          );

  function renderInternshipCard({
    internship,
    match,
    category,
    source,
  }: {
    internship: Internship;
    match: ReturnType<typeof calculateMatch>;
    category: string;
    source: string;
  }) {
    const application = getApplication(internship.id);
    const deadline = formatDeadline(internship.deadline);

    return (
      <article
        key={internship.id}
        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
      >
        {/* Top */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 size={21} />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-6 text-slate-900">
                {internship.title}
              </h3>

              <p className="mt-0.5 text-sm font-medium text-slate-600">
                {internship.company}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleSave(internship)}
            disabled={savingId === internship.id}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50"
            title={
              application?.status === "Saved"
                ? "Remove saved internship"
                : "Save internship"
            }
          >
            {application?.status === "Saved" ? (
              <BookmarkCheck size={19} />
            ) : (
              <Bookmark size={19} />
            )}
          </button>
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            {category}
          </span>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {source}
          </span>

          {internship.work_mode && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {internship.work_mode}
            </span>
          )}

          {internship.difficulty && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              {internship.difficulty}
            </span>
          )}
        </div>

        {/* Description */}
        {internship.description && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
            {internship.description}
          </p>
        )}

        {/* Details */}
        <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
          {internship.location && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0" />
              <span>{internship.location}</span>
            </div>
          )}

          {internship.duration && (
            <div className="flex items-center gap-2">
              <Clock3 size={14} className="shrink-0" />
              <span>{internship.duration}</span>
            </div>
          )}

          {internship.stipend && (
            <div className="flex items-center gap-2">
              <BriefcaseBusiness
                size={14}
                className="shrink-0"
              />
              <span>{internship.stipend}</span>
            </div>
          )}

          {deadline && (
            <div className="flex items-center gap-2">
              <Clock3 size={14} className="shrink-0" />
              <span>Deadline: {deadline}</span>
            </div>
          )}
        </div>

        {/* Skill Match */}
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">
              Skill Match
            </span>

            <span className="text-sm font-bold text-indigo-600">
              {match.percentage}%
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${match.percentage}%`,
              }}
            />
          </div>

          {match.matched.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Matching skills
              </p>

              <div className="flex flex-wrap gap-1.5">
                {match.matched.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
                  >
                    <CheckCircle2 size={12} />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {match.missing.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Skills to strengthen
              </p>

              <div className="flex flex-wrap gap-1.5">
                {match.missing.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommendation */}
        {role && (
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <Sparkles
              size={14}
              className="mt-0.5 shrink-0 text-indigo-500"
            />

            <span>
              Recommended for your{" "}
              <strong className="text-slate-700">
                {role.name}
              </strong>{" "}
              career path based on skill alignment.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => toggleSave(internship)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {application?.status === "Saved" ? (
              <>
                <BookmarkCheck size={16} />
                Saved
              </>
            ) : (
              <>
                <Bookmark size={16} />
                Save
              </>
            )}
          </button>

          <button
            onClick={() => markApplied(internship)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            {application?.status === "Applied" ? (
              <>
                Applied
                <CheckCircle2 size={16} />
              </>
            ) : (
              <>
                View & Apply
                <ExternalLink size={15} />
              </>
            )}
          </button>
        </div>
      </article>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-64 rounded-lg bg-slate-200" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />

          <div className="mt-8 h-28 rounded-2xl bg-white border border-slate-200" />

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 rounded-2xl bg-white border border-slate-200"
              />
            ))}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-96 rounded-2xl bg-white border border-slate-200"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
              <BriefcaseBusiness size={17} />
              Career opportunities
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Internships
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Find internship opportunities that align with
              your career goal, skills and current learning
              journey.
            </p>

            {role && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                <Sparkles size={13} />
                Target role: {role.name}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
              <p className="text-lg font-bold text-slate-900">
                {internships.length}
              </p>
              <p className="text-[11px] text-slate-500">
                Opportunities
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
              <p className="text-lg font-bold text-slate-900">
                {savedCount}
              </p>
              <p className="text-[11px] text-slate-500">
                Saved
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
              <p className="text-lg font-bold text-slate-900">
                {appliedCount}
              </p>
              <p className="text-[11px] text-slate-500">
                Applied
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
              <p className="text-lg font-bold text-slate-900">
                {selectedCount}
              </p>
              <p className="text-[11px] text-slate-500">
                Selected
              </p>
            </div>
          </div>
        </div>

        {/* SOURCE HUB */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Find internships
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Explore opportunities from trusted internship and
              job platforms.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sources.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    {source.icon}
                  </div>

                  <ExternalLink
                    size={16}
                    className="text-slate-300 transition group-hover:text-indigo-500"
                  />
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {source.name}
                    </h3>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {source.badge}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    {source.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600">
                  Explore opportunities
                  <ChevronRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* SEARCH */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search internships, companies or skills..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
            >
              <option>All Sources</option>
              <option>LinkedIn</option>
              <option>Unstop</option>
              <option>Internshala</option>
              <option>AICTE</option>
            </select>

            <select
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
            >
              {locations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <button
              onClick={loadData}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </section>

        {/* TABS */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("recommended")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === "recommended"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Recommended for You
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === "all"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            All Opportunities
          </button>

          <button
            onClick={() => setActiveTab("applications")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === "applications"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            My Applications

            {applications.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px]">
                {applications.length}
              </span>
            )}
          </button>
        </div>

        {/* RECOMMENDATION INFO */}
        {activeTab === "recommended" && (
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Sparkles size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Recommended for your career path
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  CareerPath prioritizes internships related to
                  your selected role and compares available
                  internship skills with your current assessment
                  profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATION SUMMARY */}
        {activeTab === "applications" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              ["Saved", savedCount],
              ["Applied", appliedCount],
              ["Interview", interviewCount],
              ["Selected", selectedCount],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-2xl font-bold text-slate-900">
                  {value}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* OPPORTUNITIES */}
        <section className="mt-6">
          {displayItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <BriefcaseBusiness
                size={38}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No opportunities found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Try another source, location or search term.
                You can also explore the internship platforms
                above for additional current opportunities.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {displayItems.map((item) =>
                renderInternshipCard(item)
              )}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <div className="mt-10 flex flex-col items-center justify-center gap-2 pb-6 text-center text-xs text-slate-400 sm:flex-row">
          <span>
            CareerPath internship discovery
          </span>

          <ChevronRight size={13} />

          <span>
            Applications continue on the original platform
          </span>
        </div>
      </div>
    </main>
  );
}