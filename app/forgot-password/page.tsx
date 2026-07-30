import Link from "next/link";
import { HelpdeskLogo } from "@/components/hendesk/logo";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_260)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block"><HelpdeskLogo /></Link>
        <h2 className="mt-6 text-[28px] font-bold tracking-tight text-foreground">
          Reset your <em className="font-display not-italic italic text-brand">password</em>
        </h2>
        <p className="mt-2 text-[14px] text-foreground/50">
          Enter your email and we'll send you a code to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <ForgotPasswordFlow />
      </div>
    </div>
  );
}
