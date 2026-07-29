"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/toast";
import { SettingsCard } from "./settings-card";
import { updateAgentSettingsAction } from "@/app/actions/settings";
import { Sparkles, CheckCircle2, Loader2, Cpu } from "lucide-react";

interface AISettingsCardProps {
  initialAgent: {
    id?: string;
    name: string;
    role: string;
    description: string;
    tone: "Friendly" | "Professional" | "Concise" | "Technical";
    responseLength: "Minimalist" | "Standard" | "Detailed";
    aiModel: string;
    temperature: number;
    confidenceThreshold: number;
    humanFallbackBehavior: "escalate" | "cannot";
  };
}

import { Input } from "@/components/ui/input";

export function AISettingsCard({ initialAgent }: AISettingsCardProps) {
  const router = useRouter();
  const [name, setName] = useState(initialAgent.name);
  const [role, setRole] = useState(initialAgent.role);
  const [description, setDescription] = useState(initialAgent.description);
  const [tone, setTone] = useState<"Friendly" | "Professional" | "Concise" | "Technical">(initialAgent.tone);
  const [responseLength, setResponseLength] = useState<"Minimalist" | "Standard" | "Detailed">(initialAgent.responseLength);
  const [temperature, setTemperature] = useState<number[]>([
    Math.round(initialAgent.temperature * 100),
  ]);
  const [confidence, setConfidence] = useState<number[]>([
    Math.round(initialAgent.confidenceThreshold * 100),
  ]);
  const [fallbackBehavior, setFallbackBehavior] = useState<"escalate" | "cannot">(
    initialAgent.humanFallbackBehavior
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveAISettings = async () => {
    setIsSaving(true);
    try {
      const res = await updateAgentSettingsAction({
        name,
        role,
        description,
        tone,
        responseLength,
        temperature: temperature[0] / 100,
        confidenceThreshold: confidence[0] / 100,
        humanFallbackBehavior: fallbackBehavior,
      });
      if (res.error) throw new Error(res.error);

      setSaved(true);
      toast.add({ title: "AI Parameters Saved", description: "Agent intelligence settings updated.", type: "success" });
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (err: any) {
      toast.add({ title: "Error", description: err?.message || "Failed to update AI settings", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsCard title="AI Engine Parameters" desc="Applies to all automated customer conversations and RAG retrieval" icon={Sparkles}>
      <div className="space-y-6">
        {/* Agent Name & Role */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13.5px] font-semibold">Agent Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya"
              className="h-11 rounded-xl bg-background border-border/50 text-[14px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13.5px] font-semibold">Agent Role</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Customer Support Specialist"
              className="h-11 rounded-xl bg-background border-border/50 text-[14px]"
            />
          </div>
        </div>

        {/* System Prompt / Description */}
        <div className="space-y-2">
          <Label className="text-[13.5px] font-semibold">System Prompt &amp; Instructions</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the agent's responsibilities, guidelines, and context..."
            className="w-full p-3 rounded-xl bg-background border border-border/50 text-[13.5px] leading-relaxed outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Tone & Response Length */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13.5px] font-semibold">Conversation Tone</Label>
            <Select
              value={tone}
              onValueChange={(val) => setTone(val as any)}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background border-border/50 text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Concise">Concise</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[13.5px] font-semibold">Response Detail Level</Label>
            <Select
              value={responseLength}
              onValueChange={(val) => setResponseLength(val as any)}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background border-border/50 text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="Minimalist">Minimalist</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LLM Model Provider */}
        <div className="space-y-2">
          <Label className="text-[13.5px] font-semibold">LLM Model Provider</Label>
          <div className="flex items-center gap-2.5 h-11 px-4 rounded-xl bg-muted/60 border border-border/40 w-fit">
            <Cpu className="h-4 w-4 text-brand" />
            <span className="font-semibold text-[13.5px] text-foreground">
              {initialAgent.aiModel || "Gemini 2.5 Flash"}
            </span>
            <span className="text-[11px] font-bold text-emerald bg-emerald/10 px-2 py-0.5 rounded-full ml-1">
              Active Model
            </span>
          </div>
        </div>

        {/* Creativity Temperature Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[13.5px]">
            <Label className="font-semibold">Creativity Temperature</Label>
            <span className="font-mono text-brand font-bold text-[13px]">
              {(temperature[0] / 100).toFixed(2)}
            </span>
          </div>
          <Slider
            value={temperature}
            onValueChange={(val) => setTemperature(Array.isArray(val) ? [...val] : [val])}
            max={100}
            step={5}
            className="py-2"
          />
          <p className="text-[12px] text-foreground/45">
            Lower values produce strict factual answers from your knowledge base.
          </p>
        </div>

        {/* Confidence Handoff Threshold Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[13.5px]">
            <Label className="font-semibold">Confidence Handoff Threshold</Label>
            <span className="font-mono text-emerald font-bold text-[13px]">
              {(confidence[0] / 100).toFixed(2)}
            </span>
          </div>
          <Slider
            value={confidence}
            onValueChange={(val) => setConfidence(Array.isArray(val) ? [...val] : [val])}
            max={100}
            step={5}
            className="py-2"
          />
          <p className="text-[12px] text-foreground/45">
            Below this confidence score, the AI escalates to a human agent instead of guessing.
          </p>
        </div>

        {/* Human Fallback Behavior Select */}
        <div className="space-y-2 pt-1">
          <Label className="text-[13.5px] font-semibold">Human Fallback Behavior</Label>
          <Select
            value={fallbackBehavior}
            onValueChange={(val) => setFallbackBehavior(val as "escalate" | "cannot")}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background border-border/50 text-[14px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl min-w-[260px]">
              <SelectItem value="escalate">Escalate &amp; Notify Human Agent</SelectItem>
              <SelectItem value="cannot">Politely state inability to assist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end pt-2 border-t border-border/30">
          <Button
            onClick={handleSaveAISettings}
            disabled={isSaving}
            className="bg-brand text-white hover:bg-brand/85 rounded-full h-10 px-6 font-semibold text-[13.5px] shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving AI Settings...</>
            ) : saved ? (
              <><CheckCircle2 className="h-4 w-4 mr-2 text-white" /> AI Settings Saved</>
            ) : (
              "Save AI Settings"
            )}
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}
