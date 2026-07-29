# Realtime Chat Routing Plan

## Goal

Add Socket.IO so a visitor and support team see new messages, assignments, and AI/human routing changes immediately.

MongoDB remains the source of truth. Socket.IO delivers persisted changes; it must not be the only place that knows a message or routing state exists.

## Current Starting Point

- `Conversation.status` already models `ai`, `waiting`, `human`, and `resolved`.
- `Message.senderType` already supports `visitor`, `ai`, `agent`, and `system`.
- The widget sends through `handleWidgetMessage`; it currently waits for an AI response.
- The inbox is currently mock UI, so it must be converted to load and mutate real conversations before it can be realtime.

## Routing States

Keep `Conversation.status` as the authoritative routing state:

| Status | Meaning | Who replies to a visitor message |
| --- | --- | --- |
| `ai` | AI owns the conversation. | Persist visitor message, then run the AI workflow. |
| `waiting` | AI requested a handoff; no team member has claimed it yet. | Persist visitor message and notify the workspace support room. Do not run AI. |
| `human` | A named support member owns the conversation. | Persist visitor message and emit it to the assigned agent. Do not run AI. |
| `resolved` | Conversation is closed. | Reject or explicitly reopen through a separate action. |

Do not derive routing from the last sender. Always read the persisted conversation status.

## Required Data Changes

### Conversation

Keep the existing fields and add these fields:

```ts
routingVersion: number;        // Increment whenever status/assignee changes.
routingChangedAt: Date;
routingChangedBy?: ObjectId;   // User who claimed, reassigned, or returned to AI.
lastSequence: number;          // Monotonically increasing message order per conversation.
```

`assignedAgentUserId` remains the human owner. It is cleared when the conversation returns to `ai`.

### Message

Keep `senderType: "system"` and add structured data for auditability and reliable UI rendering:

```ts
sequence: number;
clientMessageId?: string;      // Visitor/agent-generated UUID for idempotency.
systemEventType?:
  | "handoff_requested"
  | "agent_joined"
  | "agent_assigned"
  | "ai_resumed"
  | "conversation_resolved";
metadata?: {
  fromStatus?: "ai" | "waiting" | "human" | "resolved";
  toStatus?: "ai" | "waiting" | "human" | "resolved";
  actorUserId?: ObjectId;
  assignedAgentUserId?: ObjectId;
  reason?: string;
};
```

Use a unique compound index on `{ conversationId, clientMessageId }` when `clientMessageId` exists. Retries from an unstable browser connection will then create one message, not duplicates.

## Persisted System Messages

Every routing change creates one `Message` with `senderType: "system"` in the same database transaction as the conversation update.

Examples:

| Transition | System message content |
| --- | --- |
| AI -> waiting | "A support agent has been notified." |
| waiting -> human | "Alex Rivera joined the conversation." |
| human -> ai | "AI assistant resumed the conversation." |
| human -> resolved | "This conversation was marked as resolved." |

The widget and inbox render these as neutral centered timeline messages. Do not create them only in React state; they must appear after a refresh and in chat history.

## Server-Side Domain Services

Create a server-only routing service, for example `lib/chat/routing-service.ts`. Socket handlers, Server Actions, and AI tools all call this service rather than changing `Conversation.status` directly.

Required operations:

```ts
requestHumanHandoff({ conversationId, reason, actor: "ai" })
claimConversation({ conversationId, agentUserId })
assignConversation({ conversationId, agentUserId, actorUserId })
returnConversationToAi({ conversationId, actorUserId })
resolveConversation({ conversationId, actorUserId })
createMessage({ conversationId, workspaceId, sender, clientMessageId, content })
```

Each routing operation must:

1. Verify the workspace and actor permissions.
2. Atomically check the expected current status.
3. Update `status`, assignee, `routingVersion`, and timestamps.
4. Insert the associated `system` message with the next sequence number.
5. Commit before emitting Socket.IO events.

Use a MongoDB transaction when the deployment supports replica sets. If transactions are not available, use a conditional `findOneAndUpdate` on `routingVersion`, then insert the system message with a retry-safe operation.

## AI Handoff and Race Prevention

The AI tool `escalate_to_human` must call `requestHumanHandoff`, not just set the status by itself.

When the visitor sends a message while status is `ai`:

