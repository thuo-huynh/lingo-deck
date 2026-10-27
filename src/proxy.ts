import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only (cookie present). Real authorization happens in the data layer on every read/write.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("ld_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!login|about|privacy|share|api|_next/static|_next/image|offline.html|sw.js|manifest.webmanifest|icon|apple-icon|.*\\.png$).*)"],
};
