"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, KeyRound } from "lucide-react";
import { 
  requestPasswordResetAction, 
  verifyResetCodeAction, 
  resetPasswordAction 
} from "@/app/actions/auth";

export function ForgotPasswordFlow() {
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");
  
  // Form State
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setServerError("Please enter a valid email address.");
      return;
    }

    setServerError("");
    setLoading(true);

    try {
      const res = await requestPasswordResetAction(email);
      if (res.error) {
        setServerError(res.error);
      } else {
        setStep("verify");
        setResendCountdown(60);
      }
    } catch (err: any) {
      setServerError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setServerError("Please enter the 6-digit code.");
      return;
    }

    setServerError("");
    setLoading(true);

    try {
      const res = await verifyResetCodeAction(email, code);
      if (res.error) {
        setServerError(res.error);
      } else {
        setStep("reset");
      }
    } catch (err: any) {
      setServerError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setServerError("Password must be at least 6 characters long.");
      return;
    }

    setServerError("");
    setLoading(true);

    try {
      const res = await resetPasswordAction(email, code, newPassword);
      if (res.error) {
        setServerError(res.error);
        setLoading(false);
      } else {
        // Success - redirect to login
        window.location.href = "/login?reset_success=true";
      }
    } catch (err: any) {
      setServerError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-card py-8 px-6 sm:px-10 rounded-3xl border border-border/50 shadow-xl space-y-6">
      
      {serverError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-[13px] text-red-700 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{serverError}</span>
        </div>
      )}

      {step === "request" && (
        <form onSubmit={handleRequestCode} className="space-y-4 text-left">
          <div className="space-y-2">
            <Label className="text-[13.5px] font-semibold">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="pl-10 h-11 rounded-xl bg-background border-border/50 text-[14px]"
                required
              />
            </div>
            <p className="text-[11.5px] text-foreground/40 mt-1">We'll send a 6-digit verification code to this email.</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white hover:bg-brand/85 rounded-full h-11 text-[15px] font-semibold shadow-md shadow-brand/15 cursor-pointer transition-all mt-2"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
            ) : (
              <>Send Reset Code <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerifyCode} className="space-y-4 text-left">
          <div className="space-y-2">
            <Label className="text-[13.5px] font-semibold">Verification Code</Label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="pl-10 h-11 rounded-xl bg-background border-border/50 text-[14px] tracking-[0.25em] font-mono text-center"
                required
              />
            </div>
            <p className="text-[11.5px] text-foreground/40 mt-1">Enter the 6-digit code sent to {email}.</p>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white hover:bg-brand/85 rounded-full h-11 text-[15px] font-semibold shadow-md shadow-brand/15 cursor-pointer transition-all mt-2"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                <>Verify Code <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading || resendCountdown > 0}
              onClick={handleRequestCode}
              className="w-full rounded-full h-11 text-[14px] font-semibold cursor-pointer transition-all"
            >
              {resendCountdown > 0 
                ? `Resend available in ${resendCountdown}s` 
                : "Didn't receive it? Resend Code"}
            </Button>
          </div>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="space-y-4 text-left">
          <div className="space-y-2">
            <Label className="text-[13.5px] font-semibold">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="pl-10 h-11 rounded-xl bg-background border-border/50 text-[14px]"
                required
              />
            </div>
            <p className="text-[11.5px] text-foreground/40 mt-1">Must be at least 6 characters long.</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-full h-11 text-[15px] font-semibold shadow-md cursor-pointer transition-all mt-2"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
            ) : (
              <>Reset Password</>
            )}
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-border/40 text-center text-[13.5px] text-foreground/50">
        Remembered your password?{" "}
        <Link href="/login" className="font-bold text-brand hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
