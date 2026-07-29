"use client";

import { useRef } from "react";
import { useAppStore, UserState, WorkspaceState } from "./use-workspace-store";

interface HydrateStoreProps {
  user: UserState | null;
  workspace: WorkspaceState | null;
  children: React.ReactNode;
}

export function StoreProvider({ user, workspace, children }: HydrateStoreProps) {
  const initialized = useRef(false);

  // Hydrate the store exactly once during the initial render pass (no useEffect loading flash!)
  if (!initialized.current) {
    useAppStore.getState().hydrateStore(user, workspace);
    initialized.current = true;
  }

  return <>{children}</>;
}
