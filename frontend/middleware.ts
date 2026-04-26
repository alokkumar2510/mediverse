/**
 * Next.js Edge Middleware — Route protection & role guards.
 *
 * Runs on every request BEFORE it hits the page.
 * Reads access token from Authorization header or localStorage cookie.
 *
 * Strategy:
 * - /dashboard, /xray, /ecg, etc. → require valid JWT (any role)
 * - /admin/* → require role=admin claim in JWT
 * - /(auth)/* → redirect to /dashboard if already authenticated
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Route categories ──────────────────────────────────────────────────────────

const PROTECTED_ROUTES = [
  "/dashboard",
  "/xray",
  "/ecg",
  "/skin",
  "/diabetes",
  "/prescription",
  "/symptoms",
  "/reports",
  "/settings",
  "/profile",
];

const ADMIN_ROUTES = ["/admin"];

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

// ── JWT payload decode (Edge-compatible, no Node.js crypto) ──────────────────

interface JwtPayload {
  sub: string;
  exp: number;
  type: string;
  role?: string;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payloadB64] = token.split(".");
    // Edge runtime supports atob
    const decoded = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

// ── Token extraction ──────────────────────────────────────────────────────────

function getTokenFromRequest(req: NextRequest): string | null {
  // Strategy 1: Authorization header (SSR / API calls)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Strategy 2: Cookie (set by the app after login)
  const cookie = req.cookies.get("mv_access_token");
  if (cookie?.value) return cookie.value;

  // Strategy 3: Custom header set by client
  const customHeader = req.headers.get("x-access-token");
  if (customHeader) return customHeader;

  return null;
}

// ── Middleware logic ──────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin     = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthPage  = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  const token   = getTokenFromRequest(req);
  const payload = token ? decodeJwt(token) : null;
  const valid   = payload !== null && !isExpired(payload) && payload.type === "access";

  // ── Already authenticated → redirect away from auth pages ─────────────────
  if (isAuthPage && valid) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ── Protected routes: require valid token ─────────────────────────────────
  if (isProtected && !valid) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname); // preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin routes: require role=admin ──────────────────────────────────────
  if (isAdmin) {
    if (!valid) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Read role from JWT — backend injects it in extra_claims
    const role = payload?.role ?? "user";
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url));
    }
  }

  return NextResponse.next();
}

// ── Matcher — only run middleware on app pages, skip static assets ────────────
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, icons, etc.)
     * - API routes (/api/*) — handled by FastAPI backend
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
