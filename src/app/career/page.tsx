"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CareerRole = {
  id: string;
  name: string;
  description: string | null;
};

export default function CareerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [careers, setCareers] = useState<CareerRole[]>([]);
  const [selectedCareer, setSelectedCareer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCareers() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("career_roles")
        .select("id, name, description")
        .order("name");

      if (error) {
        console.error("Career loading error:", error);
        setError("Unable to load career roles.");
        setLoading(false);
        return;
      }

      setCareers(data ?? []);
      setLoading(false);
    }

    loadCareers();
  }, []);

  async function handleContinue() {
    if (!selectedCareer) {
      setError("Please select a career before continuing.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // 1. Check authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "You must be logged in before selecting a career."
        );
      }

      // 2. Find the selected career
      const selectedRole = careers.find(
        (career) => career.name === selectedCareer
      );

      if (!selectedRole) {
        throw new Error(
          "Unable to find the selected career."
        );
      }

      // 3. Save the career to the user's profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          target_role_id: Number(selectedRole.id),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.error(
          "Profile update error:",
          profileError
        );

        throw new Error(
          "Unable to save your career selection."
        );
      }

      // 4. Store the selected career locally for the next page
      sessionStorage.setItem(
        "selected_career",
        selectedRole.name
      );

      sessionStorage.setItem(
        "selected_career_id",
        selectedRole.id
      );

      // 5. Continue to assessment
      router.push(
        `/assessment?role=${encodeURIComponent(
          selectedRole.name
        )}`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your career."
      );

      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold text-indigo-600">
            CareerPath
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Choose your target career
          </h1>

          <p className="mt-2 max-w-2xl text-gray-500">
            Select the career you want to prepare for. We’ll use it
            to identify the skills you need and create your
            personalized roadmap.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading career roles...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-700">
              {error}
            </p>

            <p className="mt-1 text-sm text-red-600">
              Please try again.
            </p>
          </div>
        )}

        {/* Career Cards */}
        {!loading && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {careers.map((career) => {
                const isSelected =
                  selectedCareer === career.name;

                return (
                  <button
                    key={career.id}
                    type="button"
                    onClick={() => {
                      setSelectedCareer(career.name);
                      setError("");
                    }}
                    className={`rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2
                          className={`font-semibold ${
                            isSelected
                              ? "text-indigo-700"
                              : "text-gray-900"
                          }`}
                        >
                          {career.name}
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                          {career.description ||
                            "Build the skills and experience required for this career."}
                        </p>
                      </div>

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Continue */}
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedCareer || saving}
                className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${
                  selectedCareer && !saving
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {saving
                  ? "Saving..."
                  : "Continue to Skill Assessment →"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}