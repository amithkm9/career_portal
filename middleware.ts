import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the user is authenticated
  const protectedRoutes = ["/assessment", "/report", "/jobs", "/externship"]
  const counselorRoutes = ["/counselor"]
  const currentPath = req.nextUrl.pathname

  // Check if the path is a counselor route
  const isCounselorRoute = counselorRoutes.some((route) => currentPath.startsWith(route))

  if (!session) {
    // Redirect unauthenticated users to login
    if (protectedRoutes.includes(currentPath) || currentPath === "/coupon" || isCounselorRoute) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  } else {
    try {
      // Allow access to role selection page
      if (currentPath === "/role-selection") {
        return res
      }

      // Check if user is a counselor for counselor routes
      if (isCounselorRoute) {
        // Check if user exists in career_counselors table
        const { data: counselorData, error: counselorError } = await supabase
          .from("career_counselors")
          .select("id")
          .eq("id", session.user.id)
          .single()

        if (counselorError) {
          // Not a counselor with completed onboarding, redirect to role selection
          return NextResponse.redirect(new URL("/role-selection", req.url))
        }

        // Allow access to counselor routes
        return res
      }

      // If user is on the login, app-to-tap, coupon, or payments page, allow them to stay there
      if (
        currentPath === "/login" ||
        currentPath === "/app-to-tap" ||
        currentPath === "/coupon" ||
        currentPath === "/payments"
      ) {
        return res
      }

      // For student routes, check if they exist in profiles table
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("atp_done, payment_done")
        .eq("id", session.user.id)
        .single()

      if (error) {
        console.error("Error in middleware:", error)
        // If there's an error fetching the profile, redirect to role selection
        // This could be a new user who hasn't selected a role yet
        return NextResponse.redirect(new URL("/role-selection", req.url))
      }

      // Enforce the student flow
      // If ATP is not done, redirect to app-to-tap page
      if (!profile.atp_done && currentPath !== "/app-to-tap") {
        return NextResponse.redirect(new URL("/app-to-tap", req.url))
      }

      // If ATP is done but payment is not, redirect to coupon page first
      if (profile.atp_done && !profile.payment_done && currentPath !== "/coupon") {
        return NextResponse.redirect(new URL("/coupon", req.url))
      }
    } catch (error) {
      console.error("Error in middleware:", error)
      // If there's an error, allow the request to continue
      return res
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

