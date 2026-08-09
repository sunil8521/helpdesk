"use client";

import { useState, useEffect } from "react";
import { WidgetPreview } from "@/components/hendesk/widget-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { updateWidgetConfigAction } from "@/app/actions/widget";
import { toast } from "@/components/ui/toast";
import { addFaqAction, deleteFaqAction } from "@/app/actions/faq";
import {
  Copy,
  CheckCircle2,
  Palette,
  Sliders,
  Code2,
  HelpCircle,
  Plus,
  Trash2,
  Users,
  Loader2
} from "lucide-react";

export function WidgetClientView({
  initialConfig,
  workspaceId,
  agentInfo,
  role,
  initialFaqs
}: {
  initialConfig: any;
  workspaceId: string;
  agentInfo?: { name: string; role: string } | null;
  role?: string;
  initialFaqs: any[];
}) {
  const isAgent = role === "agent";
  const [title, setTitle] = useState(initialConfig.title);
  const [greeting, setGreeting] = useState(initialConfig.greeting);
  const [theme, setTheme] = useState(initialConfig.themeColor);
  const [btn, setBtn] = useState(initialConfig.buttonColor);
  const [position, setPosition] = useState<"right" | "left">(initialConfig.position);
  const [proactive, setProactive] = useState(initialConfig.proactiveMessage);

  // Lead Capture State
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(initialConfig.leadCapture?.enabled || false);
  const [leadCaptureFields, setLeadCaptureFields] = useState<string[]>(initialConfig.leadCapture?.requiredFields || ["name", "email"]);

  const toggleLeadField = (field: string) => {
    if (leadCaptureFields.includes(field)) {
      setLeadCaptureFields(leadCaptureFields.filter(f => f !== field));
    } else {
      setLeadCaptureFields([...leadCaptureFields, field]);
    }
  };

  const [avatarUrl] = useState(initialConfig.avatarUrl);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // FAQ State
  const [faqs, setFaqs] = useState(initialFaqs || []);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setIsAddingFaq(true);
    try {
      const res = await addFaqAction(newQuestion, newAnswer);
      if (res.error) throw new Error(res.error);

      // Optimistic update
      setFaqs([{ _id: Date.now().toString(), question: newQuestion, answer: newAnswer }, ...faqs]);
      setNewQuestion("");
      setNewAnswer("");
      toast.add({ title: "FAQ Added", description: "Successfully added new FAQ", type: "success" });
    } catch (err: any) {
      toast.add({ title: "Failed to add FAQ", description: err.message, type: "error" });
    } finally {
      setIsAddingFaq(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    setDeletingFaqId(id);
    try {
      const res = await deleteFaqAction(id);
      if (res.error) throw new Error(res.error);

      // Optimistic update
      setFaqs(faqs.filter((f: any) => f._id !== id));
      toast.add({ title: "FAQ Deleted", description: "Successfully removed FAQ", type: "success" });
    } catch (err: any) {
      toast.add({ title: "Failed to delete FAQ", description: err.message, type: "error" });
    } finally {
      setDeletingFaqId(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateWidgetConfigAction({
        title,
        greeting,
        themeColor: theme,
        buttonColor: btn,
        position,
        proactiveMessage: proactive,
        leadCapture: {
          enabled: leadCaptureEnabled,
          requiredFields: leadCaptureFields
        }
      });
      if (res.error) throw new Error(res.error);
      toast.add({ title: "Success", description: "Widget settings saved", type: "success" });
    } catch (err: any) {
      toast.add({ title: "Save Failed", description: err.message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const script = `<script src="${origin}/widget.js" data-helpdesk-workspace-id="${workspaceId}" defer></script>`;

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8 font-sans">
      {/* Header Banner */}
      <div>
        <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
          Embed &amp; Style
        </span>
        <h1 className="mt-2.5 text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
          Widget <em className="font-display not-italic italic text-brand">Customization</em>
        </h1>
        <p className="mt-1 text-[14.5px] text-foreground/50">Customize colors, text, behavior, and install the AI chat widget on your site.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        {/* Left Column: Form Controls */}
        <div className="space-y-6">
          {/* Appearance Settings */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[17px] tracking-tight flex items-center gap-2">
                  <Palette className="h-4.5 w-4.5 text-brand" /> Appearance &amp; Branding
                </h3>
                <p className="text-[12.5px] text-foreground/45 mt-0.5">Control how your chat widget looks to visitors</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || isAgent}
                title={isAgent ? "Only admins and owners can modify widget settings" : undefined}
                className={`h-10 px-5 rounded-xl bg-brand text-white font-bold shadow-md shadow-brand/20 transition-all shrink-0 ${isAgent ? 'cursor-not-allowed opacity-50' : 'hover:bg-brand/90 cursor-pointer'}`}
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[13.5px] font-semibold">Widget Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl bg-background border-border/50 text-[14px]" />
              </div>

              <div className="space-y-2">
                <Label className="text-[13.5px] font-semibold">Greeting Message</Label>
                <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} className="h-11 rounded-xl bg-background border-border/50 text-[14px]" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13.5px] font-semibold">Theme Color</Label>
                  <div className="flex items-center gap-2">
                    <Input type="color" value={theme} onChange={(e) => setTheme(e.target.value)} className="h-10 w-12 p-0.5 rounded-lg border-0 bg-transparent cursor-pointer" />
                    <Input value={theme} onChange={(e) => setTheme(e.target.value)} className="h-10 rounded-xl bg-background border-border/50 text-[13px] font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13.5px] font-semibold">Button Color</Label>
                  <div className="flex items-center gap-2">
                    <Input type="color" value={btn} onChange={(e) => setBtn(e.target.value)} className="h-10 w-12 p-0.5 rounded-lg border-0 bg-transparent cursor-pointer" />
                    <Input value={btn} onChange={(e) => setBtn(e.target.value)} className="h-10 rounded-xl bg-background border-border/50 text-[13px] font-mono" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[13.5px] font-semibold">Screen Position</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPosition("left")}
                    className={`p-3.5 rounded-2xl border-2 text-left font-semibold text-[13.5px] transition-all cursor-pointer ${position === "left" ? "border-brand bg-brand/4 text-brand" : "border-border/50 bg-background text-foreground/70"
                      }`}
                  >
                    Left Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition("right")}
                    className={`p-3.5 rounded-2xl border-2 text-left font-semibold text-[13.5px] transition-all cursor-pointer ${position === "right" ? "border-brand bg-brand/4 text-brand" : "border-border/50 bg-background text-foreground/70"
                      }`}
                  >
                    Right Side
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Behavior Settings */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="font-bold text-[17px] tracking-tight flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-brand" /> Behavior &amp; Automation
              </h3>
              <p className="text-[12.5px] text-foreground/45 mt-0.5">Configure popups and widget behavior</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <Label className="text-[14px] font-semibold">Proactive Message</Label>
                  <p className="text-[12.5px] text-foreground/45">Automatically open greeting after 8 seconds on page.</p>
                </div>
                <Switch checked={proactive} onCheckedChange={setProactive} />
              </div>
            </div>
          </div>

          {/* Lead Capture Settings */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="font-bold text-[17px] tracking-tight flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-brand" /> Lead Capture
              </h3>
              <p className="text-[12.5px] text-foreground/45 mt-0.5">Ask visitors for their contact details before they chat.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <Label className="text-[14px] font-semibold">Enable Pre-Chat Form</Label>
                  <p className="text-[12.5px] text-foreground/45">Show a form before the user can start chatting.</p>
                </div>
                <Switch checked={leadCaptureEnabled} onCheckedChange={setLeadCaptureEnabled} />
              </div>

              {leadCaptureEnabled && (
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-[13px] font-semibold block mb-2">Required Fields</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["name", "email", "phone"].map(field => (
                      <label key={field} className="flex items-center gap-2 text-[13px] cursor-pointer hover:text-foreground">
                        <input
                          type="checkbox"
                          checked={leadCaptureFields.includes(field)}
                          disabled={field === "email"} // Email usually required if lead capture is on
                          onChange={() => toggleLeadField(field)}
                          className="rounded-sm border-border accent-brand w-4 h-4"
                        />
                        {field === "name" ? "Full Name" : field === "email" ? "Email (Required)" : "Phone"}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FAQ Settings */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="font-bold text-[17px] tracking-tight flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-brand" /> Frequently Asked Questions
              </h3>
              <p className="text-[12.5px] text-foreground/45 mt-0.5">Manage the FAQs displayed in your widget.</p>
            </div>

            <form onSubmit={handleAddFaq} className="space-y-3 bg-muted/50 p-4 rounded-2xl border border-border/50">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Question</Label>
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g., What are your support hours?"
                  className="bg-background h-10 text-[13px] placeholder:text-[12.5px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Answer</Label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Provide a clear, helpful answer..."
                  className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-[13px] placeholder:text-[12.5px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full sm:w-auto font-bold rounded-xl"
                disabled={isAddingFaq || !newQuestion.trim() || !newAnswer.trim()}
              >
                {isAddingFaq ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add FAQ
              </Button>
            </form>

            <div className="space-y-3 mt-4">
              {faqs.length === 0 ? (
                <div className="text-center py-6 text-sm text-foreground/40 font-medium bg-muted/20 rounded-2xl border border-dashed border-border">
                  No FAQs added yet.
                </div>
              ) : (
                faqs.map((faq: any) => (
                  <div key={faq._id} className="group relative flex justify-between gap-4 p-4 rounded-2xl border border-border/50 bg-background hover:border-brand/30 transition-colors shadow-xs">
                    <div className="space-y-1 pr-8">
                      <p className="text-sm font-semibold">{faq.question}</p>
                      <p className="text-[13px] text-foreground/60 leading-relaxed">{faq.answer}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteFaq(faq._id)}
                      disabled={deletingFaqId === faq._id}
                      className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-full text-foreground/30 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {deletingFaqId === faq._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Clean Widget Preview */}
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-md space-y-4 sticky top-24 flex flex-col items-center">

          <div className="w-full flex justify-center py-2">
            <WidgetPreview
              title={title}
              agentName={agentInfo?.name}
              agentRole={agentInfo?.role}
              greeting={greeting}
              avatarUrl={avatarUrl}
              themeColor={theme}
              buttonColor={btn}
              className="shadow-xl"
              initialFaqs={faqs}
            />
          </div>
        </div>
      </div>

      {/* Installation Snippet Section */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 shadow-2xs space-y-5">
        <div>
          <h3 className="font-bold text-[18px] tracking-tight flex items-center gap-2">
            <Code2 className="h-5 w-5 text-brand" /> Embed &amp; Install Snippet
          </h3>
          <p className="text-[13.5px] text-foreground/50 mt-1">Paste this 1-line script snippet before the closing <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">&lt;/body&gt;</code> tag on your website.</p>
        </div>

        <Tabs defaultValue="script" className="space-y-4">
          <TabsList className="bg-[oklch(0.985_0.003_260)] border border-border/40 p-1 rounded-2xl h-11 flex items-center justify-start overflow-x-auto whitespace-nowrap w-full sm:w-fit gap-1 no-scrollbar">
            <TabsTrigger value="script" className="rounded-xl px-4 h-9 text-[13px] font-semibold data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer transition-all shrink-0">Custom HTML</TabsTrigger>
            <TabsTrigger value="wp" className="rounded-xl px-4 h-9 text-[13px] font-semibold data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer transition-all shrink-0">WordPress</TabsTrigger>
            <TabsTrigger value="wix" className="rounded-xl px-4 h-9 text-[13px] font-semibold data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer transition-all shrink-0">Wix</TabsTrigger>
            <TabsTrigger value="webflow" className="rounded-xl px-4 h-9 text-[13px] font-semibold data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer transition-all shrink-0">Webflow</TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="outline-none">
            <ScriptBlock script={script} copied={copied} onCopy={() => { navigator.clipboard?.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 1500); }} />
          </TabsContent>
          <TabsContent value="wp" className="space-y-4 outline-none">
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-muted/30 rounded-2xl border border-border/40">
              <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-brand bg-brand/10 px-3 py-1 rounded-full">Coming Soon</span>
              <p className="text-[14px] text-foreground/70 max-w-sm mx-auto">We are currently developing a native WordPress plugin for seamless 1-click integration.</p>
            </div>
          </TabsContent>
          <TabsContent value="wix" className="space-y-4 outline-none">
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-muted/30 rounded-2xl border border-border/40">
              <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-brand bg-brand/10 px-3 py-1 rounded-full">Coming Soon</span>
              <p className="text-[14px] text-foreground/70 max-w-sm mx-auto">Native Wix App integration is on the roadmap. For now, use the Custom HTML snippet in your Site Settings.</p>
            </div>
          </TabsContent>
          <TabsContent value="webflow" className="space-y-4 outline-none">
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-muted/30 rounded-2xl border border-border/40">
              <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-brand bg-brand/10 px-3 py-1 rounded-full">Coming Soon</span>
              <p className="text-[14px] text-foreground/70 max-w-sm mx-auto">Webflow Marketplace app is under construction. Please use the Custom HTML method in your Head Code settings.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Shadow DOM Architecture Info Cards */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 shadow-2xs space-y-4">
        <h3 className="font-bold text-[18px] tracking-tight">How the Widget Engine Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "1. Async Script Loader", d: "widget.js loads asynchronously without blocking your page rendering speed." },
            { t: "2. Shadow DOM Isolation", d: "Mounts inside a Shadow Root so site CSS styles never leak in or break the widget." },
            { t: "3. Realtime Socket Engine", d: "Socket-powered chat panel ensures instant communication between visitor, AI, and human agent." },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl border border-border/40 bg-[oklch(0.985_0.003_260)] p-4.5 space-y-1.5">
              <div className="font-bold text-[14.5px] text-foreground">{s.t}</div>
              <div className="text-[13px] text-foreground/50 leading-relaxed">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScriptBlock({ script, copied, onCopy }: { script: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="rounded-2xl bg-[#0b1020] text-slate-100 font-mono text-[12.5px] p-4 sm:p-5 overflow-hidden leading-relaxed space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-400">HTML Script Snippet</span>
        <button
          className="text-slate-100 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1 text-[12px] font-sans font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
          onClick={onCopy}
        >
          {copied ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy Snippet</>}
        </button>
      </div>
      <div className="overflow-x-auto pt-1">
        <code className="break-all block">{script}</code>
      </div>
    </div>
  );
}
