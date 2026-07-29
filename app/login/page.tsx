import { Suspense } from "react";
import Link from "next/link";
import { HelpdeskLogo } from "@/components/hendesk/logo";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_260)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block"><HelpdeskLogo /></Link>
        <h2 className="mt-6 text-[28px] font-bold tracking-tight text-foreground">
          Welcome back to <em className="font-display not-italic italic text-brand">Helpdesk</em>
        </h2>
        <p className="mt-2 text-[14px] text-foreground/50">
          Enter your email and password to access your dashboard.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={
          <div className="bg-card py-12 text-center rounded-3xl border border-border/50 shadow-xl">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-brand" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
