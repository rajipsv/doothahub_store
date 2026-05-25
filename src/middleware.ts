import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/edge-config";

const PROTECTED_PREFIXES = ["/account", "/admin", "/checkout"];
const ADMIN_PREFIX = "/admin";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth;

  if (!PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (path.startsWith(ADMIN_PREFIX) && session.user.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/checkout/:path*"],
};
