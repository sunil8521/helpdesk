To build a Customer Support Agent platform (like Zendesk) in Next.js, the best and most modern approach is to use Server Actions combined with deep React Server Component (RSC) integration, rather than building separate API routes.
For highly dynamic, real-time ticket queues and chat panels, you will complement this with Optimistic Updates (useOptimistic) and a live synchronization layer like WebSockets or a real-time database.
Here is the breakdown of why this architectural pattern is superior for a Zendesk clone, how the two approaches compare, and exactly how to implement the optimal stack.
------------------------------
## Why the RSC + Server Action Approach Wins for Support Apps
Support tools are heavily transactional. Agents are constantly updating ticket statuses, assigning priorities, and adding internal notes.

| Feature | Old Way (API Routes + fetch + useState) | Modern Way (Server Actions + RSCs) | Why it matters for Zendesk |
|---|---|---|---|
| Data Fetching | Client triggers useEffect fetch; shows loading spinners. | Server fetches data directly from DB; renders HTML instantly. | Instant Ticket Loading: Agents see customer profiles and history instantly on page click without loading spinners. |
| Mutations | Create an API endpoint, serialize JSON, run fetch(POST). | Invoke a secure, typed async function directly from a UI button. | Secure Ticket Routing: Less boilerplate code; input validation happens implicitly on the server boundary. |
| State Sync | Manual client-side state management (mutate() or context). | revalidatePath('/tickets') auto-refreshes data for everyone. | Real-Time Consistency: When a ticket closes, the agent's queue updates instantly without complex state machinery. |

------------------------------
## The Architecture Map for a Support Platform
A Zendesk clone requires three structural pillars to feel blazing fast:

[Agent Browser UI] 
   │
   ├───► 1. useOptimistic (Instantly appends agent's chat reply to UI)
   │
   ├───► 2. Server Action (Saves reply to Database via secure server boundary)
   │
   └───► 3. revalidatePath / Real-time Sync (Refreshes server state & pushes to other agents)

------------------------------
## Implementation Guide: Core Ticket System## 1. Server Action: Mutate Ticket State (Server-Side) [1] 
Create a central file for your data mutations (e.g., src/app/actions/tickets.ts). Server Actions handle database changes securely, replacing POST and PUT API endpoints. [2, 3] 

"use server";
import { revalidatePath } from "next/cache";
// Mock Database Updateasync function updateTicketInDB(id: string, updates: any) {
  // e.g., await db.ticket.update({ where: { id }, data: updates })
  return { id, ...updates };
}
export async function updateTicketStatus(ticketId: string, newStatus: "OPEN" | "PENDING" | "SOLVED") {
  if (!ticketId) throw new Error("Invalid Ticket ID");

  // 1. Persist the change to your database securely
  await updateTicketInDB(ticketId, { status: newStatus });

  // 2. Clear the cache and force Next.js to fetch fresh data for the agent dashboard
  revalidatePath("/agent/dashboard");
  revalidatePath(`/agent/tickets/${ticketId}`);
}

## 2. RSC Layer: Fetch Data Instantly (Server-Side) [4] 
Your ticket sidebar or main queue layout should fetch data directly from your database. No fetch('/api/tickets') required. [5] 

