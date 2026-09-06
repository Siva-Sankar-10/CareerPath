import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  // Default destination
  let next = requestUrl.searchParams.get("next") || "";

  // Only allow internal paths
  if (next && !next.startsWith("/")) {
    next = "";
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`
    );
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Auth callback error:", exchangeError);

    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`
    );
  }

  // If this is a password recovery request,
  // send the user directly to the reset-password page.
  if (next === "/auth/reset-password") {
    return NextResponse.redirect(
      `${origin}/auth/reset-password`
    );
  }

  // Get the currently authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?error=user_not_found`
    );
  }

  // Check the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("target_role_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup error:", profileError);

    return NextResponse.redirect(
      `${origin}/login?error=profile_error`
    );
  }

  // Existing user:
  // Career already selected → Dashboard
  if (profile?.target_role_id) {
    return NextResponse.redirect(`${origin}/`);
  }

  // New user:
  // Career has not been selected yet
  return NextResponse.redirect(`${origin}/career`);
}