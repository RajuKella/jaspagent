// features/user/userSlice.ts
import { createSlice, type PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchUserProfile } from "../../services/afterLogin"; // Assuming this path is correct
import { fetchAllUser, updateLimit, deleteUser } from "../../services/adminUsers"; // Assuming this path is correct
import { fetchAllDocuments, deleteDocument, uploadDocument } from "../../services/documents";

export interface UserListItem {
    id: number;
    username: string;
    email: string;
    documents_uploaded: number;
    total_documents_allowed: number;
}

export interface DocumentInfo {
    // Assuming your backend returns these fields for a document
    id: number;
    name: string; // Changed from 'title' to 'name' for consistency with common file naming
    uploaded_at: string;
    path: string;
}

interface UserState {
    profile: any | null;
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    userList: UserListItem[];
    userListStatus: "idle" | "loading" | "succeeded" | "failed";
    userListError: string | null;
    // States for admin actions (update/delete user)
    actionStatus: "idle" | "pending" | "succeeded" | "failed";
    actionError: string | null;
    currentActionUserId: number | null; // To track which user is being updated/deleted
    // New states for document management
    documents: DocumentInfo[];
    documentsStatus: "idle" | "loading" | "succeeded" | "failed";
    documentsError: string | null;
}

const initialState: UserState = {
    profile: null,
    status: "idle",
    error: null,
    userList: [],
    userListStatus: "idle",
    userListError: null,
    actionStatus: "idle",
    actionError: null,
    currentActionUserId: null,
    // Initialize new document states
    documents: [],
    documentsStatus: "idle",
    documentsError: null,
};

// --- Existing User Profile & Admin User Thunks ---

