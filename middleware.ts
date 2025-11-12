import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Protected routes that require authentication
  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/settings");

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Redirect logged-in users away from auth pages
  const isAuthPage =
    nextUrl.pathname === "/login" ||
    nextUrl.pathname === "/register";

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
