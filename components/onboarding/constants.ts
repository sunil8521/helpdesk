import {
  BotMessageSquare,
  Sliders,
  Palette,
  BookOpen,
  Code2,
} from "lucide-react";

export const STEPS = [
  { id: "basics", label: "Agent Identity", icon: BotMessageSquare },
  { id: "persona", label: "Voice & Tone", icon: Sliders },
  { id: "widget", label: "Appearance", icon: Palette },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { id: "finish", label: "Install & Launch", icon: Code2 },
];

export const AGENT_TEMPLATES = [
  {
    id: "support",
    title: "Customer Support",
    icon: "💬",
    bg: "bg-blue-50 border-blue-200 text-blue-800",
    role: "Customer Support Specialist",
    description:
      "Help users with product FAQs, policies, troubleshooting technical issues, and escalating to human agents when needed.",
    prompts: ["How to reset password?", "What are your hours?", "Talk to human"],
  },
  {
    id: "ecommerce",
    title: "E-commerce Assistant",
    icon: "🛍️",
    bg: "bg-purple-50 border-purple-200 text-purple-800",
    role: "E-commerce Shopping Assistant",
    description:
      "Answer product questions, explain shipping and return policies, and assist with general inquiries based on the knowledge base.",
    prompts: ["Product info", "Shipping policies", "Return policy"],
  },
  {
    id: "tech",
    title: "Tech Support",
    icon: "⚙️",
    bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
    role: "Technical Specialist",
    description:
      "Assist developers with documentation, setup steps, syntax examples, and error debugging using the provided knowledge base.",
    prompts: ["API Docs", "Setup guide", "CORS policy"],
  },
];

export const AVATAR_OPTIONS = [
  {
    id: "bot1",
    name: "Maya",
    url: "https://api.dicebear.com/9.x/bottts/svg?seed=Maya",
  },
  {
    id: "bot2",
    name: "Apex",
    url: "https://api.dicebear.com/9.x/bottts/svg?seed=Apex",
  },
  {
    id: "bot3",
    name: "Echo",
    url: "https://api.dicebear.com/9.x/bottts/svg?seed=Echo",
  },
  {
    id: "bot4",
    name: "Sparky",
    url: "https://api.dicebear.com/9.x/bottts/svg?seed=Sparky",
  },
  {
    id: "bot5",
    name: "Gizmo",
    url: "https://api.dicebear.com/9.x/bottts/svg?seed=Gizmo",
  },
  {
    id: "bot6",
    name: "Circuit",
    url: "https://api.dicebear.com/9.x/bottts/svg?seed=Circuit",
  },
];

export const COLOR_SWATCHES = [
  { name: "Indigo", value: "#4f46e5" },
  { name: "Ocean", value: "#0284c7" },
  { name: "Emerald", value: "#059669" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Rose", value: "#e11d48" },
  { name: "Midnight", value: "#0f172a" },
];
