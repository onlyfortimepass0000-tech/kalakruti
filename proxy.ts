import { NextResponse, type NextRequest } from "next/server";
import { isValidSession, SESSION_COOKIE } from "./lib/auth";

export function proxy(request: NextRequest) {
  if (isValidSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Cron and webhook routes authenticate themselves with their own secrets.
  matcher: ["/((?!login|api/cron|api/webhooks|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
