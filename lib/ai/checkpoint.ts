import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import { connectToDatabase } from "../db/connect";

export let checkpointer: MongoDBSaver | undefined;

export async function initCheckpointer() {
  if (checkpointer) return checkpointer;

  await connectToDatabase();

  // Extract the raw MongoClient from Mongoose connection
  const client = mongoose.connection.getClient()  as MongoClient;
  
  if (!client) {
    throw new Error("Failed to get MongoClient from Mongoose");
  }

  // Initialize the checkpointer for LangGraph
  checkpointer = new MongoDBSaver({ client: client as any });
  
  return checkpointer;
}
