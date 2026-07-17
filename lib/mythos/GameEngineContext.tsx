"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { GameEngine } from "@/lib/mythos/engine";
import type { GameState } from "@/lib/mythos/gameState";
import { Resolver } from "@/lib/mythos/resolver";

type GameEngineContextValue = {
  engine: GameEngine;
  state: GameState;
  resolver: Resolver;
  refresh: () => void;
};

const GameEngineContext = createContext<GameEngineContextValue | null>(null);

export function GameEngineProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<GameEngine>(new GameEngine());
  const [state, setState] = useState<GameState>(engineRef.current.stateSnapshot);

  const refresh = useCallback(() => {
    setState({ ...engineRef.current.stateSnapshot });
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    engine.onEvent((_event, _data) => {
      setState({ ...engine.stateSnapshot });
    });
    engine.loadAutoSave();
    setState({ ...engine.stateSnapshot });
  }, []);

  return (
    <GameEngineContext.Provider
      value={{ engine: engineRef.current, state, resolver: engineRef.current.resolver, refresh }}
    >
      {children}
    </GameEngineContext.Provider>
  );
}

export function useGameEngine(): GameEngineContextValue {
  const ctx = useContext(GameEngineContext);
  if (!ctx) throw new Error("useGameEngine must be used within GameEngineProvider");
  return ctx;
}