"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/db/connect.ts
async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false
    };
    cached.promise = import_mongoose.default.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
var import_mongoose, MONGODB_URI, cached;
var init_connect = __esm({
  "lib/db/connect.ts"() {
    "use strict";
    import_mongoose = __toESM(require("mongoose"));
    MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
    }
    cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });
  }
});

// lib/db/models/WorkspaceMember.ts
var import_mongoose2, WorkspaceMemberSchema, WorkspaceMember;
var init_WorkspaceMember = __esm({
  "lib/db/models/WorkspaceMember.ts"() {
    "use strict";
    import_mongoose2 = __toESM(require("mongoose"));
    WorkspaceMemberSchema = new import_mongoose2.Schema(
      {
        workspaceId: { type: import_mongoose2.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
        userId: { type: import_mongoose2.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        role: { type: String, enum: ["owner", "admin", "agent"], default: "agent" },
        status: { type: String, enum: ["online", "offline", "in_chat"], default: "online" },
        assignedChatsCount: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now }
      },
      { timestamps: true }
    );
    WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
    WorkspaceMember = import_mongoose2.default.models.WorkspaceMember || import_mongoose2.default.model("WorkspaceMember", WorkspaceMemberSchema);
  }
});

// lib/chat/socket-auth.ts
function verifyVisitorTicket(token) {
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    if (decoded.type !== "visitor") return null;
    return decoded;
  } catch (e) {
    return null;
  }
}
function verifyAgentToken(token) {
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    if (decoded.type !== "agent") return null;
    return decoded;
  } catch (e) {
    return null;
  }
}
async function socketAuthMiddleware(socket, next2) {
  var _a, _b;
  const token = (_a = socket.handshake.auth) == null ? void 0 : _a.token;
  const clientType = (_b = socket.handshake.auth) == null ? void 0 : _b.clientType;
  if (!token || !clientType) {
    return next2(new Error("Missing authentication"));
  }
  if (clientType === "visitor") {
    const payload = verifyVisitorTicket(token);
    if (!payload) {
      return next2(new Error("Invalid visitor ticket"));
    }
    socket.data.visitorId = payload.visitorId;
    socket.data.conversationId = payload.conversationId;
    socket.data.workspaceId = payload.workspaceId;
    return next2();
  }
  if (clientType === "agent") {
    const payload = verifyAgentToken(token);
    if (!payload) {
      return next2(new Error("Invalid agent token"));
    }
    await connectToDatabase();
    const member = await WorkspaceMember.findOne({
      userId: payload.userId,
      workspaceId: payload.workspaceId
    });
    if (!member) {
      return next2(new Error("Not a workspace member"));
    }
    socket.data.userId = payload.userId;
    socket.data.agentWorkspaceId = payload.workspaceId;
    socket.data.agentRole = member.role;
    return next2();
  }
  return next2(new Error("Invalid client type"));
}
var import_jsonwebtoken, JWT_SECRET;
var init_socket_auth = __esm({
  "lib/chat/socket-auth.ts"() {
    "use strict";
    import_jsonwebtoken = __toESM(require("jsonwebtoken"));
    init_connect();
    init_WorkspaceMember();
    JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-dev-secret";
  }
});

