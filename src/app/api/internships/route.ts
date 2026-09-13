import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type JoobleJob = {
  id?: number | string;
  title?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  source?: string;
  type?: string;
  link?: string;
  company?: string;
  updated?: string;
};

type InternshipResult = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  work_mode: "Remote" | "On-site" | "Hybrid";
  internship_type: string;
  duration: string;
  stipend: string;
  application_url: string;
  source: string;
  source_url: string;
  role_id: number | null;
  skills: string[];
  skill_match: number;
  posted_at: string | null;
  is_live: boolean;
};

const ROLE_SEARCH_TERMS: Record<string, string[]> = {
  "Software Developer": [
    "Software Developer Intern",
    "Software Engineer Intern",
    "Software Development Intern",
  ],

  "Data Scientist": [
    "Data Science Intern",
    "Data Scientist Intern",
    "Machine Learning Intern",
  ],

  "AI/ML Engineer": [
    "AI Intern",
    "Machine Learning Intern",
    "Artificial Intelligence Intern",
  ],

  "Data Analyst": [
    "Data Analyst Intern",
    "Business Analyst Intern",
    "Data Analytics Intern",
  ],

  "Cybersecurity Analyst": [
    "Cyber Security Intern",
    "Cybersecurity Intern",
    "SOC Analyst Intern",
    "Information Security Intern",
    "Network Security Intern",
    "VAPT Intern",
    "Penetration Testing Intern",
  ],

  "Cloud Engineer": [
    "Cloud Engineer Intern",
    "Cloud Computing Intern",
    "Cloud Intern",
  ],

  "DevOps Engineer": [
    "DevOps Intern",
    "DevOps Engineer Intern",
    "Cloud DevOps Intern",
  ],

  "Network Engineer": [
    "Network Engineer Intern",
    "Networking Intern",
    "Network Security Intern",
  ],

  "Data Engineer": [
    "Data Engineer Intern",
    "Big Data Intern",
    "Data Engineering Intern",
  ],

  "UI/UX Designer": [
    "UI UX Intern",
    "UI Designer Intern",
    "UX Designer Intern",
  ],
};

const FALLBACK_TERMS = [
  "Technology Intern",
  "IT Intern",
];

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectWorkMode(
  title: string,
  description: string,
  location: string
): "Remote" | "On-site" | "Hybrid" {
  const text = normalizeText(
    `${title} ${description} ${location}`
  );

  if (
    text.includes("remote") ||
    text.includes("work from home") ||
    text.includes("wfh")
  ) {
    return "Remote";
  }

  if (
    text.includes("hybrid") ||
    text.includes("work from office and home")
  ) {
    return "Hybrid";
  }

  return "On-site";
}

function detectInternshipType(title: string, description: string) {
  const text = normalizeText(`${title} ${description}`);

  if (text.includes("part time") || text.includes("part-time")) {
    return "Part-time Internship";
  }

  if (text.includes("full time") || text.includes("full-time")) {
    return "Full-time Internship";
  }

  return "Internship";
}

function extractSkills(
  title: string,
  description: string,
  roleSkills: string[]
) {
  const text = normalizeText(`${title} ${description}`);

  return roleSkills.filter((skill) => {
    const normalizedSkill = normalizeText(skill);

    if (!normalizedSkill) {
      return false;
    }

    return text.includes(normalizedSkill);
  });
}

function calculateSkillMatch(
  matchedSkills: string[],
  totalSkills: number
) {
  if (!totalSkills) {
    return 0;
  }

  return Math.round(
    (matchedSkills.length / totalSkills) * 100
  );
}

function isInternship(title: string, description: string) {
  const text = normalizeText(`${title} ${description}`);

  const internshipKeywords = [
    "intern",
    "internship",
    "trainee",
    "student",
    "campus",
    "graduate intern",
  ];

  return internshipKeywords.some((keyword) =>
    text.includes(keyword)
  );
}

