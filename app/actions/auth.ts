"use server";

import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { Workspace } from "@/lib/db/models/Workspace";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";
import { Invite } from "@/lib/db/models/Invite";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function registerUserAction(formData: {
  name: string;
  email: string;
  password: string;
}) {
  const { name, email, password } = formData;

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  await connectToDatabase();

  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: cleanEmail });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // 1. Create User (onboardingCompleted defaults to false in schema)
  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
  });

  // Generate readable workspace ID
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const workspaceId = `ws_${randomSuffix}`;
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${randomSuffix}`;

  // 2. Create Workspace ONLY
  const workspace = await Workspace.create({
    workspaceId,
    name: `${name}'s Workspace`,
    slug,
    ownerId: user._id,
    plan: "pro",
  });

  // 3. Create Workspace Member (Owner)
  await WorkspaceMember.create({
    workspaceId: workspace._id,
    userId: user._id,
    role: "owner",
    status: "online",
  });

  return {
    success: true,
    email: cleanEmail,
  };
}

export async function acceptInviteAction(token: string) {
  await connectToDatabase();
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("You must be logged in to accept an invite.");
  }
  
  const invite = await Invite.findOne({ token, status: "pending" });
  if (!invite || new Date() > new Date(invite.expiresAt)) {
    throw new Error("Invalid or expired invite.");
  }
  
  if (invite.email !== session.user.email) {
    throw new Error("This invite is for a different email address.");
  }
  
  const user = await User.findOne({ email: session.user.email });
  if (!user) throw new Error("User not found.");
  
  // Add as workspace member
  await WorkspaceMember.create({
    workspaceId: invite.workspaceId,
    userId: user._id,
    role: invite.role,
    status: "online",
  });
  
  // Mark as accepted
  invite.status = "accepted";
  await invite.save();
  
  // Ensure the user bypasses onboarding if they join a workspace
  if (!user.onboardingCompleted) {
    user.onboardingCompleted = true;
    await user.save();
  }
  
  return { success: true };
}

export async function registerWithInviteAction(formData: {
  name: string;
  email: string;
  password: string;
  token: string;
}) {
  const { name, email, password, token } = formData;

  if (!name || !email || !password || !token) {
    return { error: "All fields are required." };
  }

  await connectToDatabase();

  const invite = await Invite.findOne({ token, status: "pending" });
  if (!invite || new Date() > new Date(invite.expiresAt)) {
    return { error: "Invalid or expired invite." };
  }

  if (invite.email !== email) {
    return { error: "This invite is for a different email address." };
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // 1. Create User (mark onboarding completed since they join an existing workspace)
  const user = await User.create({
    name: name.trim(),
    email,
    passwordHash,
    avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
    onboardingCompleted: true, 
  });

  // 2. Add as workspace member
  await WorkspaceMember.create({
    workspaceId: invite.workspaceId,
    userId: user._id,
    role: invite.role,
    status: "online",
  });

  // 3. Mark invite as accepted
  invite.status = "accepted";
  await invite.save();

  return { success: true, email };
}
