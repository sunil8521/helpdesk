import { create } from "zustand";

export interface UserState {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface WorkspaceState {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  plan: string;
}

interface AppStore {
  user: UserState | null;
  currentWorkspace: WorkspaceState | null;
  isHydrated: boolean;

  // Actions
  hydrateStore: (user: UserState | null, workspace: WorkspaceState | null) => void;
  setWorkspace: (workspace: WorkspaceState) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  currentWorkspace: null,
  isHydrated: false,

  hydrateStore: (user, workspace) =>
    set({ user, currentWorkspace: workspace, isHydrated: true }),
  setWorkspace: (workspace) => set({ currentWorkspace: workspace }),
}));
