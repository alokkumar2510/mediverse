import Link from "next/link";
import { Metadata } from "next";
import { Activity, ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "404 — Page Not Found" };

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center text-center gap-6 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand shadow-xl shadow-primary/30">
        <Activity className="h-8 w-8 text-white" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-7xl font-extrabold gradient-text mb-2">404</p>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold gradient-brand text-white shadow-md shadow-primary/25"
      >
        <ArrowLeft className="h-4 w-4" /> Go Home
      </Link>
    </div>
  );
}