1. Persist the visitor message and capture the current `routingVersion`.
2. Emit the saved visitor message to the conversation room and workspace support room.
3. Run the LLM asynchronously.
4. Before saving the LLM answer, reread the conversation and verify `status === "ai"` and the same `routingVersion`.
5. Only then persist and emit the AI reply.

If an agent claims the chat while the LLM is running, the version changes. Discard the late AI result. This prevents an AI reply appearing after “Alex joined the conversation.”

The system should not generate an AI reply merely because an agent returns the chat to AI. It resumes AI handling on the next visitor message.

## Socket.IO Architecture

### Deployment Decision

Socket.IO needs long-lived processes. A Next.js Server Action alone is not a Socket.IO server.

- Local development or a self-hosted Node/Docker deployment: run Next.js and Socket.IO from a custom HTTP server.
- Multi-instance production: run Socket.IO on a dedicated realtime gateway and use the Redis adapter so rooms work across instances.
- Serverless-only platforms without persistent WebSocket support: deploy the Socket.IO gateway separately, or use a managed realtime provider instead.

Install `socket.io` on the server and `socket.io-client` in the widget/inbox clients. Add Redis and `@socket.io/redis-adapter` only when running more than one gateway instance.

### Rooms

Never broadcast conversation content to the entire workspace.

```txt
conversation:<conversationId>      // Visitor plus authorized team members viewing it.
workspace:<workspaceObjectId>:team // Workspace team; new waiting chats and list updates only.
user:<agentUserId>                 // Optional personal assignment notifications.
```

### Authentication

Do not let a browser join a room by submitting arbitrary `workspaceId` or `conversationId` values.

1. Widget requests a short-lived signed visitor socket ticket after its conversation is created or resumed.
2. The ticket contains `conversationId`, `workspaceId`, visitor session ID, expiry, and an allowed-room claim.
3. Dashboard users authenticate with their NextAuth session/JWT.
4. The Socket.IO handshake validates the identity. The server checks `WorkspaceMember` before a team member can join a conversation or mutate it.

The public widget script should never receive credentials that grant access to other conversations in the workspace.

## Event Contract

Use acknowledgement callbacks for every command. The client renders optimistic messages as `pending` and replaces them with the persisted payload from the acknowledgement or broadcast.

### Client to server

| Event | Sender | Required fields | Result |
| --- | --- | --- | --- |
| `conversation:join` | widget/team | authenticated ticket/session | Joins only allowed rooms and receives current route. |
| `message:send` | widget | `clientMessageId`, `content` | Persists visitor message, then routes to AI or human. |
| `agent:message:send` | team | `conversationId`, `clientMessageId`, `content` | Requires a workspace member and an active/claimed human route. |
| `conversation:claim` | team | `conversationId` | Atomically sets `waiting -> human`, assigns actor, creates `agent_joined`. |
| `conversation:assign` | owner/admin | `conversationId`, `agentUserId` | Assigns or reassigns the human owner. |
| `conversation:return-to-ai` | team | `conversationId` | Sets `human -> ai`, clears assignee, creates `ai_resumed`. |
| `conversation:resolve` | team | `conversationId` | Sets `resolved`, creates a system event. |

### Server to client

| Event | Audience | Payload |
| --- | --- | --- |
| `message:created` | conversation room, relevant team room | Fully persisted message including ID, sequence, sender, and timestamp. |
| `conversation:route-changed` | conversation room, team room | Status, assignee, routing version, and system message. |
| `conversation:assigned` | assigned user and conversation room | Conversation summary and assigned agent. |
| `conversation:list-updated` | workspace team room | Lightweight inbox row: status, last message, assignee, unread count. |
| `agent:presence` | workspace team room | Online/in-chat/offline presence only; never message content. |

For reconnects, fetch persisted messages after the last known `sequence`. Socket events are not a replacement for history recovery.

## Visitor Message Flow

```txt
Widget -> message:send(clientMessageId, content)
  -> authenticate visitor ticket
  -> load conversation and current status
  -> persist visitor Message(sequence N)
  -> emit message:created
  -> status ai: start guarded AI work
       -> persist AI Message(sequence N+1) only if route/version still ai
       -> emit message:created
  -> status waiting/human: emit conversation:list-updated to team
```

The widget header should use `conversation:route-changed` to show either `AI` or `Human support`, rather than assuming the agent is always AI.

## Human Claim Flow

