import { auth } from "@/lib/auth";
import type { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

export const proxy = auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth?.user;

  if (pathname.startsWith("/dashboard") && !isAuthed) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
