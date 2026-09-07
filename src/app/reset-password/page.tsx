"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] =
        useState(true);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function checkSession() {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                setError(
                    "This password reset link is invalid or has expired."
                );
            }

            setCheckingSession(false);
        }

        checkSession();
    }, [supabase]);

    async function handleResetPassword(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

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
            const { error: updateError } =
                await supabase.auth.updateUser({
                    password,
                });

            if (updateError) {
                throw updateError;
            }

            setSuccess(
                "Your password has been updated successfully."
            );

            setTimeout(() => {
                router.push("/login");
                router.refresh();
            }, 1500);
        } catch (err) {
            console.error(
                "Password update error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update your password."
            );
        } finally {
            setLoading(false);
        }
    }

    if (checkingSession) {
        return (
            <main className="min-h-screen bg-[#f8f9fc] px-6 py-10">
                <div className="mx-auto flex min-h-[90vh] max-w-md items-center">
                    <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Verifying password reset link...
                        </p>
                    </div>
                </div>
            </main>
        );
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
                            Set a new password
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Choose a new password for your account.
                        </p>

                    </div>

                    {error &&
                        !success && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-sm leading-6 text-red-700">
                                    {error}
                                </p>
                            </div>
                        )}

                    {success && (
                        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <p className="text-sm leading-6 text-emerald-700">
                                {success}
                            </p>
                        </div>
                    )}

                    {!error && (
                        <form
                            onSubmit={handleResetPassword}
                            className="space-y-5"
                        >

                            <div>

                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >
                                    New Password
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter new password"
                                    disabled={loading}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />

                            </div>

                            <div>

                                <label
                                    htmlFor="confirmPassword"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >
                                    Confirm New Password
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
                                    placeholder="Confirm new password"
                                    disabled={loading}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />

                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Updating..."
                                    : "Update Password"}
                            </button>

                        </form>
                    )}

                </div>

            </div>
        </main>
    );
}