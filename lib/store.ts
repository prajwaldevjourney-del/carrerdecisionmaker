"use client";

import { createContext, useContext } from "react";
import { AppState } from "@/types";

export const defaultState: AppState = {
  resume: null,
  jobs: [],
  roadmap: [],
  career: null,
  exchange: [],
  exchangePoints: 0,
};

export const AppContext = createContext<{
  state: AppState;
  setState: (s: AppState) => void;
}>({
  state: defaultState,
  setState: () => {},
});

export const useAppState = () => useContext(AppContext);
