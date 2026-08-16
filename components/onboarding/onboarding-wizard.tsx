"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { WidgetPreview } from "@/components/hendesk/widget-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { finishOnboardingAction } from "@/app/actions/onboarding";
import { checkKnowledgeSourceStatusAction } from "@/app/actions/knowledge"
import { KnowledgeIngestionForm } from "@/components/knowledge/knowledge-ingestion-form";
import { cn } from "@/lib/utils";
import { STEPS, AGENT_TEMPLATES, AVATAR_OPTIONS, COLOR_SWATCHES } from "./constants";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Eye,
  X,
  Sparkles,
  Link as LinkIcon,
  UploadCloud,
  ChevronRight,
  FileText,
  Loader2,
} from "lucide-react";

const onboardingSchema = z.object({
  agentName: z.string().min(2, "Agent name must be at least 2 characters"),
  agentRole: z.string().min(2, "Role description is required"),
  agentPrompt: z.string().min(10, "Provide a system prompt (at least 10 characters)"),
  avatarUrl: z.string().min(1, "Please select an avatar"),
  tone: z.enum(["Friendly", "Professional", "Concise", "Technical"], {
    errorMap: () => ({ message: "Please select a conversation tone" }),
  }),
  responseLength: z.enum(["Minimalist", "Standard", "Detailed"], {
    errorMap: () => ({ message: "Please select response length" }),
  }),
  greetingMsg: z.string().min(3, "Greeting message is required"),
  themeColor: z.string().min(1, "Please select a theme color"),
  position: z.enum(["right", "left"], {
    errorMap: () => ({ message: "Please select a position" }),
  }),
  sourceIds: z.array(z.string()).optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface OnboardingWizardProps {
  workspaceId: string;
}

export function OnboardingWizard({ workspaceId }: OnboardingWizardProps) {
  const { update: updateSession } = useSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [uploadedSources, setUploadedSources] = useState<{ id: string, type: string, title: string, status?: string }[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      agentName: "",
      agentRole: "",
      agentPrompt: "",
      avatarUrl: AVATAR_OPTIONS[0]?.url,
      tone: "Friendly",
      responseLength: "Minimalist",
      greetingMsg: "Hi 👋 How can we help today?",
      themeColor: "#4f46e5",
      position: "left",
      sourceIds: [],
    },
  });

  const formValues = watch();

  useEffect(() => {
    const activeSources = uploadedSources.filter((s) => !s.status || (s.status !== "completed" && s.status !== "failed"));
    if (activeSources.length === 0) return;

    const intervalId = setInterval(async () => {
      const idsToPoll = activeSources.map(s => s.id);
      const res = await checkKnowledgeSourceStatusAction(idsToPoll);
      if (res.success && res.sources) {
        const statusMap = new Map(res.sources.map((s) => [s.id, s.status]));
        activeSources.forEach((s) => {
          const newStatus = statusMap.get(s.id);
          if (newStatus && s.status !== newStatus) {
            if (newStatus === "completed") {
              toast.add({ title: "Processing Complete", description: `"${s.title}" is ready!`, type: "success" });
            } else if (newStatus === "failed") {
              toast.add({ title: "Processing Failed", description: `Failed to process "${s.title}".`, type: "error" });
            }
          }
        });

        setUploadedSources((prev) =>
          prev.map((s) => {
            const newStatus = statusMap.get(s.id);
            if (newStatus) {
              return { ...s, status: newStatus as any };
            }
            return s;
          })
        );
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [uploadedSources]);


  const handleTemplateSelect = (tmpl: typeof AGENT_TEMPLATES[0]) => {
    if (formValues.agentPrompt === tmpl.description) {
      setValue("agentRole", "");
      setValue("agentPrompt", "");
    } else {
      setValue("agentRole", tmpl.role);
      setValue("agentPrompt", tmpl.description);
    }
  };

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof OnboardingFormValues)[] = [];
    if (stepIndex === 0) {
      fieldsToValidate = ["agentName", "agentRole", "agentPrompt"];
    } else if (stepIndex === 1) {
      fieldsToValidate = ["avatarUrl", "tone", "responseLength"];
    } else if (stepIndex === 2) {
      fieldsToValidate = ["greetingMsg", "themeColor", "position"];
    }

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    if (isValid) {
      setStepIndex((s) => Math.min(STEPS.length - 1, s + 1));
    }
  };

  const onSubmit = async (data: OnboardingFormValues) => {

    // console.log({
    //   agentName: data.agentName,
    //   agentRole: data.agentRole,
    //   agentPrompt: data.agentPrompt,
    //   avatarUrl: data.avatarUrl,
    //   tone: data.tone,
    //   responseLength: data.responseLength,
    //   greetingMsg: data.greetingMsg,
    //   themeColor: data.themeColor,
    //   position: data.position,
    //   sourceIds: data.sourceIds,
    // })
    setIsFinishing(true);
    try {
      await finishOnboardingAction({
        agentName: data.agentName,
        agentRole: data.agentRole,
        agentPrompt: data.agentPrompt,
        avatarUrl: data.avatarUrl,
        tone: data.tone,
        responseLength: data.responseLength,
        greetingMsg: data.greetingMsg,
        themeColor: data.themeColor,
        position: data.position,
        sourceIds: data.sourceIds,
      });
      // Refresh the JWT so onboardingCompleted=true propagates to middleware
      await updateSession();
      // Redirect to the dashboard
      router.push("/dashboard");
    } catch (err) {
      toast.add({ title: "Error", description: "Failed to complete onboarding", type: "error" });
      setIsFinishing(false);
    }
  };

  const backendUrl = process.env.NEXT_PUBLIC_APP_URL;
  const scriptUrl = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
  const scriptSnippet = `<script src="${scriptUrl}" data-helpdesk-workspace-id="${workspaceId}" data-backend-url="${backendUrl}" defer></script>`;

  const copyScript = () => {
    navigator.clipboard.writeText(scriptSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-between font-sans">


      <div className="grid lg:grid-cols-[1fr_370px] gap-8 xl:gap-12 items-start flex-1">
        {/* ── Left Column: Form Builder ── */}
        <div className="space-y-6 sm:space-y-8 py-1 min-w-0">
          {/* Step Header */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
                Step {stepIndex + 1} of {STEPS.length}
              </span>
              <span className="text-[13px] font-medium text-foreground/40">
                • {STEPS[stepIndex].label}
              </span>
            </div>

            <h1 className="mt-3 text-[28px] sm:text-[34px] font-bold tracking-[-0.03em] leading-tight">
              {stepIndex === 0 && <>Setup Your <em className="font-display italic text-brand">AI Agent</em></>}
              {stepIndex === 1 && <>Configure <em className="font-display italic text-brand">AI Persona</em></>}
              {stepIndex === 2 && <>Customize <em className="font-display italic text-brand">Widget Style</em></>}
              {stepIndex === 3 && <>Train with <em className="font-display italic text-brand">Knowledge Base</em></>}
              {stepIndex === 4 && <>Deploy &amp; <em className="font-display italic text-brand">Install Widget</em></>}
            </h1>
            <p className="mt-2 text-[15px] text-foreground/50 leading-relaxed">
              {stepIndex === 0 && "Choose a ready-to-use template or describe your custom AI assistant."}
              {stepIndex === 1 && "Specify how your AI talks, acts, and identifies itself to website visitors."}
              {stepIndex === 2 && "Configure screen position, colors, and greeting messages."}
              {stepIndex === 3 && "Paste text guidelines or FAQs to train the AI."}
              {stepIndex === 4 && "Paste this 1-line snippet on your site to launch live support."}
            </p>
          </div>

          <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 0: Agent Identity */}
            {stepIndex === 0 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-3">
                  <Label className="text-[14px] font-semibold text-foreground/70">Select a pre-configured template</Label>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {AGENT_TEMPLATES.map((tmpl) => {
                      const isSelected = formValues.agentPrompt === tmpl.description;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleTemplateSelect(tmpl)}
                          className={cn(
                            "p-3.5 rounded-2xl border-2 hover:border-brand/50 text-left transition-all cursor-pointer flex flex-col justify-between group",
                            isSelected
                              ? "border-brand bg-brand/[0.04] ring-2 ring-brand/20 shadow-xs"
                              : "border-border/60 bg-card"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[20px]">{tmpl.icon}</span>
                            {isSelected && (
                              <span className="h-5 w-5 rounded-full bg-brand text-white grid place-items-center text-[10px]">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <div className="mt-2 font-bold text-[13.5px] text-foreground">{tmpl.title}</div>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setValue("agentRole", "");
                        setValue("agentPrompt", "");
                      }}
                      className={cn(
                        "p-3.5 rounded-2xl border-2 hover:border-brand/50 text-left transition-all cursor-pointer flex flex-col justify-between group",
                        (!formValues.agentPrompt || !AGENT_TEMPLATES.some(t => t.description === formValues.agentPrompt))
                          ? "border-brand bg-brand/[0.04] ring-2 ring-brand/20 shadow-xs"
                          : "border-border/60 bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[20px]">✨</span>
                        {(!formValues.agentPrompt || !AGENT_TEMPLATES.some(t => t.description === formValues.agentPrompt)) && (
                          <span className="h-5 w-5 rounded-full bg-brand text-white grid place-items-center text-[10px]">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="mt-2 font-bold text-[13.5px] text-foreground">Custom AI</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[13.5px] font-semibold">Agent Name</Label>
                    <Input
                      {...register("agentName")}
                      placeholder="Maya"
                      className="h-11 rounded-xl bg-background border-border/50 text-[14px]"
                    />
                    {errors.agentName && <p className="text-[12px] text-red-600">{errors.agentName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13.5px] font-semibold">Role Title</Label>
                    <Input
                      {...register("agentRole")}
                      placeholder="Customer Support Specialist"
                      className="h-11 rounded-xl bg-background border-border/50 text-[14px]"
                    />
                    {errors.agentRole && <p className="text-[12px] text-red-600">{errors.agentRole.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13.5px] font-semibold">System Description &amp; Instructions</Label>
                    <Textarea
                      {...register("agentPrompt")}
                      rows={4}
                      placeholder="Describe what the agent should do..."
                      className="rounded-xl bg-background border-border/50 text-[14px]"
                    />
                    {errors.agentPrompt && <p className="text-[12px] text-red-600">{errors.agentPrompt.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Voice & Tone */}
            {stepIndex === 1 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-3">
                  <Label className="text-[13.5px] font-semibold">Agent Avatar</Label>
                  <div className="flex flex-wrap gap-3">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setValue("avatarUrl", av.url)}
                        className={cn(
                          "p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center shadow-xs",
                          formValues.avatarUrl === av.url ? "border-brand bg-brand/5 ring-2 ring-brand/20 scale-105" : "border-border/60 bg-card hover:border-foreground/20"
                        )}
                        title={av.name}
                      >
                        <img src={av.url} alt={av.name} className="h-10 w-10 rounded-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Custom Robot Seed Field */}
                  <div className="pt-2 space-y-2">
                    <Label className="text-[12.5px] font-medium text-foreground/70">Or enter a custom robot seed / name</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="e.g. RoboSupport, R2D2, CyberBot"
                        className="h-10 rounded-xl bg-card text-[13.5px] border-border/60 max-w-sm"
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            setValue("avatarUrl", `https://api.dicebear.com/10.x/open-peeps/svg?seed=${encodeURIComponent(val)}`);
                          }
                        }}
                      />
                      {formValues.avatarUrl && !AVATAR_OPTIONS.some(a => a.url === formValues.avatarUrl) && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-brand bg-brand/5 text-[12.5px] font-semibold text-brand">
                          <img src={formValues.avatarUrl} alt="Custom Seed Preview" className="h-6 w-6 rounded-full" />
                          <span>Custom Avatar Active</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {errors.avatarUrl && <p className="text-[12px] text-red-600">{errors.avatarUrl.message}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13.5px] font-semibold">Conversation Tone</Label>
                    <Select value={formValues.tone} onValueChange={(val) => setValue("tone", val as any)}>
                      <SelectTrigger className="w-full h-11 rounded-xl text-[14px] bg-card border-border/60"><SelectValue placeholder="Select tone" /></SelectTrigger>
                      <SelectContent className="w-[var(--anchor-width)] min-w-[240px] rounded-xl p-1">
                        <SelectItem value="Friendly">Friendly &amp; Helpful</SelectItem>
                        <SelectItem value="Professional">Professional &amp; Crisp</SelectItem>
                        <SelectItem value="Concise">Concise &amp; Direct</SelectItem>
                        <SelectItem value="Technical">Technical Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.tone && <p className="text-[12px] text-red-600">{errors.tone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13.5px] font-semibold">Response Length</Label>
                    <Select value={formValues.responseLength} onValueChange={(val) => setValue("responseLength", val as any)}>
                      <SelectTrigger className="w-full h-11 rounded-xl text-[14px] bg-card border-border/60"><SelectValue placeholder="Select length" /></SelectTrigger>
                      <SelectContent className="w-[var(--anchor-width)] min-w-[240px] rounded-xl p-1">
                        <SelectItem value="Minimalist">Minimalist (1 sentence)</SelectItem>
                        <SelectItem value="Standard">Standard (2-3 sentences)</SelectItem>
                        <SelectItem value="Detailed">Detailed (4+ sentences)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.responseLength && <p className="text-[12px] text-red-600">{errors.responseLength.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Widget Appearance */}
            {stepIndex === 2 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-2">
                  <Label className="text-[13.5px] font-semibold">Greeting Message</Label>
                  <Input
                    {...register("greetingMsg")}
                    placeholder="Hi 👋 How can we help today?"
                    className="h-11 rounded-xl bg-card border-border/60 text-[14px]"
                  />
                  {errors.greetingMsg && <p className="text-[12px] text-red-600">{errors.greetingMsg.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[13.5px] font-semibold">Brand Theme Color</Label>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_SWATCHES.map((sw) => (
                      <button
                        key={sw.value}
                        type="button"
                        onClick={() => setValue("themeColor", sw.value)}
                        className={cn(
                          "h-10 w-10 rounded-full border-2 transition-all cursor-pointer grid place-items-center shadow-xs",
                          formValues.themeColor === sw.value ? "border-foreground scale-110 shadow-md" : "border-transparent"
                        )}
                        style={{ backgroundColor: sw.value }}
                      >
                        {formValues.themeColor === sw.value && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                    <div className="flex items-center gap-2 border border-border/60 rounded-xl px-2 py-1 bg-card">
                      <Input
                        type="color"
                        {...register("themeColor")}
                        className="h-8 w-10 p-0.5 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="font-mono text-[12px] font-medium uppercase text-foreground/60">{formValues.themeColor || "#000000"}</span>
                    </div>
                  </div>
                  {errors.themeColor && <p className="text-[12px] text-red-600">{errors.themeColor.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[13.5px] font-semibold">Screen Position</Label>
                  <input type="hidden" {...register("position")} />
                  <div className="grid grid-cols-2 gap-3">
                    {["right", "left"].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setValue("position", pos as any, { shouldValidate: true, shouldDirty: true })}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-center font-bold text-[13.5px] uppercase tracking-wider transition-all cursor-pointer",
                          formValues.position === pos ? "border-brand bg-brand/[0.04] text-brand" : "border-border/60 bg-card text-foreground/70 hover:border-foreground/20"
                        )}
                      >
                        Bottom {pos}
                      </button>
                    ))}
                  </div>
                  {errors.position && <p className="text-[12px] text-red-600">{errors.position.message}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Knowledge Base */}
            {stepIndex === 3 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-4">
                  {/* Display Uploaded Sources */}
                  {uploadedSources.length > 0 && (
                    <div className="space-y-2 mb-6">
                      <Label className="text-[13.5px] font-semibold">Added Sources ({uploadedSources.length})</Label>
                      <div className="space-y-2">
                        {uploadedSources.map((src, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card text-[13px]">
                            <div className="flex items-center gap-2">
                              {src.type === "text" && <Sparkles className="h-4 w-4 text-emerald" />}
                              {src.type === "url" && <LinkIcon className="h-4 w-4 text-amber" />}
                              {src.type === "file" && <UploadCloud className="h-4 w-4 text-brand" />}
                              <span className="font-medium truncate max-w-[200px]">{src.title}</span>
                            </div>
                            {src.status === "completed" ? (
                              <div className="flex items-center gap-1.5 bg-emerald/10 text-emerald px-2 py-1 rounded-md">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-[11px] uppercase tracking-wider font-semibold">Ready</span>
                              </div>
                            ) : src.status === "failed" ? (
                              <div className="flex items-center gap-1.5 bg-red-600/10 text-red-600 px-2 py-1 rounded-md">
                                <X className="h-3 w-3" />
                                <span className="text-[11px] uppercase tracking-wider font-semibold">Failed</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-brand/10 text-brand px-2 py-1 rounded-md">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-[11px] uppercase tracking-wider font-semibold">Processing...</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <KnowledgeIngestionForm
                      workspaceId={workspaceId}
                      onSuccess={(source) => {
                        const newIds = [...(formValues.sourceIds || []), source.id];
                        setValue("sourceIds", newIds);
                        setUploadedSources((prev) => [
                          ...prev,
                          {
                            id: source.id,
                            type: source.type,
                            title: source.title,
                            status: "processing",
                          },
                        ]);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Install & Launch */}
            {stepIndex === 4 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <Label className="text-[15px] font-bold">1-Line Embed Snippet</Label>
                <div className="rounded-2xl border border-border/50 bg-[#0b1020] text-slate-100 font-mono text-[12.5px] p-5 overflow-x-auto leading-relaxed shadow-inner">
                  <div className="text-slate-400">{"// Paste before </body> on your site"}</div>
                  <div className="mt-2 text-emerald-400 break-all">{scriptSnippet}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full h-11 px-6 border-2 font-semibold text-[13.5px] cursor-pointer bg-card"
                  onClick={copyScript}
                >
                  {copied ? <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald" /> Copied to Clipboard</> : <><Copy className="mr-2 h-4 w-4" /> Copy Embed Script</>}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* ── Right Column: Desktop Live Widget Preview ── */}
        <div className="hidden lg:block sticky top-24">
          <div className="text-[12px] font-bold uppercase tracking-wider text-foreground/35 mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald animate-pulse" /> Live Agent Preview
          </div>
          <WidgetPreview
            title={formValues.agentName}
            agentName={formValues.agentName}
            agentRole={formValues.agentRole}
            avatarUrl={formValues.avatarUrl}
            greeting={formValues.greetingMsg}
            themeColor={formValues.themeColor}
            buttonColor={formValues.themeColor}
          />
        </div>
      </div>

      {/* ── Bottom Action Navigation Bar ── */}
      <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
          disabled={stepIndex === 0}
          className="rounded-full h-12 px-6 font-semibold text-[15px] text-foreground/75 hover:bg-foreground/[0.04] cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4.5 w-4.5" /> Back
        </Button>

        {stepIndex < STEPS.length - 1 ? (
          <Button
            type="button"
            className="bg-brand text-brand-foreground hover:bg-brand/85 rounded-full h-12 px-8 font-semibold text-[15.5px] shadow-md shadow-brand/15 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={handleNextStep}
          >
            Next
            <ArrowRight className="ml-2 h-4.5 w-4.5" />
          </Button>
        ) : (
          <Button
            type="submit"
            form="onboarding-form"
            disabled={isFinishing}
            className="bg-brand text-brand-foreground hover:bg-brand/85 rounded-full h-12 px-9 font-semibold text-[15.5px] shadow-md shadow-brand/15 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            {isFinishing ? (
              <><Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" /> Launching...</>
            ) : (
              <>Create AI Agent &amp; Launch <ArrowRight className="ml-2 h-4.5 w-4.5" /></>
            )}
          </Button>
        )}
      </div>

      {/* ── Mobile Live Preview Sheet / Modal ── */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in-0 duration-200">
          <div className="bg-background rounded-t-3xl p-5 border-t border-border/60 max-h-[85vh] overflow-y-auto flex flex-col items-center shadow-2xl">
            <div className="w-full flex items-center justify-between mb-4">
              <div className="text-[13px] font-bold uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald animate-pulse" /> Live Agent Preview
              </div>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="h-8 w-8 rounded-full bg-muted grid place-items-center text-foreground/60 hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <WidgetPreview
              title={formValues.agentName || "Agent Name"}
              agentName={formValues.agentName || "Agent"}
              agentRole={formValues.agentRole || "Support"}
              avatarUrl={formValues.avatarUrl || "https://api.dicebear.com/10.x/open-peeps/svg?seed=fallback"}
              greeting={formValues.greetingMsg || "Hello! How can I help?"}
              themeColor={formValues.themeColor || "#4f46e5"}
              buttonColor={formValues.themeColor || "#4f46e5"}
            />

            <Button
              onClick={() => setShowMobilePreview(false)}
              className="w-full mt-4 bg-brand text-white rounded-full h-11 font-semibold text-[14px]"
            >
              Done Previewing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
