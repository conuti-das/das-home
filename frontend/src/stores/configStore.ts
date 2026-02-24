import { create } from "zustand";
import type { AppConfiguration } from "@/types";

interface ConfigStore {
  config: AppConfiguration | null;
  setConfig: (config: AppConfiguration) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));
