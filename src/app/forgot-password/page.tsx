"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleForgotPassword(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);

        try {
            /*
            |--------------------------------------------------------------------------
            | Send password reset email
            |--------------------------------------------------------------------------
            */

            const { error: resetError } =
                await supabase.auth.resetPasswordForEmail(
                    email.trim(),
                    {
                        redirectTo:
                            `${window.location.origin}/reset-password`,
                    }
                );

            if (resetError) {
                throw resetError;
            }

            setSuccess(
                "If an account exists with this email, a password reset link has been sent."
            );
        } catch (err) {
            console.error(
                "Password reset error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to send password reset email."
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
                            Forgot your password?
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Enter your email and we'll send you a secure
                            password reset link.
                        </p>

                    </div>

                    <form
                        onSubmit={handleForgotPassword}
                        className="space-y-5"
                    >

                        <div>

                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Email Address
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                disabled={loading}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-sm text-red-700">
                                    {error}
                                </p>
                            </div>
                        )}

                        {success && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <p className="text-sm leading-6 text-emerald-700">
                                    {success}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? "Sending..."
                                : "Send Reset Link"}
                        </button>

                    </form>

                    <div className="mt-6 text-center">

                        <Link
                            href="/login"
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            ← Back to Sign In
                        </Link>

                    </div>

                </div>

            </div>
        </main>
    );
}