```txt
AI detects handoff -> requestHumanHandoff
  -> Conversation ai -> waiting
  -> persist system: "A support agent has been notified."
  -> emit route change to widget and team inbox

Agent clicks Claim -> conversation:claim
  -> Conversation waiting -> human; assignedAgentUserId = agent
  -> persist system: "Alex Rivera joined the conversation."
  -> emit route change and system message to widget and inbox

Agent clicks Return to AI -> conversation:return-to-ai
  -> Conversation human -> ai; clear assignedAgentUserId
  -> persist system: "AI assistant resumed the conversation."
  -> emit route change and system message to widget and inbox
```

## UI Changes

### Widget

- Replace the Server Action send path with `message:send` over Socket.IO after session/ticket initialization.
- Keep `getChatHistory` for initial load and reconnection recovery.
- Render persisted `system` messages exactly as stored.
- Update the header badge and input-state from the server route event.
- Do not add a local “agent notified” message; wait for the persisted system message broadcast.

### Inbox

- Replace `lib/mock-data` with database-backed conversation list/detail queries.
- Subscribe the authenticated team client to `workspace:<id>:team` and the selected conversation room.
- Add explicit Claim, Assign, Return to AI, and Resolve controls.
- Disable or reject an agent reply until the conversation is claimed/assigned to that agent, except for admins/owners who can reassign.
- Append incoming messages and system events by `sequence`, not by client arrival order.

## Implementation Order

1. Add the schema fields, indexes, and a migration/backfill for `routingVersion`, `lastSequence`, and message sequence.
2. Implement and test the routing service with no sockets. Cover claim races, duplicate client message IDs, AI handoff, return-to-AI, and a late AI result after a human claim.
3. Convert the inbox from mock state to database-backed conversations and routing actions.
4. Add the Socket.IO gateway, handshake authentication, room authorization, and event types.
5. Integrate the widget: socket ticket, initial history, message send, route badge, and system messages.
6. Integrate the inbox subscriptions and claim/return controls.
7. Add Redis adapter, metrics, reconnect tests, and load testing before running multiple realtime instances.

## Acceptance Criteria

- A visitor message is persisted exactly once and appears live in the assigned human inbox.
- AI answers only while the persisted route is `ai`.
- “Talk to a human” creates a persisted system message and changes the route to `waiting`.
- Claiming a conversation creates a persisted “agent joined” message and stops AI replies.
- Returning the chat to AI creates a persisted “AI resumed” message; the next visitor message goes to AI.
- Refreshing either the widget or inbox reconstructs the same history and route from MongoDB.
- Unauthorized users cannot subscribe to or send messages for another workspace or conversation.










I’ll inspect the existing help-desk structure and the realtime plan so the invite design matches your current app instead of giving a generic answer.

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

• The realtime plan confirms the missing prerequisite: team membership and workspace-scoped auth. I’m checking the actual auth/schema shape now so the invite recommendation is concrete.

• Explored

• Your repo already has WorkspaceMember and Invite models, so this should be solved as membership-based workspaces, not full heavy multi-tenant infrastructure. I’m reading those exact
  files.

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

• Key current state: signup always creates a new workspace owner, but the data model can already support invited agents joining an existing workspace. The missing part is the invitation
  acceptance flow and permission checks.

• Explored
  └ Read package.json, page.tsx, layout.tsx, proxy.ts

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

• I’ll also verify conversation/widget workspace fields because socket permissions depend on consistent workspace scoping.

• Explored
  └ Read Conversation.ts, widget.ts, WidgetConfig.ts, Message.ts

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

