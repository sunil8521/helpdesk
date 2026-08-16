# 🎧 HelpDesk — AI-Powered Customer Support Platform

> An intelligent help desk  that lets businesses deploy a customizable AI chat widget on their website. Visitors chat with a **LangGraph-powered AI agent** backed by a knowledge base — and when needed, conversations seamlessly escalate to human agents in real-time.

---

## 🏗️ Architecture

*To update this diagram, open `.excalidraw` in VSCode and export it as `architecture.png` to the root folder.*

---

## ✨ Features

### 🤖 AI Agent
- **LangGraph StateGraph** orchestration with automatic tool-calling loops
- **Google Gemini** LLM (configurable model, temperature, tone, response length)
- **MongoDB Atlas Vector Search** for RAG-based knowledge retrieval
- **Confidence thresholds** — AI only answers when it's sure; otherwise escalates or admits uncertainty
- **Persistent memory** via `MongoDBSaver` checkpointer — the AI remembers the full conversation

### 💬 Embeddable Chat Widget
- Drop-in `<script>` tag — works on any website
- Real-time AI responses via Next.js Server Actions
- Automatic lead capture (name, email, phone)
- Seamless handoff to human agents via Socket.IO
- Continue / Start New Chat flows for returning visitors

### 🖥️ Admin Dashboard
- **Inbox** — Real-time human chat with visitors (claim, assign, resolve)
- **Leads** — Auto-captured visitor contacts with search & filtering
- **Knowledge Base** — Upload docs, scrape URLs, manage AI training data
- **Team** — Invite members, assign roles (owner / admin / agent)
- **Settings** — Configure AI agent personality, model, thresholds
- **Widget Customizer** — Customize colors, branding, welcome messages

### 🔌 Real-Time Infrastructure
- Custom Node.js server running **Next.js + Socket.IO** on a single port
- JWT-based auth for both visitors (tickets) and agents (tokens)
- Workspace-scoped rooms for multi-tenant isolation
- Routing service: `ai → waiting → human → resolved → ai`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Custom Node.js Server                        │
│                    (server.ts — port 3000)                           │
│  ┌───────────────────────┐   ┌────────────────────────────────────┐ │
│  │     Next.js 16        │   │       Socket.IO Server             │ │
│  │  (App Router + RSC)   │   │   (socket-server.ts)               │ │
│  │                       │   │                                    │ │
│  │  Server Actions:      │   │  Events:                           │ │
│  │  • sendMessageToAi()  │   │  • message:send / message:created  │ │
│  │  • captureLeadAction()│   │  • conversation:claim / assign     │ │
│  │  • getChatHistory()   │   │  • conversation:route-changed      │ │
│  │                       │   │  • visitor:profile-updated          │ │
│  └───────────────────────┘   └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LangGraph AI Agent                              │
│                       (graph.ts)                                    │
│                                                                     │
│   START ──► chatBot ◄──► tools ──► chatBot ──► END                  │
│               │           │                                         │
│               │           ├─ 🔍 search_knowledge_base               │
│               │           │    └─ MongoDB Atlas Vector Search        │
│               │           ├─ 📧 capture_user_details                │
│               │           │    └─ Save lead + Socket.IO emit        │
│               │           └─ 🚨 escalate_to_human                   │
│               │                └─ Status → "waiting"                │
│               │                                                     │
│               ▼                                                     │
│   ┌─────────────────────┐  ┌──────────────────────────┐             │
│   │  Google Gemini LLM  │  │  MongoDBSaver            │             │
│   │  (ChatGoogle)       │  │  (Checkpointer/Memory)   │             │
│   └─────────────────────┘  └──────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       MongoDB Atlas                                 │
│                                                                     │
│   Collections:                                                      │
│   • workspaces        — Multi-tenant workspace config               │
│   • conversations     — Chat sessions (status, visitor info)        │
│   • messages          — All chat messages (visitor/ai/agent/system)  │
│   • agents            — AI agent configuration per workspace        │
│   • knowledge_entries — Uploaded knowledge base documents            │
│   • vectors           — Embeddings for semantic search              │
│   • checkpoints       — LangGraph conversation memory               │
│   • users / members   — Auth & team management                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, React 19, Server Actions) |
| **AI Orchestration** | LangGraph (`@langchain/langgraph`) |
| **LLM** | Google Gemini via `@langchain/google` |
| **Embeddings** | Gemini Embedding 001 (1536 dims) |
| **Vector Search** | MongoDB Atlas Vector Search |
| **Database** | MongoDB + Mongoose 9 |
| **Real-Time** | Socket.IO 4 |
| **Auth** | NextAuth v4 + JWT |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **State** | Zustand |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **Background Jobs** | Inngest |
| **Email** | Nodemailer |
| **Runtime** | Node.js with TSX loader |

