import Link from "next/link";
import { HelpdeskLogo } from "@/components/hendesk/logo";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_260)] flex flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block"><HelpdeskLogo /></Link>
        <h2 className="mt-4 sm:mt-6 text-[22px] sm:text-[28px] font-bold tracking-tight text-foreground">
          Create your <em className="font-display not-italic italic text-brand">Helpdesk</em> account
        </h2>
        <p className="mt-2 text-[14px] text-foreground/50">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}
