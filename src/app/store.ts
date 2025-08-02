// src/app/store.ts

import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice';
import chatReducer from '../features/chat/chatSlice';
import userReducer from '../features/user/userSlice';
import { loadState, saveState } from "./statePersistence"; // Import loadState and saveState


const persistedState = loadState(); // This line now executes without error

export const store = configureStore({
    reducer:{
        auth:authReducer,
        chat:chatReducer,
        user:userReducer,
    },
    preloadedState: persistedState,
});

store.subscribe(() => {
  // Explicitly cast store.getState() to RootState when calling saveState
  // This is where the type checking happens, not within saveState itself.
  saveState(store.getState() as RootState);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;