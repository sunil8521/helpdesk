"use client";

import { useForm } from "react-hook-form";
import { captureLeadAction } from "@/app/actions/leads";
import { Lock, MessageSquareText, Loader2 } from "lucide-react";

type Field = "name" | "email" | "phone";

type Props = {
  workspaceId: string;
  visitorId: string;
  requiredFields: string[];
  themeColor: string;
  buttonColor: string;
  onCaptured: () => void;
};

const LABELS: Record<Field, string> = {
  name: "Full name",
  email: "Email",
  phone: "Phone",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Strict phone validation: optional plus, followed by 7-15 digits
const PHONE_RE = /^\+?[0-9]{7,15}$/;

type FormData = {
  name: string;
  email: string;
  phone: string;
};

export function LeadCaptureForm({
  workspaceId,
  visitorId,
  requiredFields,
  themeColor,
  buttonColor,
  onCaptured,
}: Props) {
  // email is always required if the form is shown
  const fields = Array.from(new Set(["email", ...requiredFields])) as Field[];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await captureLeadAction({
        workspaceId,
        visitorId,
        email: data.email.trim(),
        name: data.name.trim() || undefined,
        phone: data.phone.trim() || undefined,
      });

      if (res.error) {
        setError("root", { type: "manual", message: res.error });
        return;
      }

      // Remember so we don't re-gate on the next open.
      try {
        localStorage.setItem(`helpdesk_lead_${workspaceId}`, "1");
      } catch {
        /* ignore storage errors (private mode) */
      }
      onCaptured();
    } catch (err) {
      setError("root", { type: "manual", message: "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="flex h-full flex-col justify-center bg-background p-6 overflow-y-auto">
      <div className="mx-auto w-full max-w-sm my-auto">
        <div className="flex flex-col items-center text-center">
          <span 
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
          >
            <MessageSquareText className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Before we start
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/50">
            Leave your details so we can follow up.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3.5">
          {fields.map((f) => {
            let validationOptions: any = { required: `${LABELS[f]} is required.` };
            if (f === "email") {
              validationOptions.pattern = { value: EMAIL_RE, message: "Please enter a valid email address." };
            } else if (f === "phone") {
              validationOptions.pattern = { value: PHONE_RE, message: "Please enter a valid phone number (7-15 digits)." };
              // We replace non-digits and dash before regex check usually, but react-hook-form does strict match
              // We will just enforce the strict regex on input for phone.
            }

            return (
              <div key={f}>
                <label
                  htmlFor={`lead-${f}`}
                  className="mb-1.5 block text-xs font-medium text-foreground/70"
                >
                  {LABELS[f]}
                </label>
                <input
                  id={`lead-${f}`}
                  type={f === "email" ? "email" : f === "phone" ? "tel" : "text"}
                  {...register(f, validationOptions)}
                  autoComplete={
                    f === "email"
                      ? "email"
                      : f === "phone"
                        ? "tel"
                        : "name"
                  }
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-transparent focus:ring-2"
                  style={{ "--tw-ring-color": buttonColor } as React.CSSProperties}
                />
                {errors[f] && (
                  <p className="mt-1 text-[11px] font-medium text-red-500">
                    {errors[f]?.message}
                  </p>
                )}
              </div>
            );
          })}

          {errors.root && (
            <p className="text-center text-xs font-medium text-red-500">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: buttonColor }}
          >
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...</> : "Start chatting"}
          </button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-foreground/40">
          <Lock className="h-3 w-3" />
          We'll only use this to follow up on your request.
        </p>
      </div>
    </div>
  );
}
