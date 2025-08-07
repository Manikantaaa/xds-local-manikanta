"use client"
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
// import { useSetState } from 'react-use';

import { AppState } from '@/types/tourTypes';
import { Toursteps } from '@/services/tour';

const appState = {
    run: false,
    stepIndex: 0,
    steps: Toursteps,
    tourActive: false,
};

export const MultiTourContext = createContext({
    tourState: appState,
    setTourState: () => undefined,
});
MultiTourContext.displayName = 'AppContext';

export function MultiTourContextProvider(props: any) {
    const [tourState, setTourState] = useState(appState);

    const value = useMemo(
        () => ({
            tourState,
            setTourState,
        }),
        [setTourState, tourState],
    );

    return <MultiTourContext.Provider value={value} {...props} />;
}

export function useMultiTourContext(): {
    setTourState: (patch: Partial<AppState> | ((previousState: AppState) => Partial<AppState>)) => void;
    tourState: AppState;
} {
    const context = useContext(MultiTourContext);

    if (!context) {
        throw new Error('useAppContext must be used within a AppProvider');
    }

    return context;
}
