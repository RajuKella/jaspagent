// src/app/statePersistence.ts

// REMOVE THIS LINE: import { type RootState } from "./types"; // This causes the circular dependency!

// Define a general type for your persisted state if you want some type safety here,
// but do NOT import RootState from store.ts or types.ts to avoid circular deps.
// You can make it as specific as needed without circularity, or use 'any'.
// This interface is only for internal typing within this file if desired, not for external RootState.
interface PersistedSliceState {
    auth?: any; // You can make these more specific if you define interfaces for each slice's persisted state
    chat?: any;
    user?: any;
}


// The keys we'll use in localStorage
const AUTH_STATE_KEY = 'authState';
const CHAT_STATE_KEY = 'chatState';
const USER_STATE_KEY = 'userState';

// Function to load the state from localStorage
export const loadState = (): PersistedSliceState | undefined => {
  try {
    const serializedAuthState = localStorage.getItem(AUTH_STATE_KEY);
    const serializedChatState = localStorage.getItem(CHAT_STATE_KEY);
    const serializedUserState = localStorage.getItem(USER_STATE_KEY);

    if (serializedAuthState === null && serializedChatState === null && serializedUserState === null) {
      return undefined; // No state found, let reducers initialize
    }

    // Parse the JSON strings back into objects
    return {
      auth: serializedAuthState ? JSON.parse(serializedAuthState) : undefined,
      chat: serializedChatState ? JSON.parse(serializedChatState) : undefined,
      user: serializedUserState ? JSON.parse(serializedUserState) : undefined,
    };
  } catch (err) {
    console.error("Could not load state from localStorage", err);
    return undefined; // On error, let reducers initialize
  }
};

// Function to save the state to localStorage
// IMPORTANT: Type 'state' as 'any' or 'unknown' here to break the circular dependency.
// The actual RootState type checking will occur where saveState is CALLED (i.e., in store.ts).
export const saveState = (state: any) => { // Changed type from RootState to any
  try {
    // We only want to persist the 'auth' and 'chat' slices
    const serializedAuthState = JSON.stringify(state.auth);
    const serializedChatState = JSON.stringify(state.chat);
    const serializedUserState = JSON.stringify(state.user); // Added this based on your file

    localStorage.setItem(AUTH_STATE_KEY, serializedAuthState);
    localStorage.setItem(CHAT_STATE_KEY, serializedChatState);
    localStorage.setItem(USER_STATE_KEY, serializedUserState);
  } catch (err) {
    console.error("Could not save state to localStorage", err);
  }
};

// Function to clear the state on logout
export const clearState = () => {
    try {
        localStorage.removeItem(AUTH_STATE_KEY);
        localStorage.removeItem(CHAT_STATE_KEY);
        localStorage.removeItem(USER_STATE_KEY);
    } catch (err) {
        console.error("Could not clear state from localStorage", err);
    }
}