// lib/db/models/Conversation.ts
var import_mongoose3, ConversationSchema, Conversation;
var init_Conversation = __esm({
  "lib/db/models/Conversation.ts"() {
    "use strict";
    import_mongoose3 = __toESM(require("mongoose"));
    ConversationSchema = new import_mongoose3.Schema(
      {
        workspaceId: { type: import_mongoose3.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
        visitorId: { type: String, required: true, index: true },
        visitorNumber: { type: Number, default: 0 },
        visitor: {
          name: { type: String, required: true, default: "Anonymous Visitor" },
          email: { type: String, default: "" },
          phone: { type: String, default: "" },
          device: { type: String, default: "Desktop / Chrome" },
          currentPage: { type: String, default: "/" }
        },
        status: {
          type: String,
          enum: ["ai", "waiting", "human", "resolved"],
          default: "ai",
          index: true
        },
        assignedAgentUserId: { type: import_mongoose3.Schema.Types.ObjectId, ref: "User" },
        handoffReason: { type: String, default: "" },
        csatRating: { type: Number, min: 1, max: 5 },
        // Routing fields
        routingVersion: { type: Number, default: 0 },
        routingChangedAt: { type: Date, default: Date.now },
        routingChangedBy: { type: import_mongoose3.Schema.Types.ObjectId, ref: "User" },
        lastSequence: { type: Number, default: 0 }
      },
      { timestamps: true }
    );
    Conversation = import_mongoose3.default.models.Conversation || import_mongoose3.default.model("Conversation", ConversationSchema);
  }
});

// lib/db/models/Message.ts
var import_mongoose4, MessageMetadataSchema, MessageSchema, Message;
var init_Message = __esm({
  "lib/db/models/Message.ts"() {
    "use strict";
    import_mongoose4 = __toESM(require("mongoose"));
    MessageMetadataSchema = new import_mongoose4.Schema(
      {
        fromStatus: { type: String, enum: ["ai", "waiting", "human", "resolved"] },
        toStatus: { type: String, enum: ["ai", "waiting", "human", "resolved"] },
        actorUserId: { type: import_mongoose4.Schema.Types.ObjectId, ref: "User" },
        assignedAgentUserId: { type: import_mongoose4.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String }
      },
      { _id: false }
    );
    MessageSchema = new import_mongoose4.Schema(
      {
        conversationId: { type: import_mongoose4.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
        workspaceId: { type: import_mongoose4.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
        senderType: {
          type: String,
          enum: ["visitor", "ai", "agent", "system"],
          required: true
        },
        senderUserId: { type: import_mongoose4.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, required: true },
        // Realtime fields
        sequence: { type: Number, required: true, default: 0 },
        clientMessageId: { type: String, sparse: true },
        systemEventType: {
          type: String,
          enum: ["handoff_requested", "agent_joined", "agent_assigned", "ai_resumed", "conversation_resolved"]
        },
        metadata: MessageMetadataSchema,
        createdAt: { type: Date, default: Date.now, index: true }
      }
    );
    MessageSchema.index(
      { conversationId: 1, clientMessageId: 1 },
      { unique: true, partialFilterExpression: { clientMessageId: { $type: "string" } } }
    );
    Message = import_mongoose4.default.models.Message || import_mongoose4.default.model("Message", MessageSchema);
  }
});

// lib/db/models/User.ts
var import_mongoose5, UserSchema, User;
var init_User = __esm({
  "lib/db/models/User.ts"() {
    "use strict";
    import_mongoose5 = __toESM(require("mongoose"));
    UserSchema = new import_mongoose5.Schema(
      {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        avatarUrl: { type: String, default: "" },
        onboardingCompleted: { type: Boolean, default: false }
      },
      { timestamps: true }
    );
    User = import_mongoose5.default.models.User || import_mongoose5.default.model("User", UserSchema);
  }
});

// lib/chat/socket-notify.ts
async function emitVisitorProfileUpdated(workspaceId, conversationId, visitorId, visitorUpdates) {
  try {
    await fetch(`http://127.0.0.1:${PORT}/api/internal/socket-emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: `workspace:${workspaceId.toString()}:team`,
        event: "visitor:profile-updated",
        payload: {
          conversationId,
          visitorId,
          visitorUpdates
        }
      })
    });
  } catch (error) {
    console.error("Failed to emit visitor profile update:", error);
  }
}
var PORT;
var init_socket_notify = __esm({
  "lib/chat/socket-notify.ts"() {
    "use strict";
    PORT = process.env.PORT;
  }
});

// lib/chat/routing-service.ts
async function nextSequence(conversationId) {
  var _a;
  const convo = await Conversation.findByIdAndUpdate(
    conversationId,
    { $inc: { lastSequence: 1 } },
    { returnDocument: "after" }
  );
  return (_a = convo == null ? void 0 : convo.lastSequence) != null ? _a : 1;
}
async function createMessage(params) {
  await connectToDatabase();
  const convOid = new import_mongoose6.default.Types.ObjectId(params.conversationId);
  if (params.clientMessageId) {
    const existing = await Message.findOne({
      conversationId: convOid,
      clientMessageId: params.clientMessageId
    });
    if (existing) return existing;
  }
  const seq = await nextSequence(convOid);
  try {
    const msg = await Message.create({
      conversationId: convOid,
      workspaceId: params.workspaceId,
      senderType: params.senderType,
      senderUserId: params.senderUserId || void 0,
      content: params.content,
      clientMessageId: params.clientMessageId || void 0,
      sequence: seq
    });
    return msg;
  } catch (error) {
    const duplicateError = error;
    if (params.clientMessageId && duplicateError.code === 11e3) {
      const existing = await Message.findOne({
        conversationId: convOid,
        clientMessageId: params.clientMessageId
      });
      if (existing) return existing;
    }
    throw error;
  }
}
async function claimConversation(params) {
  await connectToDatabase();
  const agentOid = new import_mongoose6.default.Types.ObjectId(params.agentUserId);
  const convo = await Conversation.findOneAndUpdate(
    { _id: params.conversationId, status: "waiting" },
    {
      $set: {
        status: "human",
        assignedAgentUserId: agentOid,
        routingChangedAt: /* @__PURE__ */ new Date(),
        routingChangedBy: agentOid
      },
      $inc: { routingVersion: 1 }
    },
    { returnDocument: "after" }
  );
  if (!convo) return null;
  const agentName = params.agentName || "A support agent";
  const seq = await nextSequence(convo._id);
  const systemMsg = await Message.create({
    conversationId: convo._id,
    workspaceId: convo.workspaceId,
    senderType: "system",
    content: `${agentName} joined the conversation.`,
    sequence: seq,
    systemEventType: "agent_joined",
    metadata: {
      fromStatus: "waiting",
      toStatus: "human",
      actorUserId: agentOid,
      assignedAgentUserId: agentOid
    }
  });
  return { conversation: convo, systemMessage: systemMsg };
}
async function assignConversation(params) {
  await connectToDatabase();
  const agentOid = new import_mongoose6.default.Types.ObjectId(params.agentUserId);
  const actorOid = new import_mongoose6.default.Types.ObjectId(params.actorUserId);
  const convo = await Conversation.findOneAndUpdate(
    { _id: params.conversationId, status: { $in: ["waiting", "human"] } },
    {
      $set: {
        status: "human",
        assignedAgentUserId: agentOid,
        routingChangedAt: /* @__PURE__ */ new Date(),
        routingChangedBy: actorOid
      },
      $inc: { routingVersion: 1 }
    },
    { returnDocument: "after" }
  );
  if (!convo) return null;
  const agentName = params.agentName || "An agent";
  const seq = await nextSequence(convo._id);
  const systemMsg = await Message.create({
    conversationId: convo._id,
    workspaceId: convo.workspaceId,
    senderType: "system",
    content: `Conversation assigned to ${agentName}.`,
    sequence: seq,
    systemEventType: "agent_assigned",
    metadata: {
      fromStatus: "waiting",
      toStatus: "human",
      actorUserId: actorOid,
      assignedAgentUserId: agentOid
    }
  });
  return { conversation: convo, systemMessage: systemMsg };
}
async function returnConversationToAi(params) {
  await connectToDatabase();
  const actorOid = new import_mongoose6.default.Types.ObjectId(params.actorUserId);
  const previous = await Conversation.findOne({
    _id: params.conversationId,
    status: { $in: ["waiting", "human"] }
  }).select("status");
  if (!previous) return null;
  const convo = await Conversation.findOneAndUpdate(
    { _id: params.conversationId, status: { $in: ["waiting", "human"] } },
    {
      $set: {
        status: "ai",
        routingChangedAt: /* @__PURE__ */ new Date(),
        routingChangedBy: actorOid
      },
      $unset: { assignedAgentUserId: 1 },
      $inc: { routingVersion: 1 }
    },
    { returnDocument: "after" }
  );
  if (!convo) return null;
  const seq = await nextSequence(convo._id);
  const systemMsg = await Message.create({
    conversationId: convo._id,
    workspaceId: convo.workspaceId,
    senderType: "system",
    content: "AI assistant resumed the conversation.",
    sequence: seq,
    systemEventType: "ai_resumed",
    metadata: {
      fromStatus: previous.status,
      toStatus: "ai",
      actorUserId: actorOid
    }
  });
  return { conversation: convo, systemMessage: systemMsg };
}
async function resolveConversation(params) {
  await connectToDatabase();
  const actorOid = new import_mongoose6.default.Types.ObjectId(params.actorUserId);
  const convo = await Conversation.findOneAndUpdate(
    { _id: params.conversationId, status: { $ne: "resolved" } },
    {
      $set: {
        status: "resolved",
        routingChangedAt: /* @__PURE__ */ new Date(),
        routingChangedBy: actorOid
      },
      $inc: { routingVersion: 1 }
    },
    { returnDocument: "after" }
  );
  if (!convo) return null;
  const seq = await nextSequence(convo._id);
  const systemMsg = await Message.create({
    conversationId: convo._id,
    workspaceId: convo.workspaceId,
    senderType: "system",
    content: "This conversation was marked as resolved.",
    sequence: seq,
    systemEventType: "conversation_resolved",
    metadata: {
      toStatus: "resolved",
      actorUserId: actorOid
    }
  });
  return { conversation: convo, systemMessage: systemMsg };
}
var import_mongoose6;
var init_routing_service = __esm({
  "lib/chat/routing-service.ts"() {
    "use strict";
    init_Conversation();
    init_Message();
    init_connect();
    import_mongoose6 = __toESM(require("mongoose"));
    init_socket_notify();
  }
});

// lib/ai/embeddings.ts
var import_openai, embeddings;
var init_embeddings = __esm({
  "lib/ai/embeddings.ts"() {
    "use strict";
    import_openai = require("@langchain/openai");
    embeddings = new import_openai.OpenAIEmbeddings({
      model: "gemini-embedding-001",
      apiKey: process.env.GOOGLE_API_KEY,
      dimensions: 1536,
      batchSize: 100,
      // Google API limits batch embedding to 100 requests at a time
      configuration: {
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
      }
    });
  }
});

// lib/ai/vector-store.ts
async function getMongoClient() {
  if (!cachedClient) {
    cachedClient = new import_mongodb2.MongoClient(MONGODB_URI2);
    await cachedClient.connect();
  }
  return cachedClient;
}
async function getVectorStore() {
  const client = await getMongoClient();
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  return new import_mongodb.MongoDBAtlasVectorSearch(embeddings, {
    // The app uses MongoDB v7 while LangChain currently types this option against v6.
    collection,
    indexName: INDEX_NAME,
    textKey: "text",
    embeddingKey: "embedding"
  });
}
async function searchWorkspaceVectorsWithScores(workspaceId, query, topK = 5) {
  const vectorStore = await getVectorStore();
  return vectorStore.similaritySearchWithScore(query, topK, {
    preFilter: {
      workspaceId
    }
  });
}
var import_mongodb, import_mongodb2, MONGODB_URI2, DB_NAME, COLLECTION_NAME, INDEX_NAME, cachedClient;
var init_vector_store = __esm({
  "lib/ai/vector-store.ts"() {
    "use strict";
    import_mongodb = require("@langchain/mongodb");
    import_mongodb2 = require("mongodb");
    init_embeddings();
    MONGODB_URI2 = process.env.MONGODB_URI;
    DB_NAME = "helpdesk";
    COLLECTION_NAME = "vectors";
    INDEX_NAME = "vector_index";
    cachedClient = null;
  }
});

// lib/ai/tools.ts
function getConfidenceConfig(config) {
  var _a;
  const agentPayload = (_a = config == null ? void 0 : config.configurable) == null ? void 0 : _a.agentPayload;
  const confidenceThreshold = agentPayload == null ? void 0 : agentPayload.confidenceThreshold;
  return {
    threshold: typeof confidenceThreshold === "number" && Number.isFinite(confidenceThreshold) && confidenceThreshold >= 0 && confidenceThreshold <= 1 ? confidenceThreshold : 0.65,
    fallbackBehavior: (agentPayload == null ? void 0 : agentPayload.humanFallbackBehavior) === "cannot" ? "cannot" : "escalate"
  };
}
var import_cache, import_tools, import_zod, MAX_CONTEXT_CHARS_PER_RESULT, captureUserDetailsTool, escalateToHumanTool, searchKnowledgeBaseTool, allTools;
var init_tools = __esm({
  "lib/ai/tools.ts"() {
    "use strict";
    import_cache = require("next/cache");
    import_tools = require("@langchain/core/tools");
    import_zod = require("zod");
    init_Conversation();
    init_vector_store();
    init_socket_notify();
    MAX_CONTEXT_CHARS_PER_RESULT = 1200;
    captureUserDetailsTool = new import_tools.DynamicStructuredTool({
      name: "capture_user_details",
      description: "Use this tool immediately after the user provides their name and email address to save it to their profile.",
      schema: import_zod.z.object({
        name: import_zod.z.string().describe("The user's full name"),
        email: import_zod.z.string().describe("The user's email address")
      }),
      func: async ({ name, email }, runManager, config) => {
        var _a;
        const sessionId = (_a = config == null ? void 0 : config.configurable) == null ? void 0 : _a.thread_id;
        if (!sessionId) return "Error: Missing session ID";
        try {
          const convo = await Conversation.findOne({ visitorId: sessionId });
          if (convo) {
            convo.visitor.name = name;
            convo.visitor.email = email;
            await convo.save();
            await emitVisitorProfileUpdated(
              convo.workspaceId.toString(),
              convo._id.toString(),
              convo.visitorId,
              { name, email }
            );
            (0, import_cache.revalidateTag)(`leads-${convo.workspaceId.toString()}`, "seconds");
            (0, import_cache.revalidatePath)("/dashboard/leads", "page");
            return `Successfully updated user details to Name: ${name}, Email: ${email}`;
          }
          return "Conversation not found, but details received.";
        } catch (e) {
          return "Failed to save details.";
        }
      }
    });
    escalateToHumanTool = new import_tools.DynamicStructuredTool({
      name: "escalate_to_human",
      description: "Use this tool to route the conversation to a human support agent when you cannot resolve the issue or the user demands a human. Only use if the user provides a valid reason.",
      schema: import_zod.z.object({
        reason: import_zod.z.string().describe("The specific reason the user needs a human agent")
      }),
      func: async ({ reason }, runManager, config) => {
        return `Escalated to human support successfully. Reason: ${reason}. Please inform the user that a human agent has been notified and will be with them shortly.`;
      }
    });
    searchKnowledgeBaseTool = new import_tools.DynamicStructuredTool({
      name: "search_knowledge_base",
      description: "Search the company's knowledge base for answers to user questions (e.g., policies, refund rules, features).",
      schema: import_zod.z.object({
        query: import_zod.z.string().describe("The search query to look up in the knowledge base")
      }),
      func: async ({ query }, runManager, config) => {
        var _a, _b, _c;
        const workspaceId = (_a = config == null ? void 0 : config.configurable) == null ? void 0 : _a.workspaceId;
        if (!workspaceId) return "Error: Missing workspace ID in config";
        const { threshold, fallbackBehavior } = getConfidenceConfig(config);
        try {
          const matches = await searchWorkspaceVectorsWithScores(workspaceId, query, 4);
          const confidence = (_c = (_b = matches[0]) == null ? void 0 : _b[1]) != null ? _c : 0;
          if (matches.length === 0 || confidence < threshold) {
            return JSON.stringify({
              source: "knowledge_base",
              retrieval: {
                status: matches.length === 0 ? "no_results" : "below_threshold",
                confidence: Number(confidence.toFixed(4)),
                threshold
              },
              note: "No relevant business knowledge found for this query. If this was a business question, please follow your fallback instructions. If this was just casual chat, respond naturally."
            });
          }
          return JSON.stringify({
            source: "knowledge_base",
            retrieval: {
              status: "qualified",
              confidence: Number(confidence.toFixed(4)),
              threshold
            },
            results: matches.map(([document, score]) => ({
              title: String(document.metadata.title || "Knowledge base"),
              sourceUrl: document.metadata.sourceUrl ? String(document.metadata.sourceUrl) : void 0,
              confidence: Number(score.toFixed(4)),
              content: document.pageContent.slice(0, MAX_CONTEXT_CHARS_PER_RESULT)
            }))
          });
        } catch (error) {
          console.error("Knowledge base search failed:", error);
          return JSON.stringify({
            source: "knowledge_base",
            retrieval: { status: "unavailable", confidence: 0, threshold },
            note: "Knowledge base is temporarily unavailable."
          });
        }
      }
    });
    allTools = [searchKnowledgeBaseTool, captureUserDetailsTool, escalateToHumanTool];
  }
});

// lib/ai/checkpoint.ts
async function initCheckpointer() {
  if (checkpointer) return checkpointer;
  await connectToDatabase();
  const client = import_mongoose7.default.connection.getClient();
  if (!client) {
    throw new Error("Failed to get MongoClient from Mongoose");
  }
  checkpointer = new import_langgraph_checkpoint_mongodb.MongoDBSaver({ client });
  return checkpointer;
}
var import_langgraph_checkpoint_mongodb, import_mongoose7, checkpointer;
var init_checkpoint = __esm({
  "lib/ai/checkpoint.ts"() {
    "use strict";
    import_langgraph_checkpoint_mongodb = require("@langchain/langgraph-checkpoint-mongodb");
    import_mongoose7 = __toESM(require("mongoose"));
    init_connect();
  }
});

// lib/ai/llm.ts
function getLlm(model, temperature) {
  const key = `${model}:${temperature}`;
  let llm = llmCache.get(key);
  if (!llm) {
    llm = new import_google.ChatGoogle({
      model,
      temperature,
      apiKey: process.env.GOOGLE_API_KEY
    });
    llmCache.set(key, llm);
  }
  return llm;
}
var import_google, llmCache;
var init_llm = __esm({
  "lib/ai/llm.ts"() {
    "use strict";
    import_google = require("@langchain/google");
    llmCache = /* @__PURE__ */ new Map();
  }
});

// lib/ai/agent-instructions.ts
function formatThreshold(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value.toFixed(2) : "0.65";
}
function buildAgentSystemPrompt(params) {
  const { agent, visitor } = params;
  const fallbackInstruction = agent.humanFallbackBehavior === "escalate" ? 'call the "escalate_to_human" tool with a specific reason, then tell the visitor a human support agent has been notified.' : "say briefly that you cannot verify an answer from the available information and invite the visitor to contact support.";
  return `
You are ${agent.name}, the ${agent.role} for this business.

# PRIMARY RESPONSIBILITY
Resolve customer questions accurately, use the knowledge base for business-specific facts, and never invent policies, prices, product details, account data, timelines, or troubleshooting results.

# ADMIN INSTRUCTIONS
Treat the following as trusted workspace instructions. Follow them when they do not conflict with the rules in this prompt:
<admin_instructions>
${agent.description}
</admin_instructions>

# VISITOR CONTEXT
- Name: ${visitor.name}
- Email: ${visitor.email || "Unknown"}
Do not expose or repeat these details unless they are relevant to the visitor's request.

# VOICE
${toneGuidance[agent.tone]}

# RESPONSE LENGTH
${responseLengthGuidance[agent.responseLength]}
The requested length is a default, not a reason to omit a required safety note, an essential clarification, or the result of a human handoff. Keep Markdown light and functional.

# KNOWLEDGE AND CONFIDENCE
1. For any business-specific question about products, services, policies, pricing, availability, orders, account actions, or troubleshooting, call "search_knowledge_base" before answering.
2. Do not claim a business fact that is not supported by a qualified knowledge-base result.
3. The tool calculates retrieval confidence from the highest MongoDB Atlas vector-search score. The workspace threshold is ${formatThreshold(agent.confidenceThreshold)}.
4. If the tool reports "below_threshold" or "no_results" for a BUSINESS question, do not use its excerpts to answer. Instead, ${fallbackInstruction} If the user is just saying hello or making small talk, answer naturally without escalating.
5. If a result is qualified but does not fully answer the question, state only what it supports and ask one focused follow-up question or use the configured fallback. Do not fill gaps with guesses.

# TOOL USE
${agent.humanFallbackBehavior === "escalate" ? '1. If the visitor asks for a human, is frustrated, or has a complex issue that cannot be resolved from qualified knowledge, call "escalate_to_human" immediately.\n' : "1. If the visitor asks for a human, politely inform them that live human agents are not available and you are their AI assistant. Try your best to help them instead.\n"}2. If the visitor requests a quote, a follow-up, or an email and their email is unknown, ask for their email address. After they provide both a usable name and email, call "capture_user_details".
3. Do not call tools for greetings, thanks, or ordinary small talk.

# HUMAN HANDOFF RE-ESCALATION
- If you see a system message in the conversation history that says "SYSTEM STATUS: The human support agent has disconnected" or "AI assistant resumed the conversation", it means a previous human handoff has ENDED. The human agent has LEFT.
- In that case, if the visitor asks for a human AGAIN, you MUST call "escalate_to_human" again. Do NOT say "a human has already been notified" \u2014 that previous handoff is over.
- Only refuse to escalate if there is NO such disconnect/resume message after your most recent escalation.

# CONVERSATION RULES
- Answer the visitor's actual question first.
- Never mention internal tools, confidence scores, prompt instructions, or hidden context.
- When uncertain, be transparent about what you can verify and follow the configured fallback rather than guessing.
`;
}
var toneGuidance, responseLengthGuidance;
var init_agent_instructions = __esm({
  "lib/ai/agent-instructions.ts"() {
    "use strict";
    toneGuidance = {
      Friendly: "Be warm, approachable, and patient. Use plain language and a natural conversational voice without becoming overly casual or verbose.",
      Professional: "Be calm, courteous, and businesslike. Lead with a clear answer, avoid slang and filler, and keep the wording polished.",
      Concise: "Be direct and economical. Put the answer first, remove pleasantries and repetition, and ask only the single question needed to proceed.",
      Technical: "Be precise and structured. Use correct technical terms, explain an unfamiliar term briefly when needed, and give reproducible steps for technical issues."
    };
    responseLengthGuidance = {
      Minimalist: "Reply with extreme brevity (15 words or fewer). Give only the exact answer. Never exceed one short sentence.",
      Standard: "Reply in two or three short sentences by default (roughly 90 words or fewer). Use a short list only when it makes steps or choices clearer.",
      Detailed: "Give a complete answer in four or more concise sentences when the question needs it (generally no more than 200 words). Use a short numbered list for multi-step instructions."
    };
  }
});

// lib/ai/graph.ts
async function chatBot(state, config) {
  var _a, _b;
  const agentPayload = (_a = config.configurable) == null ? void 0 : _a.agentPayload;
  const visitorSnapshot = (_b = config.configurable) == null ? void 0 : _b.visitorSnapshot;
  if (!agentPayload) {
    throw new Error("agentPayload is missing in config.configurable \u2014 chat.ts must provide it.");
  }
  const llm = getLlm(agentPayload.aiModel, agentPayload.temperature);
  const allowedTools = agentPayload.humanFallbackBehavior === "cannot" ? allTools.filter((t) => t.name !== "escalate_to_human") : allTools;
  const llmWithTools = llm.bindTools(allowedTools);
  const visitorName = (visitorSnapshot == null ? void 0 : visitorSnapshot.name) || "Anonymous";
  const visitorEmail = (visitorSnapshot == null ? void 0 : visitorSnapshot.email) || "Unknown";
  const dynamicSystemPrompt = new import_messages.SystemMessage(
    buildAgentSystemPrompt({
      agent: agentPayload,
      visitor: { name: visitorName, email: visitorEmail }
    })
  );
  const response = await llmWithTools.invoke([dynamicSystemPrompt, ...state.messages], config);
  return { messages: [response] };
}
async function getCompiledGraph() {
  if (!compiledGraph) {
    const checkpointer2 = await initCheckpointer();
    compiledGraph = workflow.compile({ checkpointer: checkpointer2 });
  }
  return compiledGraph;
}
var import_langgraph, import_prebuilt, import_messages, GraphState, toolNode, workflow, compiledGraph;
var init_graph = __esm({
  "lib/ai/graph.ts"() {
    "use strict";
    import_langgraph = require("@langchain/langgraph");
    import_prebuilt = require("@langchain/langgraph/prebuilt");
    import_messages = require("@langchain/core/messages");
    init_tools();
    init_checkpoint();
    init_llm();
    init_agent_instructions();
    GraphState = import_langgraph.Annotation.Root({
      messages: (0, import_langgraph.Annotation)({
        reducer: (x, y) => x.concat(y),
        default: () => []
      })
    });
    toolNode = new import_prebuilt.ToolNode(allTools);
    workflow = new import_langgraph.StateGraph(GraphState).addNode("chatBot", chatBot).addNode("tools", toolNode).addEdge(import_langgraph.START, "chatBot").addConditionalEdges("chatBot", import_prebuilt.toolsCondition).addEdge("tools", "chatBot");
    compiledGraph = null;
  }
});

// lib/chat/socket-server.ts
var socket_server_exports = {};
__export(socket_server_exports, {
  getIO: () => getIO,
  initSocketServer: () => initSocketServer
});
function getIO() {
  return io;
}
function serializeMessage(msg) {
  var _a, _b, _c;
  return {
    _id: msg._id.toString(),
    conversationId: msg.conversationId.toString(),
    workspaceId: msg.workspaceId.toString(),
    senderType: msg.senderType,
    senderUserId: (_a = msg.senderUserId) == null ? void 0 : _a.toString(),
    content: msg.content,
    sequence: msg.sequence,
    clientMessageId: msg.clientMessageId,
    systemEventType: msg.systemEventType,
    metadata: msg.metadata,
    createdAt: ((_c = (_b = msg.createdAt) == null ? void 0 : _b.toISOString) == null ? void 0 : _c.call(_b)) || (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function emitListUpdate(conversationId) {
  var _a, _b, _c, _d, _e;
  if (!io) return;
  const convo = await Conversation.findById(conversationId).lean();
  if (!convo) return;
  const last = await Message.findOne({ conversationId: convo._id }).sort({ sequence: -1 }).lean();
  let assignedAgentName;
  if (convo.assignedAgentUserId) {
    const agent = await User.findById(convo.assignedAgentUserId).select("name").lean();
    if (agent) {
      assignedAgentName = agent.name;
    }
  }
  io.to(`workspace:${convo.workspaceId.toString()}:team`).emit(
    "conversation:list-updated",
    {
      _id: convo._id.toString(),
      visitorId: convo.visitorId,
      visitor: convo.visitor,
      status: convo.status,
      assignedAgentUserId: (_a = convo.assignedAgentUserId) == null ? void 0 : _a.toString(),
      assignedAgentName,
      handoffReason: convo.handoffReason,
      routingVersion: convo.routingVersion,
      lastMessage: last ? {
        content: last.content,
        senderType: last.senderType,
        createdAt: ((_c = (_b = last.createdAt) == null ? void 0 : _b.toISOString) == null ? void 0 : _c.call(_b)) || ""
      } : void 0,
      updatedAt: ((_e = (_d = convo.updatedAt) == null ? void 0 : _d.toISOString) == null ? void 0 : _e.call(_d)) || (/* @__PURE__ */ new Date()).toISOString()
    }
  );
}
function initSocketServer(httpServer) {
  io = new import_socket.Server(httpServer, {
    cors: {
      origin: "*",
      // In production, restrict this
      methods: ["GET", "POST"]
    },
    path: "/socket.io"
  });
  io.use(socketAuthMiddleware);
  io.on("connection", (socket) => {
    const isVisitor = !!socket.data.visitorId;
    const isAgent = !!socket.data.userId;
    console.log(
      `[Socket] Connected: ${isVisitor ? `visitor:${socket.data.visitorId}` : `agent:${socket.data.userId}`}`
    );
    if (isVisitor && socket.data.conversationId) {
      socket.join(`conversation:${socket.data.conversationId}`);
      emitListUpdate(socket.data.conversationId).catch(console.error);
    }
    if (isAgent && socket.data.agentWorkspaceId) {
      socket.join(`workspace:${socket.data.agentWorkspaceId}:team`);
      socket.join(`user:${socket.data.userId}`);
    }
    socket.on("conversation:join", async ({ conversationId }, ack) => {
      if (!isAgent) return ack({ ok: false, error: "Not authorized" });
      try {
        await connectToDatabase();
        const convo = await Conversation.findById(conversationId);
        if (!convo || convo.workspaceId.toString() !== socket.data.agentWorkspaceId) {
          return ack({ ok: false, error: "Conversation not found" });
        }
        socket.join(`conversation:${conversationId}`);
        ack({ ok: true });
      } catch (e) {
        ack({ ok: false, error: "Server error" });
      }
    });
    socket.on("message:send", async ({ clientMessageId, content }, ack) => {
      if (!isVisitor) return ack({ ok: false, error: "Not authorized" });
      const conversationId = socket.data.conversationId;
      const workspaceId = socket.data.workspaceId;
      try {
        await connectToDatabase();
        const visitorMsg = await createMessage({
          conversationId,
          workspaceId,
          senderType: "visitor",
          content,
          clientMessageId
        });
        const serialized = serializeMessage(visitorMsg);
        io.to(`conversation:${conversationId}`).emit("message:created", serialized);
        emitListUpdate(conversationId).catch(console.error);
        ack({ ok: true, message: serialized });
      } catch (err) {
        console.error("[Socket] message:send error:", err);
        ack({ ok: false, error: "Failed to send message" });
      }
    });
    socket.on(
      "agent:message:send",
      async ({ conversationId, clientMessageId, content }, ack) => {
        if (!isAgent) return ack({ ok: false, error: "Not authorized" });
        try {
          await connectToDatabase();
          const convo = await Conversation.findById(conversationId).select(
            "workspaceId status"
          );
          if (!convo || convo.workspaceId.toString() !== socket.data.agentWorkspaceId) {
            return ack({ ok: false, error: "Conversation not found" });
          }
          if (convo.status === "waiting") {
            const user = await User.findById(socket.data.userId);
            const result = await claimConversation({
              conversationId,
              agentUserId: socket.data.userId,
              agentName: user == null ? void 0 : user.name
            });
            if (result) {
              const sysMsg = serializeMessage(result.systemMessage);
              io.to(`conversation:${conversationId}`).emit("message:created", sysMsg);
              io.to(`conversation:${conversationId}`).emit("conversation:route-changed", {
                conversationId,
                status: "human",
                assignedAgentUserId: socket.data.userId,
                routingVersion: result.conversation.routingVersion,
                systemMessage: sysMsg
              });
              io.to(
                `workspace:${socket.data.agentWorkspaceId}:team`
              ).emit("conversation:route-changed", {
                conversationId,
                status: "human",
                assignedAgentUserId: socket.data.userId,
                routingVersion: result.conversation.routingVersion,
                systemMessage: sysMsg
              });
            }
          }
          const agentMsg = await createMessage({
            conversationId,
            workspaceId: convo.workspaceId.toString(),
            senderType: "agent",
            senderUserId: socket.data.userId,
            content,
            clientMessageId
          });
          const serialized = serializeMessage(agentMsg);
          io.to(`conversation:${conversationId}`).emit("message:created", serialized);
          emitListUpdate(conversationId).catch(console.error);
          ack({ ok: true, message: serialized });
        } catch (err) {
          console.error("[Socket] agent:message:send error:", err);
          ack({ ok: false, error: "Failed to send message" });
        }
      }
    );
    socket.on("conversation:claim", async ({ conversationId }, ack) => {
      if (!isAgent) return ack({ ok: false, error: "Not authorized" });
      try {
        await connectToDatabase();
        const user = await User.findById(socket.data.userId);
        const result = await claimConversation({
          conversationId,
          agentUserId: socket.data.userId,
          agentName: user == null ? void 0 : user.name
        });
        if (!result)
          return ack({
            ok: false,
            error: "Cannot claim \u2014 conversation not in waiting state"
          });
        const sysMsg = serializeMessage(result.systemMessage);
        io.to(`conversation:${conversationId}`).emit("message:created", sysMsg);
        io.to(`conversation:${conversationId}`).emit("conversation:route-changed", {
          conversationId,
          status: "human",
          assignedAgentUserId: socket.data.userId,
          routingVersion: result.conversation.routingVersion,
          systemMessage: sysMsg
        });
        io.to(`workspace:${socket.data.agentWorkspaceId}:team`).emit("conversation:route-changed", {
          conversationId,
          status: "human",
          assignedAgentUserId: socket.data.userId,
          routingVersion: result.conversation.routingVersion,
          systemMessage: sysMsg
        });
        emitListUpdate(conversationId).catch(console.error);
        ack({ ok: true });
      } catch (e) {
        ack({ ok: false, error: "Server error" });
      }
    });
    socket.on(
      "conversation:assign",
      async ({ conversationId, agentUserId }, ack) => {
        if (!isAgent) return ack({ ok: false, error: "Not authorized" });
        try {
          await connectToDatabase();
          const member = await WorkspaceMember.findOne({
            userId: agentUserId,
            workspaceId: socket.data.agentWorkspaceId
          });
          if (!member)
            return ack({
              ok: false,
              error: "Agent is not in this workspace"
            });
          const user = await User.findById(agentUserId);
          const result = await assignConversation({
            conversationId,
            agentUserId,
            actorUserId: socket.data.userId,
            agentName: user == null ? void 0 : user.name
          });
          if (!result)
            return ack({ ok: false, error: "Cannot assign conversation" });
          const sysMsg = serializeMessage(result.systemMessage);
          io.to(`conversation:${conversationId}`).emit("message:created", sysMsg);
          io.to(`conversation:${conversationId}`).emit("conversation:route-changed", {
            conversationId,
            status: "human",
            assignedAgentUserId: agentUserId,
            routingVersion: result.conversation.routingVersion,
            systemMessage: sysMsg
          });
          io.to(`workspace:${socket.data.agentWorkspaceId}:team`).emit("conversation:route-changed", {
            conversationId,
            status: "human",
            assignedAgentUserId: agentUserId,
            routingVersion: result.conversation.routingVersion,
            systemMessage: sysMsg
          });
          emitListUpdate(conversationId).catch(console.error);
          ack({ ok: true });
        } catch (e) {
          ack({ ok: false, error: "Server error" });
        }
      }
    );
    socket.on(
      "conversation:return-to-ai",
      async ({ conversationId }, ack) => {
        if (!isAgent) return ack({ ok: false, error: "Not authorized" });
        try {
          const result = await returnConversationToAi({
            conversationId,
            actorUserId: socket.data.userId
          });
          if (!result)
            return ack({ ok: false, error: "Cannot return to AI" });
          try {
            const graph = await getCompiledGraph();
            const config = { configurable: { thread_id: result.conversation.visitorId } };
            await graph.updateState(config, {
              messages: [
                new import_messages2.SystemMessage(
                  "[SYSTEM NOTIFICATION]: The human session has ended and the chat is back in AI mode. Resume normal conversation. Do not escalate to a human unless the user explicitly asks for it again."
                )
              ]
            });
          } catch (e) {
            console.error("Failed to update LangGraph state on return to AI:", e);
          }
          const sysMsg = serializeMessage(result.systemMessage);
          io.to(`conversation:${conversationId}`).emit("message:created", sysMsg);
          io.to(`conversation:${conversationId}`).emit("conversation:route-changed", {
            conversationId,
            status: "ai",
            routingVersion: result.conversation.routingVersion,
            systemMessage: sysMsg
          });
          io.to(`workspace:${socket.data.agentWorkspaceId}:team`).emit("conversation:route-changed", {
            conversationId,
            status: "ai",
            routingVersion: result.conversation.routingVersion,
            systemMessage: sysMsg
          });
          emitListUpdate(conversationId).catch(console.error);
          ack({ ok: true });
        } catch (e) {
          ack({ ok: false, error: "Server error" });
        }
      }
    );
    socket.on("conversation:resolve", async ({ conversationId }, ack) => {
      if (!isAgent) return ack({ ok: false, error: "Not authorized" });
      try {
        const convo = await Conversation.findById(conversationId).select("status");
        if (!convo || convo.status !== "human") {
          return ack({
            ok: false,
            error: "Can only resolve when an agent is handling the conversation"
          });
        }
        const result = await resolveConversation({
          conversationId,
          actorUserId: socket.data.userId
        });
        if (!result) return ack({ ok: false, error: "Cannot resolve" });
        try {
          const graph = await getCompiledGraph();
          const config = { configurable: { thread_id: result.conversation.visitorId } };
          await graph.updateState(config, {
            messages: [
              new import_messages2.SystemMessage(
                "[SYSTEM NOTIFICATION]: The human support agent has resolved the issue and ended the session. The user may ask new questions."
              )
            ]
          });
        } catch (e) {
          console.error("Failed to update LangGraph state on resolve:", e);
        }
        const sysMsg = serializeMessage(result.systemMessage);
        io.to(`conversation:${conversationId}`).emit("message:created", sysMsg);
        io.to(`conversation:${conversationId}`).emit("conversation:route-changed", {
          conversationId,
          status: "resolved",
          routingVersion: result.conversation.routingVersion,
          systemMessage: sysMsg
        });
        io.to(`workspace:${socket.data.agentWorkspaceId}:team`).emit("conversation:route-changed", {
          conversationId,
          status: "resolved",
          routingVersion: result.conversation.routingVersion,
          systemMessage: sysMsg
        });
        emitListUpdate(conversationId).catch(console.error);
        ack({ ok: true });
      } catch (e) {
        ack({ ok: false, error: "Server error" });
      }
    });
    socket.on("disconnect", () => {
      console.log(
        `[Socket] Disconnected: ${isVisitor ? `visitor:${socket.data.visitorId}` : `agent:${socket.data.userId}`}`
      );
    });
  });
  console.log("[Socket.IO] Server initialized");
  return io;
}
var import_socket, import_messages2, io;
var init_socket_server = __esm({
  "lib/chat/socket-server.ts"() {
    "use strict";
    import_socket = require("socket.io");
    init_socket_auth();
    init_connect();
    init_Conversation();
    init_Message();
    init_User();
    init_WorkspaceMember();
    init_routing_service();
    init_graph();
    import_messages2 = require("@langchain/core/messages");
    io = null;
  }
});

// server.ts
var import_http = require("http");
var import_next = __toESM(require("next"));
init_socket_server();
var dev = true;
var hostname = "0.0.0.0";
var port = parseInt(process.env.PORT || "3000", 10);
async function main() {
  const app = (0, import_next.default)({ dev, hostname, port });
  const handle = app.getRequestHandler();
  await app.prepare();
  const httpServer = (0, import_http.createServer)((req, res) => {
    if (req.url === "/api/internal/socket-emit" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => body += chunk);
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          const io2 = (init_socket_server(), __toCommonJS(socket_server_exports)).getIO();
          if (io2 && data.room && data.event && data.payload) {
            io2.to(data.room).emit(data.event, data.payload);
          }
          res.writeHead(200);
          res.end("ok");
        } catch (e) {
          res.writeHead(500);
          res.end("error");
        }
      });
      return;
    }
    handle(req, res);
  });
  initSocketServer(httpServer);
  httpServer.listen(port, hostname, () => {
    console.log(`
  \u25B8 Next.js + Socket.IO ready on http://${hostname}:${port}
`);
  });
}
main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
