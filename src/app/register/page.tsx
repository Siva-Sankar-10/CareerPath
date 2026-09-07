"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
    const router = useRouter();
    const supabase = createClient();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleRegister(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!fullName.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }

        if (password.length < 6) {
            setError(
                "Password must contain at least 6 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const { data, error: signUpError } =
                await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        data: {
                            full_name: fullName.trim(),
                        },
                    },
                });

            if (signUpError) {
                throw signUpError;
            }

            if (data.session) {
                router.push("/career-selection");
                router.refresh();
                return;
            }

            setSuccess(
                "Account created successfully. Please check your email to verify your account."
            );
        } catch (err) {
            console.error("Registration error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create your account."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
            <div className="mx-auto flex min-h-[90vh] max-w-md items-center">

                <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

                    <div className="mb-8 text-center">

                        <p className="text-sm font-semibold text-indigo-600">
                            CareerPath
                        </p>

                        <h1 className="mt-2 text-3xl font-bold text-gray-900">
                            Create your account
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Start building your personalized career roadmap.
                        </p>

                    </div>

                    <form
                        onSubmit={handleRegister}
                        className="space-y-5"
                    >

                        {/* Full name */}

                        <div>
                            <label
                                htmlFor="fullName"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Full Name
                            </label>

                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(event) =>
                                    setFullName(event.target.value)
                                }
                                placeholder="Enter your full name"
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 autofill:text-gray-900"
                                disabled={loading}
                            />
                        </div>

                        {/* Email */}

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 autofill:text-gray-900"
                                disabled={loading}
                            />
                        </div>

                        {/* Password */}

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Create a password"
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 autofill:text-gray-900"
                                disabled={loading}
                            />
                        </div>

                        {/* Confirm password */}

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Confirm Password
                            </label>

                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Confirm your password"
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 autofill:text-gray-900"
                                disabled={loading}
                            />
                        </div>

                        {/* Error */}

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-sm text-red-700">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Success */}

                        {success && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <p className="text-sm text-emerald-700">
                                    {success}
                                </p>
                            </div>
                        )}

                        {/* Submit */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? "Creating account..."
                                : "Create Account"}
                        </button>

                    </form>

                    {/* Login */}

                    <div className="mt-6 text-center">

                        <p className="text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                Sign in
                            </Link>
                        </p>

                    </div>

                </div>

            </div>
        </main>
    );
}