function deduplicate(
  internships: InternshipResult[]
) {
  const map = new Map<string, InternshipResult>();

  for (const internship of internships) {
    const key = [
      normalizeText(internship.title),
      normalizeText(internship.company),
      normalizeText(internship.location),
    ].join("|");

    const existing = map.get(key);

    if (!existing || internship.skill_match > existing.skill_match) {
      map.set(key, internship);
    }
  }

  return Array.from(map.values());
}

async function searchJooble(
  keywords: string,
  location: string
): Promise<JoobleJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY;

  if (!apiKey) {
    throw new Error("JOOBLE_API_KEY is not configured");
  }

  const response = await fetch(
    `https://in.jooble.org/api/${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keywords,
        location,
        page: 1,
        ResultOnPage: 20,
        SearchMode: 0,
        companysearch: false,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Jooble API returned ${response.status}`
    );
  }

  const data = await response.json();

  return Array.isArray(data?.jobs)
    ? data.jobs
    : [];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const roleIdParam =
      searchParams.get("role_id");

    const location =
      searchParams.get("location") ||
      "India";

    const search =
      searchParams.get("search") || "";

    const roleId = roleIdParam
      ? Number(roleIdParam)
      : null;

    if (!roleId || Number.isNaN(roleId)) {
      return NextResponse.json(
        {
          error: "role_id is required",
        },
        {
          status: 400,
        }
      );
    }

    const [
      roleResponse,
      roleSkillsResponse,
    ] = await Promise.all([
      supabase
        .from("career_roles")
        .select("id,name")
        .eq("id", roleId)
        .single(),

      supabase
        .from("role_skills")
        .select(
          `
            skill_id,
            skills (
              id,
              name
            )
          `
        )
        .eq("role_id", roleId),
    ]);

    if (roleResponse.error) {
      return NextResponse.json(
        {
          error: roleResponse.error.message,
        },
        {
          status: 500,
        }
      );
    }

    const roleName =
      roleResponse.data?.name || "";

    const roleSkills =
      (roleSkillsResponse.data || [])
        .map((item: any) => item.skills?.name)
        .filter(Boolean);

    const searchTerms =
      ROLE_SEARCH_TERMS[roleName] ||
      FALLBACK_TERMS;

    const queries = search
      ? [search]
      : searchTerms;

    const jobs: JoobleJob[] = [];

    for (const query of queries) {
      try {
        const results =
          await searchJooble(
            `${query} internship`,
            location
          );

        jobs.push(...results);
      } catch (error) {
        console.error(
          `Jooble search failed for "${query}"`,
          error
        );
      }
    }

    const normalized: InternshipResult[] =
      jobs
        .filter((job) =>
          isInternship(
            job.title || "",
            job.snippet || ""
          )
        )
        .map((job) => {
          const title =
            job.title || "Internship";

          const company =
            job.company || "Company not specified";

          const description =
            job.snippet || "";

          const jobLocation =
            job.location || "India";

          const matchedSkills =
            extractSkills(
              title,
              description,
              roleSkills
            );

          return {
            id: `jooble-${job.id || `${title}-${company}`}`,
            title,
            company,
            description,
            location: jobLocation,
            work_mode: detectWorkMode(
              title,
              description,
              jobLocation
            ),
            internship_type:
              detectInternshipType(
                title,
                description
              ),
            duration: "Not specified",
            stipend:
              job.salary || "Not specified",
            application_url:
              job.link || "",
            source:
              job.source || "Jooble",
            source_url:
              job.link || "",
            role_id: roleId,
            skills: matchedSkills,
            skill_match:
              calculateSkillMatch(
                matchedSkills,
                roleSkills.length
              ),
            posted_at:
              job.updated || null,
            is_live: true,
          };
        })
        .filter(
          (job) =>
            job.application_url.length > 0
        );

    const unique =
      deduplicate(normalized);

    unique.sort(
      (a, b) =>
        b.skill_match - a.skill_match
    );

    return NextResponse.json({
      success: true,
      role: {
        id: roleId,
        name: roleName,
      },
      location,
      source_count: 1,
      sources: ["Jooble"],
      total: unique.length,
      internships: unique.slice(0, 50),
      fetched_at:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Internship API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch internships",
      },
      {
        status: 500,
      }
    );
  }
}