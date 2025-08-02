// src/features/chat/chatSelectors.ts

import { type RootState } from '../../app/store'; // Import RootState from the store

export const selectActiveChatId = (state: RootState) => state.chat.activeChatId;
export const selectChatHistory = (state: RootState) => state.chat.chatHistory;
export const selectCurrentChat = (state: RootState) => state.chat.currentChat;
export const selectChatStatus = (state: RootState) => state.chat.status;
export const selectChatError = (state: RootState) => state.chat.error;

// You can add more selectors here as needed for your chat slice data