• Yes. For your app, don’t build “full multi-tenant” now. You already have the right simpler model:

  - User = global account
  - Workspace = company/account/team
  - WorkspaceMember = user belongs to workspace with role
  - Invite = pending permission to join workspace
  - Conversation, Message, WidgetConfig already have workspaceId

  That is basically how Notion/Slack/Zendesk-style apps work logically. They are still multi-tenant, but not “separate DB per customer”. They use one app/database and scope everything by
  workspaceId.

  The important rule:

  > Normal signup creates a new workspace owner. Invite signup must join an existing workspace and must not create a new workspace.

  Your current problem is here: registerUserAction() always creates:

  1. user
  2. workspace
  3. owner membership

  So if an invited agent uses the normal signup page, they become owner of a new workspace, which is wrong.

  Recommended flow:

  Owner/Admin -> sends invite
  Invite row created -> email link sent
  Agent opens /invite/:token
  If no account -> create account from invite
  If account exists -> login then accept
  System creates WorkspaceMember
  Redirect agent to dashboard

  Use this design.

  ### 1. Keep normal signup as-is

  Normal /signup means:

  new user signs up directly
  => create new Workspace
  => add user as owner

  This is fine for your SaaS owner signup.

  ### 2. Add invite-specific signup/login

  Create route like:

  /invite/[token]

  This page should:

  - read invite token
  - check invite exists
  - check status is pending
  - check expiresAt > now
  - show invited workspace name
  - show email address being invited

  Then:

  If user is not logged in:

  - if email already exists: ask them to log in
  - if email does not exist: show “Create account” form

  If user is logged in:

  - logged-in email must match invite email
  - then accept invite

  Do not let someone accept agent@company.com invite while logged in as other@gmail.com.

  ### 3. Add a separate invite register action

  Do not reuse your current registerUserAction() for invite users.

  You need something like:

  registerInvitedUserAction({
    token,
    name,
    password,
  })

  This action should:

  1. Find Invite by token
  2. Validate pending + not expired
  3. Use invite.email as the account email
  4. Create User
  5. Create WorkspaceMember:
     workspaceId = invite.workspaceId
     userId = new user id
     role = invite.role
  6. Mark Invite as accepted
  7. Do NOT create Workspace

  That is the main fix.

  ### 4. Add accept action for existing users

  Something like:

  acceptInviteAction(token)

  It should:

  1. Get current session user
  2. Find invite
  3. Validate pending + not expired
  4. Ensure session.user.email === invite.email
  5. Create WorkspaceMember
  6. Mark invite accepted
  7. Redirect /dashboard

  Your WorkspaceMember model already has this useful index:

  WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

  So duplicate joining is already protected.

  ### 5. Sending email with Nodemailer + Gmail SMTP

  Install:

  pnpm add nodemailer
  pnpm add -D @types/nodemailer

  Environment variables:

  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=465
  SMTP_SECURE=true
  SMTP_USER=yourgmail@gmail.com
  SMTP_PASS=your_google_app_password
  EMAIL_FROM="HenDesk <yourgmail@gmail.com>"
  NEXTAUTH_URL=http://localhost:3000

  Invite email link:

  ${NEXTAUTH_URL}/invite/${token}

  Do not put workspace permissions in the URL. The token should only identify a pending invite stored in DB.

  ### 6. Team invite action

  From your team page, the form is currently fake local UI. Replace it with a server action:

  sendWorkspaceInviteAction({
    email,
    role
  })

  It should:

  1. resolveUserWorkspace()
  2. check current user's role is owner/admin
  3. create Invite
  4. send email
  5. update team/invite cache

  Agents should not invite other agents unless you want that policy.

  ### 7. What about “multi-tenant”?

  You do not need separate tenant infrastructure now.

  Use this rule everywhere:

  Every protected query must include workspaceId.
  Every protected mutation must check WorkspaceMember.

  Example:

  Conversation.find({
    workspaceId: ctx.workspace._id,
  });

  Bad:

  Conversation.find({});

  Bad:

  Conversation.findById(conversationId);

  Better:

  Conversation.findOne({
    _id: conversationId,
    workspaceId: ctx.workspace._id,
  });

  That is enough for your current product.

  ### One issue in your current code

  resolveUserWorkspace() does this:

  const membership = await WorkspaceMember.findOne({ userId });

  That means one user can technically belong to many workspaces, but your app only picks the first one.

  For now, choose the simple version:

  One user = one active workspace
  No workspace switcher yet

  That is okay.

  Later, when you want Notion-style multiple workspaces, add:

  /dashboard/[workspaceSlug]/...

  or store:

  activeWorkspaceId

  in session/user preferences.

  But do not build that now if your goal is realtime chat. It will slow you down.

  ### Correct implementation order

  Do this before Socket.IO:

  3. Add sendWorkspaceInviteAction
  4. Add /invite/[token] page
  5. Add registerInvitedUserAction
  6. Add acceptInviteAction
      - requireWorkspaceMember
      - requireWorkspaceAdminOrOwner

  9. Then continue Socket.IO plan

  This invite system is enough for realtime support because now every agent connection can be checked against WorkspaceMember before joining workspace/team rooms.

─ Worked for 1m 27s ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────


