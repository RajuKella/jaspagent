import { createSlice, type PayloadAction , createAsyncThunk } from "@reduxjs/toolkit";
import { fetchChatHistoryApi, fetchChatConversationApi } from "./chatApi";

export interface ChatHistory {
    chatTitle: string;
    chatId: string;
};

// Simplified Citation interface where properties are optional
// The type will be inferred in the MessageList component
export interface Citation {
    doc_id?: string;
    document_name?: string;
    blob_path?: string;
    page?: number;

    internet_title?: string;
    internet_url?: string;

    // Optional property to store original data for debugging if neither doc_id nor internet_title are present
    originalData?: any;
};

export interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    citations?: Citation[]; // Add optional citations array
    imageUrl?: string; // Add optional imageUrl for displaying attached images
    webSearch?: boolean;
};

interface ChatState {
    chatHistory: ChatHistory[];
    currentChat: Message[];
    activeChatId: string | null;
    status: "idle" | "loading" | "succeded" | "failed";
    error: string | null;
};

const initialState: ChatState = {
    chatHistory: [],
    currentChat: [],
    activeChatId: null,
    status: "idle",
    error: null
};

export const fetchChatHistory = createAsyncThunk(
    "chat/fetchHistory",
    async ({ userId }: { userId: string }) => {
        const response = await fetchChatHistoryApi(userId);
        const sessions =  response["sessions"];
        const formattedHistory: ChatHistory[] = sessions.map((session: any) => ({
            chatId: session.session_id,    // Map 'session_id' to 'chatId'
            chatTitle: session.title,      // Map 'title' to 'chatTitle'
        }));

        return formattedHistory;
    }
);

export const fetchChatConversation = createAsyncThunk(
    "chat/fetchConversation",
    async ({ chatId, userId }: { chatId: string; userId: string }, { rejectWithValue }) => {
        try {
            const response = await fetchChatConversationApi(chatId, userId);
            const conversationPairs = response.conversation;

            const messages: Message[] = [];
            conversationPairs.forEach((pair: any, index: number) => {
                // Add user message
                messages.push({
                    id: `${chatId}-q-${index}`,
                    text: pair.question,
                    sender: "user",
                    imageUrl: pair.image_url // Assuming your history API might return image URLs if stored
                });
                // Add bot message, including citations
                // Directly map citations without adding a 'type' property
                const formattedCitations: Citation[] = (pair.citations || []).map((citation: any) => {
                    // Ensure citation is an object and has at least one identifying property
                    if (citation && typeof citation === 'object' && (citation.doc_id || citation.internet_title || citation.internet_url)) {
                        return citation; // Return as is, MessageList will infer
                    }
                    // Fallback for any unexpected citation structure, store original data
                    console.warn("Unknown Citation Format (chatSlice):", citation); // DEBUG LOG
                    return { originalData: citation };
                });
                console.log("All Formatted Citations for message (chatSlice):", formattedCitations); // DEBUG LOG

                messages.push({
                    id: `${chatId}-a-${index}`,
                    text: pair.answer,
                    sender: "bot",
                    citations: formattedCitations,
                });
            });
            return messages;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<Message>) => {
            state.currentChat.push(action.payload);
        },
        clearCurrentChat: (state) => {
            state.currentChat = [];
        },
        setActiveChat: (state, action: PayloadAction<string | null>) => {
            state.activeChatId = action.payload;
        },
        addChatSession: (state, action: PayloadAction<ChatHistory>) => {
            state.chatHistory.unshift(action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChatHistory.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchChatHistory.fulfilled, (state, action: PayloadAction<ChatHistory[]>) => {
                state.status = "succeded";
                state.chatHistory = action.payload;
            })
            .addCase(fetchChatHistory.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch the chat history";
            })
            .addCase(fetchChatConversation.pending, (state) => {
                state.status = "loading";
                state.currentChat = [];
                state.error = null;
            })
            .addCase(fetchChatConversation.fulfilled, (state, action: PayloadAction<Message[]>) => {
                state.status = "succeded";
                state.currentChat = action.payload;
            })
            .addCase(fetchChatConversation.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string || "Failed to fetch conversation";
            });
    },
});

export const { addMessage, clearCurrentChat, setActiveChat, addChatSession } = chatSlice.actions;

export default chatSlice.reducer;
