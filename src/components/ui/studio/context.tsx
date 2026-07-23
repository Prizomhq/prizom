'use client';

import React, { createContext, useContext, useReducer, Dispatch, ReactNode } from 'react';
import { StudioState, StudioAction, initialStudioState, studioReducer } from './state';

const StudioStateContext = createContext<StudioState | undefined>(undefined);
const StudioDispatchContext = createContext<Dispatch<StudioAction> | undefined>(undefined);

interface StudioProviderProps {
  children: ReactNode;
  initialCredits?: number;
}

/**
 * State and dispatch context provider wrapping the AI Studio workspace.
 */
export function StudioProvider({ children, initialCredits = 10 }: StudioProviderProps) {
  const [state, dispatch] = useReducer(studioReducer, {
    ...initialStudioState,
    credits: initialCredits
  });

  return (
    <StudioStateContext.Provider value={state}>
      <StudioDispatchContext.Provider value={dispatch}>
        {children}
      </StudioDispatchContext.Provider>
    </StudioStateContext.Provider>
  );
}

/**
 * Custom hook to safely consume the AI Studio state tree.
 */
export function useStudioState(): StudioState {
  const context = useContext(StudioStateContext);
  if (context === undefined) {
    throw new Error('useStudioState must be used within a StudioProvider');
  }
  return context;
}

/**
 * Custom hook to safely consume the AI Studio dispatcher actions.
 */
export function useStudioDispatch(): Dispatch<StudioAction> {
  const context = useContext(StudioDispatchContext);
  if (context === undefined) {
    throw new Error('useStudioDispatch must be used within a StudioProvider');
  }
  return context;
}
