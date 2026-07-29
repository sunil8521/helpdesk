export type ConvStatus = "ai" | "human" | "waiting" | "resolved";
export type MessageRole = "visitor" | "ai" | "agent" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  time: string;
  citations?: { title: string; source: string }[];
}

export interface Conversation {
  id: string;
  visitor: string;
  email: string;
  preview: string;
  time: string;
  status: ConvStatus;
  unread: boolean;
  assignedTo?: string;
  page: string;
  device: string;
  reason?: string;
  messages: Message[];
}

export const conversations: Conversation[] = [
  {
    id: "c1",
    visitor: "Amelia Chen",
    email: "amelia.chen@northlake.co",
    preview: "Thanks — can I speak to a real person?",
    time: "2m",
    status: "waiting",
    unread: true,
    page: "/pricing",
    device: "Chrome · macOS",
    reason: "Refund policy escalation",
    messages: [
      { id: "m1", role: "visitor", content: "Hi — what's your refund policy for annual plans?", time: "10:41" },
      { id: "m2", role: "ai", content: "Annual plans include a 30-day money-back guarantee. After 30 days, refunds are prorated for the unused period of your subscription.", time: "10:41", citations: [{ title: "Refund Policy", source: "docs/billing/refunds.md" }, { title: "Terms of Service §7", source: "web/terms" }] },
      { id: "m3", role: "visitor", content: "Thanks — can I speak to a real person?", time: "10:43" },
      { id: "m4", role: "system", content: "Escalation requested. Waiting for an available agent.", time: "10:43" },
    ],
  },
  {
    id: "c2",
    visitor: "Marcus Weber",
    email: "m.weber@studio-weber.de",
    preview: "How do I install the widget on Webflow?",
    time: "18m",
    status: "ai",
    unread: true,
    page: "/docs/install",
    device: "Safari · iPhone",
    messages: [
      { id: "m1", role: "visitor", content: "How do I install the widget on Webflow?", time: "10:25" },
      { id: "m2", role: "ai", content: "In Webflow, open Project Settings → Custom Code, then paste the HenDesk script into the Head Code section. Publish your site to activate the widget.", time: "10:25", citations: [{ title: "Webflow install guide", source: "docs/install/webflow.md" }] },
    ],
  },
  {
    id: "c3",
    visitor: "Priya Natarajan",
    email: "priya@lumenlabs.io",
    preview: "Perfect, that solved it — thank you!",
    time: "1h",
    status: "resolved",
    unread: false,
    assignedTo: "You",
    page: "/settings/billing",
    device: "Firefox · Windows",
    messages: [
      { id: "m1", role: "visitor", content: "My invoice shows the wrong VAT.", time: "09:12" },
      { id: "m2", role: "ai", content: "I can help with that. Could you share the invoice number?", time: "09:12" },
      { id: "m3", role: "visitor", content: "INV-4821", time: "09:14" },
      { id: "m4", role: "agent", content: "Hi Priya — I've corrected the VAT and reissued INV-4821. You'll get the updated PDF within a minute.", time: "09:20" },
      { id: "m5", role: "visitor", content: "Perfect, that solved it — thank you!", time: "09:22" },
    ],
  },
  {
    id: "c4",
    visitor: "Joel Ibarra",
    email: "joel@ibarra.mx",
    preview: "Does the crawler respect robots.txt?",
    time: "3h",
    status: "human",
    unread: false,
    assignedTo: "Sam K.",
    page: "/product/crawler",
    device: "Chrome · Windows",
    messages: [
      { id: "m1", role: "visitor", content: "Does the crawler respect robots.txt?", time: "07:30" },
      { id: "m2", role: "agent", content: "Yes — HenDesk's crawler always honors robots.txt and stays on the same origin as the root URL you provide.", time: "07:34" },
    ],
  },
  {
    id: "c5",
    visitor: "Sofia Rossi",
    email: "sofia@rossi.it",
    preview: "Can I limit which pages get indexed?",
    time: "Yesterday",
    status: "ai",
    unread: false,
    page: "/docs/knowledge",
    device: "Chrome · Android",
    messages: [
      { id: "m1", role: "visitor", content: "Can I limit which pages get indexed?", time: "Yesterday" },
      { id: "m2", role: "ai", content: "Yes — set a max page count and an allow/deny path pattern in the crawler settings.", time: "Yesterday" },
    ],
  },
];

export const teamMembers = [
  { name: "You (Alex Rivera)", email: "alex@acme.co", role: "Owner", status: "Online", lastActive: "Now" },
  { name: "Sam Kowalski", email: "sam@acme.co", role: "Admin", status: "Online", lastActive: "2m" },
  { name: "Nina Okafor", email: "nina@acme.co", role: "Agent", status: "Away", lastActive: "18m" },
  { name: "Jules Park", email: "jules@acme.co", role: "Agent", status: "Offline", lastActive: "3h" },
];

export const documents = [
  { name: "Refund Policy.pdf", source: "Upload", status: "Completed", chunks: 24, uploader: "Alex R.", date: "Jul 12" },
  { name: "Onboarding Guide.md", source: "Upload", status: "Completed", chunks: 41, uploader: "Sam K.", date: "Jul 11" },
  { name: "Product FAQ.pdf", source: "Upload", status: "Embedding", chunks: 18, uploader: "Nina O.", date: "Jul 14" },
  { name: "acme.co/docs", source: "Crawler", status: "Chunked", chunks: 112, uploader: "System", date: "Jul 14" },
  { name: "Pricing Terms.txt", source: "Upload", status: "Processing", chunks: 0, uploader: "Alex R.", date: "Jul 15" },
  { name: "Legacy Handbook.pdf", source: "Upload", status: "Failed", chunks: 0, uploader: "Sam K.", date: "Jul 09" },
];

export const chunks = [
  { source: "Refund Policy.pdf", title: "Annual plan refunds", tokens: 184, preview: "Annual plans include a 30-day money-back guarantee. After 30 days, refunds are prorated…" },
  { source: "acme.co/docs/install/webflow", title: "Installing on Webflow", tokens: 212, preview: "Open Project Settings → Custom Code and paste the script into the Head Code section…" },
  { source: "Product FAQ.pdf", title: "Data residency", tokens: 156, preview: "Workspace data is stored in the EU region by default. Enterprise plans can select US or APAC…" },
  { source: "Onboarding Guide.md", title: "Inviting teammates", tokens: 98, preview: "From Team → Invite, enter the teammate's work email and pick a role (Admin or Agent)…" },
];

export const crawlHistory = [
  { url: "acme.co", status: "Completed", pages: 84, chunks: 612, started: "Jul 12 · 09:20", finished: "Jul 12 · 09:34" },
  { url: "acme.co/docs", status: "Completed", pages: 42, chunks: 318, started: "Jul 10 · 14:02", finished: "Jul 10 · 14:11" },
  { url: "acme.co/blog", status: "Failed", pages: 12, chunks: 0, started: "Jul 07 · 11:00", finished: "Jul 07 · 11:02" },
];
