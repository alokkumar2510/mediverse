/**
 * (auth) group layout — strips the main dashboard nav/footer.
 * All pages under (auth)/ get this minimal wrapper.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — MediVerse AI",
  description: "Secure access to your AI diagnostic platform.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen" role="main">
      {children}
    </main>
  );
}
