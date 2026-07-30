"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchemaType) => {
    setServerError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: values.email.toLowerCase().trim(),
        password: values.password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setServerError("Invalid email address or password.");
        setLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setServerError(err?.message || "An error occurred while logging in.");
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[13.5px] font-semibold">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
            <Input
              {...register("email")}
              type="email"
              placeholder="alex@company.com"
              className="pl-10 h-11 rounded-xl bg-background border-border/50 text-[14px]"
            />
          </div>
          {errors.email && (
            <p className="text-[12px] font-medium text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[13.5px] font-semibold">Password</Label>
            <Link href="/forgot-password" className="text-[12px] font-semibold text-brand hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
            <Input
              {...register("password")}
              type="password"
              placeholder="••••••••••••"
              className="pl-10 h-11 rounded-xl bg-background border-border/50 text-[14px]"
            />
          </div>
          {errors.password && (
            <p className="text-[12px] font-medium text-red-600">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white hover:bg-brand/85 rounded-full h-11 text-[15px] font-semibold shadow-md shadow-brand/15 cursor-pointer transition-all mt-2"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in…</>
          ) : (
            <>Sign in to Helpdesk <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </form>

      <div className="pt-4 border-t border-border/40 text-center text-[13.5px] text-foreground/50">
        Don't have an account yet?{" "}
        <Link href="/signup" className="font-bold text-brand hover:underline">
          Create free account
        </Link>
      </div>
    </div>
  );
}
