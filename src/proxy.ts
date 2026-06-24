import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    "/:path*",
    "/(api)/:path*",
    "/(auth)/:path*",
    "/dashboard/:path*",
    "/org/:path*",
  ],
  name: "proxy",
};

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-pathname", request.nextUrl.pathname);

  return NextResponse.next();
}