› one this i want to ask like now the log in pag just used to  login ok  like user can  login if a agent use that  then it will also find which workspace then  login right ?  and youd
  ais to make like notion zenddesk like you will do dashboard/id but if a user work in multiple workspace then  how it will chosee which to login like how  login also fix tell me how
  then we will start implemetn


• Yes. Your current login can work for both owners and invited agents.

  Login should only authenticate the User. It should not decide “owner vs agent” by itself. After login, the app loads that user’s workspace membership from WorkspaceMember.

  Right now your code does:

  const memberDoc = await WorkspaceMember.findOne({ userId });

  So if an invited agent logs in, it will find their WorkspaceMember row and load that workspace. That part is correct for one-workspace-per-user.

  The problem only appears when one user can belong to multiple workspaces.

  ## Good simple approach for now

  For your current app, I recommend this:

  One user can belong to multiple workspaces in DB,
  but the UI uses one active workspace at a time.

  Then login flow becomes:

  User logs in
  ↓
  Find all WorkspaceMember rows for this user
  ↓
  If user has 0 workspaces:
      send to onboarding
  If user has 1 workspace:
      send to /dashboard
  If user has multiple workspaces:
      send to /workspaces/select

  That is how Notion/Slack-style apps usually handle it.

  ## URL design

  Do this eventually:

  /dashboard/[workspaceSlug]/inbox
  /dashboard/[workspaceSlug]/team
  /dashboard/[workspaceSlug]/settings

  Example:

  /dashboard/acme-support/inbox
  /dashboard/my-shop/team

  But to move fast now, you can keep:

  /dashboard/inbox
  /dashboard/team
  /dashboard/settings

  and store active workspace in session/cookie.

  For your current stage, I would not convert the whole dashboard to /dashboard/[workspaceSlug] yet. That is a bigger refactor.

  ## Best practical design now

  Use an activeWorkspaceId cookie.

  After login:

  1 workspace  -> set activeWorkspaceId cookie -> /dashboard
  2+ workspace -> /workspaces/select

  Then resolveUserWorkspace() should read that cookie.

  Pseudo logic:

  const memberships = await WorkspaceMember.find({ userId });

  if (memberships.length === 0) {
    return null;
  }

  const activeWorkspaceId = cookies().get("activeWorkspaceId")?.value;

  let membership;

  if (activeWorkspaceId) {
    membership = memberships.find(
      (m) => m.workspaceId.toString() === activeWorkspaceId
    );
  }

  if (!membership) {
    membership = memberships[0];
  }

  So invited agent login works:

  agent logs in
  ↓
  system checks WorkspaceMember
  ↓
  agent belongs to workspace
  ↓
  dashboard loads that workspace

  ## Signup vs invite signup

  Keep two different meanings:

  ### Normal signup

  /signup

  Creates:

  User
  Workspace
  WorkspaceMember role=owner

  ### Invite signup

  /invite/[token]

  Creates:

  User
  WorkspaceMember role=agent/admin

  Does not create workspace.

  ## Existing user accepting invite

  If an existing user is invited to another workspace:

  User logs in
  ↓
  Opens invite link
  ↓
  Accept invite
  ↓
  New WorkspaceMember is created
  ↓
  Now user has multiple workspaces
  ↓
  Redirect to /workspaces/select or set new workspace active

  I recommend after accepting invite:

  Set invited workspace as active
  Redirect /dashboard

  That feels clean.

  ## Should login page change?

  Minimal change: no.

  Login page can stay normal:

  email + password

  After successful login, instead of always redirecting to /dashboard, redirect to a small resolver route/page:

  /auth/after-login

  That page/action decides:

  if no workspace and onboarding not complete:
      /onboarding
  if one workspace:
      set active workspace, /dashboard
  if multiple workspaces:

  1. Keep /login UI same.
  2. Add invite flow first.
  3. Add activeWorkspaceId cookie support.
  4. Update resolveUserWorkspace() to use active workspace.
  5. Add /workspaces/select only if user has multiple workspaces.
  6. Later, if needed, migrate URLs to /dashboard/[workspaceSlug].

  This gives you Notion/Zendesk behavior without a large multi-tenant rewrite.

⚠ Heads up, you have less than 10% of your monthly limit left. Run /status for a breakdown.

 
› Explain this codebase
 
  gpt-5.6-luna medium · ~/_codding/GO/hen




