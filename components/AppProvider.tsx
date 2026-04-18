"use client";

import { useState } from "react";
import { AppContext, defaultState } from "@/lib/store";
import { AppState } from "@/types";

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
}
