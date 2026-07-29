"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUserAction } from "@/app/actions/auth";
import { ArrowRight, Lock, Mail, User, AlertCircle, Loader2 } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

type SignupSchemaType = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignupSchemaType) => {
    setServerError("");
    setLoading(true);

    try {
      const result = await registerUserAction({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        setServerError(result.error);
        setLoading(false);
        return;
      }

      // Automatically sign in with NextAuth credentials after registration
      const authRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: "/onboarding",
      });

      if (authRes?.error) {
        setServerError("Account created, but failed to log in automatically. Please log in.");
        setLoading(false);
      } else {
        window.location.href = "/onboarding";
      }
    } catch (err: any) {
      setServerError(err?.message || "An error occurred during sign up.");
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
          <Label className="text-[13.5px] font-semibold">Your Full Name</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
            <Input
              {...register("name")}
              type="text"
              placeholder="Alex Rivera"
              className="pl-10 h-11 rounded-xl bg-background border-border/50 text-[14px]"
            />
          </div>
          {errors.name && (
            <p className="text-[12px] font-medium text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-[13.5px] font-semibold">Work Email Address</Label>
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
          <Label className="text-[13.5px] font-semibold">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
            <Input
              {...register("password")}
              type="password"
              placeholder="••••••••••••"
              className="pl-10 h-11 rounded-xl bg-background border-border/50 text-[14px]"
            />
          </div>
          {errors.password ? (
            <p className="text-[12px] font-medium text-red-600">{errors.password.message}</p>
          ) : (
            <p className="text-[11.5px] text-foreground/40">Must be at least 6 characters long.</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white hover:bg-brand/85 rounded-full h-11 text-[15px] font-semibold shadow-md shadow-brand/15 cursor-pointer transition-all mt-2"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
          ) : (
            <>Get started free <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </form>

      <div className="pt-4 border-t border-border/40 text-center text-[13.5px] text-foreground/50">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-brand hover:underline">
          Log in here
        </Link>
      </div>
    </div>
  );
}