export const fetchUserProfileThunk = createAsyncThunk(
    "user/fetchProfile",
    async (_, { rejectWithValue }) => {
        try {
            const userProfile = await fetchUserProfile();
            return userProfile;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchAllUsersThunk = createAsyncThunk(
    "user/fetchAllUsers",
    async ({ userId }: {userId: string }, { rejectWithValue }) => {
        try {
            const users = await fetchAllUser(userId);
            return users;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateLimitThunk = createAsyncThunk(
    "user/updateLimit",
    async ({userId, newLimit, documentsUploaded }: {userId: number; newLimit: number; documentsUploaded: number }, { rejectWithValue }) => {
        try {
            const response = await updateLimit(userId, { total_documents_allowed: newLimit, documents_uploaded: documentsUploaded });
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteUserThunk = createAsyncThunk(
    "user/deleteUser",
    async ({ userId }: {userId: number }, { rejectWithValue }) => {
        try {
            const response = await deleteUser(userId);
            return { userId, response };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// --- New Document Management Thunks ---

/**
 * Async thunk to fetch all documents for a given user.
 */
export const fetchDocumentsThunk = createAsyncThunk(
    'user/fetchDocuments', // Unique action type
    async ({ userId }: { userId: number }, { rejectWithValue }) => {
        try {
            const response = await fetchAllDocuments(userId);
            // Assuming the API response directly contains the array of documents
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Async thunk to delete a specific document.
 */
export const deleteDocumentThunk = createAsyncThunk(
    'user/deleteDocument', // Unique action type
    async ({ docId, userId }: {docId: number; userId: number }, { rejectWithValue }) => {
        try {
            await deleteDocument(docId, userId);
            // Return the docId on success so we can remove it from the state
            return docId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Async thunk to upload a new document.
 */
export const uploadDocumentThunk = createAsyncThunk(
    'user/uploadDocument', // Unique action type
    async ({ userId, file }: {userId: number; file: File }, { rejectWithValue }) => {
        try {
            const response = await uploadDocument(userId, file);
            // Assuming the backend returns the details of the newly uploaded document
            // If it just returns a success message, you might need to re-fetch all documents
            // or construct the new document object based on known data.
            return response; // This should be the new document object or confirmation
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);


const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearUserData: (state) => {
            state.profile = null;
            state.status = "idle";
            state.error = null;
            state.userList = [];
            state.userListStatus = "idle";
            state.userListError = null;
            state.actionStatus = "idle";
            state.actionError = null;
            state.currentActionUserId = null;
            // Clear new document states
            state.documents = [];
            state.documentsStatus = "idle";
            state.documentsError = null;
        },
        // resetUserLimitEdit: (state, action: PayloadAction<number>) => {
        //     // This reducer remains as is, if you have a specific use case for it.
        // }
    },
    extraReducers: (builder) => {
        builder
            // --- User Profile Thunk Handlers ---
            .addCase(fetchUserProfileThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchUserProfileThunk.fulfilled, (state, action: PayloadAction<any>) => {
                state.status = "succeeded";
                state.profile = action.payload;
            })
            .addCase(fetchUserProfileThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            // --- Fetch All Users Thunk Handlers ---
            .addCase(fetchAllUsersThunk.pending, (state) => {
                state.userListStatus = "loading";
                state.userListError = null;
            })
            .addCase(fetchAllUsersThunk.fulfilled, (state, action: PayloadAction<UserListItem[]>) => {
                state.userListStatus = "succeeded";
                state.userList = action.payload;
            })
            .addCase(fetchAllUsersThunk.rejected, (state, action) => {
                state.userListStatus = "failed";
                state.userListError = action.payload as string;
            })
            // --- Update Limit Thunk Handlers ---
            .addCase(updateLimitThunk.pending, (state, action) => {
                state.actionStatus = "pending";
                state.actionError = null;
                state.currentActionUserId = action.meta.arg.userId;
            })
            .addCase(updateLimitThunk.fulfilled, (state, _action: PayloadAction<any>) => {
                state.actionStatus = "succeeded";
                state.currentActionUserId = null;
                // Optionally update the user in userList if the payload contains the updated user info
                // const updatedUserIndex = state.userList.findIndex(user => user.id === action.meta.arg.userId);
                // if (updatedUserIndex !== -1) {
                //     state.userList[updatedUserIndex].total_documents_allowed = action.payload.limits.total_documents_allowed;
                //     state.userList[updatedUserIndex].documents_uploaded = action.payload.limits.documents_uploaded;
                // }
            })
            .addCase(updateLimitThunk.rejected, (state, action) => {
                state.actionStatus = "failed";
                state.actionError = action.payload as string;
                state.currentActionUserId = null;
            })
            // --- Delete User Thunk Handlers ---
            .addCase(deleteUserThunk.pending, (state, action) => {
                state.actionStatus = "pending";
                state.actionError = null;
                state.currentActionUserId = action.meta.arg.userId;
            })
            .addCase(deleteUserThunk.fulfilled, (state, action: PayloadAction<{ userId: number; response: any }>) => {
                state.actionStatus = "succeeded";
                state.currentActionUserId = null;
                state.userList = state.userList.filter(user => user.id !== action.payload.userId);
            })
            .addCase(deleteUserThunk.rejected, (state, action) => {
                state.actionStatus = "failed";
                state.actionError = action.payload as string;
                state.currentActionUserId = null;
            })
            // --- Document Management Thunk Handlers ---
            .addCase(fetchDocumentsThunk.pending, (state) => {
                state.documentsStatus = 'loading';
                state.documentsError = null;
            })
            .addCase(fetchDocumentsThunk.fulfilled, (state, action: PayloadAction<DocumentInfo[]>) => {
                state.documentsStatus = 'succeeded';
                state.documents = action.payload; // Update the documents array
            })
            .addCase(fetchDocumentsThunk.rejected, (state, action) => {
                state.documentsStatus = 'failed';
                state.documentsError = action.payload as string;
            })
            .addCase(deleteDocumentThunk.pending, (state) => {
                state.documentsStatus = 'loading'; // Or a more specific status if you prefer
                state.documentsError = null;
            })
            .addCase(deleteDocumentThunk.fulfilled, (state, action: PayloadAction<number>) => {
                state.documentsStatus = 'succeeded';
                // Filter out the deleted document from the state
                state.documents = state.documents.filter(doc => doc.id !== action.payload);
            })
            .addCase(deleteDocumentThunk.rejected, (state, action) => {
                state.documentsStatus = 'failed';
                state.documentsError = action.payload as string;
            })
            .addCase(uploadDocumentThunk.pending, (state) => {
                state.documentsStatus = 'loading'; // Or a more specific status if you prefer
                state.documentsError = null;
            })
            .addCase(uploadDocumentThunk.fulfilled, (state, action: PayloadAction<DocumentInfo>) => {
                state.documentsStatus = 'succeeded';
                // Add the newly uploaded document to the state.
                // Ensure the payload from your uploadDocument API call matches DocumentInfo structure.
                state.documents.push(action.payload);
            })
            .addCase(uploadDocumentThunk.rejected, (state, action) => {
                state.documentsStatus = 'failed';
                state.documentsError = action.payload as string;
            });
    }
});

export const { clearUserData } = userSlice.actions;

// Selectors for user profile
export const selectUserProfile = (state: any) => state.user.profile;
export const selectUserStatus = (state: any) => state.user.status;
export const selectUserError = (state: any) => state.user.error;

// Selectors for user list (admin)
export const selectUserList = (state: any) => state.user.userList;
export const selectUserListStatus = (state: any) => state.user.userListStatus;
export const selectUserListError = (state: any) => state.user.userListError;
export const selectActionStatus = (state: any) => state.user.actionStatus;
export const selectActionError = (state: any) => state.user.actionError;
export const selectCurrentActionUserId = (state: any) => state.user.currentActionUserId;

// New selectors for document management
export const selectDocuments = (state: any) => state.user.documents;
export const selectDocumentsStatus = (state: any) => state.user.documentsStatus;
export const selectDocumentsError = (state: any) => state.user.documentsError;

export default userSlice.reducer;
