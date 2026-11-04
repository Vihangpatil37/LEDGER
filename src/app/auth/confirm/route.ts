import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // Sanitize next path to prevent open redirects
  const destination =
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
      ? next
      : "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Successfully authenticated via token hash, redirect to target destination
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = destination;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Token verification failed or parameters missing: redirect to login
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.search = "?error=invalid_or_expired_link";
  return NextResponse.redirect(redirectUrl);
}