---

## 📁 Project Structure

```
help-desk/
├── server.ts                  # Custom Node.js server (Next.js + Socket.IO)
├── app/
│   ├── actions/               # Server Actions (chat, leads, knowledge, team)
│   ├── queries/               # Cached queries with "use cache" (leads, knowledge, dashboard)
│   ├── dashboard/             # Admin dashboard pages
│   │   ├── inbox/             # Real-time human chat inbox
│   │   ├── leads/             # Captured leads table
│   │   ├── knowledge/         # Knowledge base management
│   │   ├── team/              # Team member management
│   │   ├── settings/          # AI agent & workspace settings
│   │   └── widget/            # Widget customizer
│   ├── widget/                # Embeddable chat widget (iframe)
│   ├── login/ signup/         # Auth pages
│   └── onboarding/            # Workspace setup flow
├── lib/
│   ├── ai/
│   │   ├── graph.ts           # LangGraph StateGraph definition
│   │   ├── tools.ts           # AI tools (search KB, capture details, escalate)
│   │   ├── llm.ts             # Google Gemini singleton factory
│   │   ├── vector-store.ts    # MongoDB Atlas Vector Search client
│   │   ├── embeddings.ts      # Gemini embedding model config
│   │   ├── checkpoint.ts      # MongoDBSaver for conversation memory
│   │   ├── agent-cache.ts     # Agent config caching
│   │   └── agent-instructions.ts  # Dynamic system prompt builder
│   ├── chat/
│   │   ├── socket-server.ts   # Socket.IO server (all real-time events)
│   │   ├── socket-auth.ts     # JWT auth middleware (visitor + agent)
│   │   ├── socket-notify.ts   # HTTP-based socket emit helper
│   │   ├── routing-service.ts # Conversation routing (claim/assign/resolve)
│   │   └── use-socket.ts      # React hook for Socket.IO client
│   ├── db/
│   │   ├── models/            # Mongoose models
│   │   └── connect.ts         # MongoDB connection singleton
│   └── auth/                  # Auth utilities & workspace resolver
├── components/
│   ├── widget/                # Chat widget UI components
│   ├── inbox/                 # Inbox sidebar & chat window
│   ├── helpdesk/              # Dashboard UI (leads table, etc.)
│   ├── knowledge/             # Knowledge base UI
│   └── dashboard/             # Dashboard overview components
└── store/                     # Zustand stores
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **MongoDB Atlas** cluster with Vector Search index
- **Google API Key** (Gemini)
- **pnpm** (recommended)

### 1. Clone & Install

```bash
git clone https://github.com/sunil8521/help-desk.git
cd help-desk
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# AI
GOOGLE_API_KEY=your-gemini-api-key

# Storage (Cloudflare R2)
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=...
CLOUDFLARE_R2_ENDPOINT=...
CLOUDFLARE_R2_PUBLIC_URL=...

# Server
PORT=3000
```

### 3. MongoDB Atlas Setup

1. Create a **Vector Search Index** named `vector_index` on the `vectors` collection:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "workspaceId"
    }
  ]
}
```

### 4. Run

```bash
pnpm run dev
```

This starts the custom Node.js server with both **Next.js** and **Socket.IO** on `http://localhost:3000`.

---

## 🔄 How the AI Works

1. **Visitor sends message** → `sendMessageToAi()` server action
2. **Message saved** to MongoDB, then **LangGraph invoked**
3. **LangGraph** loads conversation memory from `MongoDBSaver` checkpointer
4. **Gemini LLM** receives system prompt (tone, role, threshold) + conversation history
5. **LLM decides** whether to respond directly or call a tool:
   - `search_knowledge_base` → Vector search on MongoDB Atlas → Returns relevant docs
   - `capture_user_details` → Saves visitor name/email → Emits socket event
   - `escalate_to_human` → Sets status to `waiting` → Notifies dashboard agents
6. **Tool results loop back** to LLM via `toolsCondition` edge
7. **Final response** saved as AI message → returned to widget

### Conversation States

```
🤖 ai  ──►  ⏳ waiting  ──►  👨‍💼 human  ──►  ✅ resolved
  ▲                                              │
  └──────────────────────────────────────────────┘
                (return to AI / continue chat)
```

---

## 🧩 Embed the Widget

Add this to any website:

```html
<script
  src="https://your-domain.com/widget/loader.js"
  data-workspace-id="ws_xxxxx"
  async
></script>
```

The widget loads in an iframe and communicates via server actions (AI mode) and Socket.IO (human mode).

---

## 📄 License

MIT

---

Built with ❤️ by [Sunil Maharana](https://github.com/sunil8521)
