import { create } from "zustand";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

interface ConnectionStore {
  status: ConnectionStatus;
  hassUrl: string;
  haVersion: string;
  setStatus: (status: ConnectionStatus) => void;
  setHassUrl: (url: string) => void;
  setHaVersion: (version: string) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  status: "disconnected",
  hassUrl: "",
  haVersion: "",
  setStatus: (status) => set({ status }),
  setHassUrl: (hassUrl) => set({ hassUrl }),
  setHaVersion: (haVersion) => set({ haVersion }),
}));