// src/app/agent/dashboard/page.tsximport { getOpenTickets } from "@/lib/db"; // Direct DB query functionimport TicketRow from "@/components/TicketRow";
export default async function AgentDashboard() {
  // Fetched securely on the server before HTML is sent to the browser
  const tickets = await getOpenTickets(); 

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Ticket Queue</h1>
      <div className="divide-y divide-gray-200">
        {tickets.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}

## 3. Client Component: Zero-Lag Interactions with useOptimistic
Support agents cannot wait 1.5 seconds for a database trip every time they check a box. Use React's useOptimistic hook to update the screen instantly while the server action runs in the background. [6] 

// src/components/TicketRow.tsx"use client";
import { useOptimistic, startTransition } from "react";import { updateTicketStatus } from "@/app/actions/tickets";
type Ticket = { id: string; subject: string; status: "OPEN" | "PENDING" | "SOLVED" };
export default function TicketRow({ ticket }: { ticket: Ticket }) {
  
  // useOptimistic accepts initial server state, and a reducer function
  const [optimisticTicket, setOptimisticStatus] = useOptimistic(
    ticket,
    (state, newStatus: "OPEN" | "PENDING" | "SOLVED") => ({
      ...state,
      status: newStatus,
    })
  );

  const handleResolve = async () => {
    // UI changes to 'SOLVED' immediately upon click
    startTransition(async () => {
      setOptimisticStatus("SOLVED"); 
      
      // Fires background execution of your Server Action
      await updateTicketStatus(ticket.id, "SOLVED"); 
    });
  };

  return (
    <div className="flex justify-between items-center py-3">
      <div>
        <p className="font-medium">{optimisticTicket.subject}</p>
        {/* Visual badge updates instantly */}
        <span className={`text-xs px-2 py-1 rounded ${
          optimisticTicket.status === "SOLVED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
        }`}>
          {optimisticTicket.status}
        </span>
      </div>
      
      {optimisticTicket.status !== "SOLVED" && (
        <button 
          onClick={handleResolve}
          className="px-3 py-1 bg-gray-900 text-white rounded text-sm hover:bg-gray-800"
        >
          Quick Resolve
        </button>
      )}
    </div>
  );
}

------------------------------
## The Real-Time Exception: When to Still Use Traditional APIs
While Server Actions are perfect for actions like modifying ticket assignments, tagging, macro execution, and archiving, a true Zendesk clone needs real-time chat streams. [7] 
Server Actions use HTTP POST requests, which means they are unidirectional and short-lived. For live-typing indicators and instant chat messaging features, you should augment this architecture with a real-time provider: [8] 

   1. WebSockets / SSE: Use standard API Routes (/api/chat/stream) configured for Server-Sent Events (SSE) or a dedicated layer like Socket.io.
   2. Real-time BaaS: Use services like Supabase Realtime, Ably, or Pusher. The UI listens to database changes on the client side, while Server Actions push data updates securely into the database on the backend side. [9, 10, 11] 

Would you like to explore how to structure the multi-tenant database schema (Companies -> Agents -> Customers -> Tickets) for this platform, or do you want to see how to integrate a live chat WebSocket system into this Next.js layout?

[1] [https://prateekbadjatya.medium.com](https://prateekbadjatya.medium.com/next-js-server-actions-the-future-of-server-side-react-development-eba68911f0df)
[2] [https://www.c-sharpcorner.com](https://www.c-sharpcorner.com/article/how-to-use-server-actions-in-next-js-for-form-submissions/)
[3] [https://medium.com](https://medium.com/@sureshdotariya/next-js-15-in-practice-10-patterns-that-actually-ship-64dc27c041b3)
[4] [https://mattclaffey.medium.com](https://mattclaffey.medium.com/mastering-data-fetching-in-next-js-with-server-components-react-query-517b59bc1a5d)
[5] [https://medium.com](https://medium.com/@0s.and.1s/clarifying-next-js-concepts-part-iii-data-fetching-caching-4d9085a16db3)
[6] [https://www.youtube.com](https://www.youtube.com/watch?v=ipmfUw8I2qc)
[7] [https://fin.ai](https://fin.ai/help/en/articles/13975752-fin-for-zendesk-messaging-setup)
[8] [https://www.robinwieruch.de](https://www.robinwieruch.de/next-server-actions-fetch-data/)
[9] [https://jskim1991.medium.com](https://jskim1991.medium.com/spring-boot-making-a-chat-application-with-webflux-and-mongodb-part-1-5ad09c88f2ce)
[10] [https://medium.com](https://medium.com/@abdulsamad18090/building-real-time-web-applications-with-websockets-and-socket-io-in-next-js-3885125cda51)
[11] [https://javascript.plainenglish.io](https://javascript.plainenglish.io/real-time-updates-with-server-sent-events-sse-in-next-js-typescript-a-beginners-guide-d7bb3e932269)


















To build a feature where an agent pastes a URL (like a customer's documentation site or a public help article) and the system automatically crawls, parses, and embeds it into a vector database for AI-powered support, you should use a modular pipeline.
You should not run this inside your main Next.js request thread because crawling and embedding take too long and will timeout your server. Instead, use Next.js to trigger a Background Job / Queue.
Here is the exact stack and code workflow you should use.
------------------------------
## The Recommended Stack

   1. Crawler & Scraper: Crawlee (by Apify) or Firecrawl. They handle JavaScript-rendered pages and turn messy HTML into clean Markdown or text.
   2. Parser & Text Splitter: LangChain or LlamaIndex token splitters. This breaks long web pages into smaller, readable chunks.
   3. Embedding Model: openai (text-embedding-3-small) or Cohere.
   4. Vector Database: Supabase (pgvector), Pinecone, or Qdrant to store the text chunks and their mathematical vector representations.
   5. Background Processor: Inngest or BullMQ. This prevents your Next.js application from crashing or timing out during long crawls. [1, 2, 3, 4] 

------------------------------
## The Complete Workflow Architecture

[Agent Pastes URL] 
       │
       ▼ (Next.js Client)
[Trigger Server Action]
       │
       ▼ (Server places job in background queue)
[Inngest / Background Worker]
       │
       ├──► Step 1: Crawl & Scrape HTML to Clean Text/Markdown
       ├──► Step 2: Split text into small chunks (e.g., 1000 characters)
       ├──► Step 3: Send chunks to OpenAI to generate Vector Embeddings
       └──► Step 4: Upsert Vectors and Raw Text chunks into Vector DB

------------------------------
## Code Implementation## 1. Define the Background Pipeline (Using Inngest)
Create a background function (e.g., src/inngest/crawlWorkflow.ts) that runs asynchronously away from the user interface.

import { Inngest } from "inngest";import { PuppeteerCrawler } from "crawlee";import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";import OpenAI from "openai";import { supabase } from "@/lib/supabase"; // Your DB client
const inngest = new Inngest({ id: "support-agent-app" });const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const crawlAndEmbedUrl = inngest.createFunction(
  { id: "crawl-and-embed-url" },
  { event: "ticket/url.pasted" },
  async ({ event }) => {
    const { url, ticketId } = event.data;
    let rawTextContent = "";

    // STEP 1: Crawl and Extract Text using Crawlee
    const crawler = new PuppeteerCrawler({
      maxRequestsPerCrawl: 10, // Limit depth so it doesn't run forever
      async requestHandler({ request, enqueueLinks, $ }) {
        if ($) {
          // Extract text cleanly by stripping scripts and styles
          $("script, style").remove();
          rawTextContent += $("body").text().replace(/\s+/g, " ").trim() + "\n";
          // Automatically find other links on the same domain to crawl
          await enqueueLinks({ strategy: "same-domain" });
        }
      },
    });

    await crawler.run([url]);

    // STEP 2: Parse and Split Text into manageable chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const textChunks = await splitter.splitText(rawTextContent);

    // STEP 3 & 4: Embed chunks and save to Vector Database
    for (const chunk of textChunks) {
      // Generate embedding vector from OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });
      
      const [{ embedding }] = embeddingResponse.data;

      // Save chunk text and vector array into Supabase pgvector or Pinecone
      await supabase.from("knowledge_embeddings").insert({
        ticket_id: ticketId,
        content: chunk,
        embedding: embedding, // math vector format [0.123, -0.456, ...]
        source_url: url
      });
    }

    return { status: "success", chunksProcessed: textChunks.length };
  }
);

## 2. Trigger the Workflow from a Server Action [5] 
When the agent inputs the URL, call this Server Action to immediately kick off the background job. The agent does not have to sit and wait on a loading screen.

"use server";
import { Inngest } from "inngest";import { revalidatePath } from "next/cache";
const inngest = new Inngest({ id: "support-agent-app" });
export async function processSupportUrl(ticketId: string, urlToCrawl: string) {
  if (!urlToCrawl.startsWith("http")) {
    throw new Error("Invalid URL provided");
  }

  // Send event to the background worker and return instantly to client
  await inngest.send({
    name: "ticket/url.pasted",
    data: {
      ticketId,
      url: urlToCrawl,
    },
  });

  // Revalidate to show a "Processing..." status badge on the ticket UI
  revalidatePath(`/agent/tickets/${ticketId}`);
}

------------------------------
## Alternative: The "All-in-One" Managed API Alternative
If you do not want to manage your own web crawlers (Crawlee / Puppeteer) because handling cloud proxies, cookie banners, and dynamic Javascript rendering becomes too complex, you should use Firecrawl or Apify. [6] 
With Firecrawl, your backend step simplifies down to a single fetch request: [7] 

// Alternative Step 1 using a managed scrapper APIconst response = await fetch("https://firecrawl.dev", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ url: url })
});
const data = await response.json();const cleanMarkdown = data.data.markdown; // Ready for parsing!

------------------------------
## Crucial Production Safeguards

* Timeout Limits: Vercel/Netlify serverless functions have a maximum execution duration limit (usually 15 to 30 seconds on free plans). Crawling websites can easily take several minutes. You must offload this process to a background job provider like Inngest, Vercel Background Actions, or an independent Node.js worker on AWS/Render. [8] 
* Security & Scraping Abuse: Malicious users might input internal IP addresses (http://192.168.1.1) or gigantic files to crash your system. Always validate URLs and restrict crawling parameters to public domains only.

Would you like to see how to write the SQL query or RPC function to retrieve these vector embeddings when an agent asks the AI a question, or should we look into setting up the Supabase pgvector table schema?

[1] [https://www.firecrawl.dev](https://www.firecrawl.dev/blog/scraper-vs-crawler)
[2] [https://www.aifire.co](https://www.aifire.co/p/the-ai-website-scraper-that-turns-any-website-into-clean-data)
[3] [https://www.instagram.com](https://www.instagram.com/reel/DangRYOIRwM/)
[4] [https://pydantic.dev](https://pydantic.dev/docs/ai/guides/embeddings/)
[5] [https://docs.kanaries.net](https://docs.kanaries.net/articles/build-blog-mcp)
[6] [https://www.zenrows.com](https://www.zenrows.com/blog/crawlee)
[7] [https://www.firecrawl.dev](https://www.firecrawl.dev/blog/web-scraping-intro-for-beginners)
[8] [https://seolocale.com](https://seolocale.com/how-to-use-screaming-frog/)









In Next.js 16, the old middleware.ts system has been officially deprecated and replaced by the new proxy.ts configuration file. The execution rules dictate that it serves as your application's clean network boundary layer. [1, 2] 
To build a secure onboarding flow where users can skip it initially to access the dashboard, but if they click "Skip", their 30-day trial clock starts and they are strictly forced back into finishing onboarding later without bypasses, you can configure it completely using the Next.js 16 proxy.ts pattern.
------------------------------
## The Next.js 16 Proxy Flow

                     [ User Navigates to App Route ]
                                    │
                                    ▼
                     [ proxy.ts Intercepts Request ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        Auth Cookie Missing?                 Auth Cookie Exists?
                  │                                   │
       (Allow Login/Signup)          Is user completely onboarded?
                                         /                    \
                                     (Yes)                    (No)
                                      /                          \
                        [ Allow to Dashboard ]         Check `onboarding_status` cookie
                                                       /                        \
                                                 ("SKIPPED")               ("INCOMPLETE")
                                                     /                              \
                                      Has trial window expired?            [ Force Redirect ]
                                       /                    \              [ to `/onboarding` ]
                                    (Yes)                  (No)
                                     /                        \
                       [ Force Redirect ]            [ Allow Dashboard access ]
                       [ to `/onboarding` ]          [ Show persistent reminder ]

------------------------------
## 1. The Next.js 16 proxy.ts Network Boundary
In Next.js 16, proxy.ts must sit directly in your /src or project root folder (never inside the app/ directory). It exports a named function called proxy. [2, 3, 4] 

// src/proxy.tsimport { NextResponse } from "next/server";import type { NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Instantly ignore system files, assets, and auth pages to maintain speed
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return NextResponse.next();
  }

  // 2. Extract state metadata safely from cookies
  const authSession = request.cookies.get("auth_session")?.value;
  const onboardingState = request.cookies.get("onboarding_status")?.value; // "COMPLETED" | "SKIPPED" | "INCOMPLETE"
  const skipTimestamp = request.cookies.get("onboarding_skip_time")?.value;

  const isOnboardingPage = pathname.startsWith("/onboarding");

  // Guard: If not logged in, pass through to let public routing handle it
  if (!authSession) {
    return NextResponse.next();
  }

  // Scenario A: User is fully onboarded. Prevent them from going back to /onboarding
  if (onboardingState === "COMPLETED" && isOnboardingPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Scenario B: User explicitly chose to skip onboarding earlier
  if (onboardingState === "SKIPPED") {
    if (skipTimestamp) {
      const skippedAt = parseInt(skipTimestamp, 10);
      const strictDeadline = skippedAt + 30 * 24 * 60 * 60 * 1000; // Hard 30-day enforcement window
      const now = Date.now();

      // If they skipped but their time limit has run out, force them back into onboarding lock
      if (now > strictDeadline && !isOnboardingPage) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  // Scenario C: User hasn't completed onboarding and hasn't skipped yet, protect dashboard routes
  if (onboardingState === "INCOMPLETE" && !isOnboardingPage) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}
// Limit the proxy file execution to dashboard and onboarding domains onlyexport const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};

------------------------------
## 2. Handling Mutations with Server Actions
When the user steps through your setup pages, handle database values and cookie state updates securely inside Server Actions. [5] 

// src/app/actions/onboarding.ts"use server";
import { cookies } from "next/headers";import { redirect } from "next/navigation";import { revalidatePath } from "next/cache";
// Action A: User triggers the "Skip for now" pathwayexport async function skipOnboarding() {
  const cookieStore = await cookies();
  const currentTimestamp = Date.now().toString();

  // 1. Save timestamp and skip state in secure HTTP-only cookies
  cookieStore.set("onboarding_status", "SKIPPED", { path: "/", httpOnly: true, secure: true });
  cookieStore.set("onboarding_skip_time", currentTimestamp, { path: "/", httpOnly: true, secure: true });

  // 2. Force Next.js layout engine to pick up fresh parameters
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
// Action B: User hits completion finish buttonexport async function completeOnboarding(formData: { organizationName: string }) {
  // Update your database here: await db.user.update(...)
  
  const cookieStore = await cookies();

  // Lock status to COMPLETED and clean up old skip timestamp keys
  cookieStore.set("onboarding_status", "COMPLETED", { path: "/", httpOnly: true, secure: true });
  cookieStore.delete("onboarding_skip_time");

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

------------------------------
## 3. The Conditional Dashboard Notice Layout
When users opt to skip onboarding, they gain entry to /dashboard, but you must use a global layout file (src/app/dashboard/layout.tsx) to show a dynamic counter detailing how many days they have left before the proxy blocks them.

// src/app/dashboard/layout.tsximport { cookies } from "next/headers";import Link from "next/link";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const onboardingStatus = cookieStore.get("onboarding_status")?.value;
  const skipTimeStr = cookieStore.get("onboarding_skip_time")?.value;

  let daysRemaining = 30;

  if (onboardingStatus === "SKIPPED" && skipTimeStr) {
    const skippedAt = parseInt(skipTimeStr, 10);
    const msLeft = (skippedAt + 30 * 24 * 60 * 60 * 1000) - Date.now();
    daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Absolute Dynamic Header Block if Onboarding was skipped */}
      {onboardingStatus === "SKIPPED" && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-semibold flex justify-between items-center shadow-md">
          <span>⚠️ Setup is incomplete! You have exactly **{daysRemaining} days left** to finish configuration before your account locks.</span>
          <Link 
            href="/onboarding" 
            className="ml-4 bg-white text-rose-700 px-3 py-1.5 rounded font-bold hover:bg-zinc-100 transition"
          >
            Complete Onboarding Now
          </Link>
        </div>
      )}

      <div className="flex flex-1">
        <aside className="w-64 bg-zinc-950 text-zinc-400 p-4 border-r border-zinc-800">Support Sidebar</aside>
        <main className="flex-1 p-8 bg-zinc-50">{children}</main>
      </div>
    </div>
  );
}

------------------------------
## Key Next.js 16 Proxy Architectural Controls

* Lightweight Rules Only: In Next.js 16, avoid heavy database lookups directly inside proxy.ts. Storing and validating simple state strings inside cookie vectors ensures instant route validation performance without introducing high network latency. [6, 7, 8, 9] 
* Implicit Exclusions: Ensure that static files and asset formats are cleanly filtered by your control logic paths so background page processes do not waste CPU execution time evaluating script or image payloads. [4, 8] 

Would you like to build out the multi-step frontend form view inside the /onboarding/page.tsx file using modern server interaction hooks, or do you want to establish automatic team provisioning routing configurations?

[1] [https://www.reddit.com](https://www.reddit.com/r/nextjs/comments/1o4me50/nextjs_16_beta_replaces_middlewarets_with_proxyts/)
[2] [https://nextjs.org](https://nextjs.org/blog/next-16)
[3] [https://www.cybrosys.com](https://www.cybrosys.com/blog/how-to-use-the-proxyts-file-in-nextjs-16)
[4] [https://vercel.com](https://vercel.com/academy/nextjs-foundations/proxy-basics)
[5] [https://medium.com](https://medium.com/@brianonchain/nextjs-server-vs-client-state-management-702fb756682e)
[6] [https://auth0.com](https://auth0.com/blog/whats-new-nextjs-16/)
[7] [https://www.youtube.com](https://www.youtube.com/watch?v=zNgCFXZLoRk&t=174)
[8] [https://www.cybrosys.com](https://www.cybrosys.com/blog/how-to-use-the-proxyts-file-in-nextjs-16)
[9] [https://nextjs.org](https://nextjs.org/docs/app/getting-started/proxy)
