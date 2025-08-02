//slice is representation of state of different part of the application
//it automatically created the reducer and actions for us
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

interface AuthState {
    isAuthenticated: boolean;
    user: {
        name?: string,
        email?: string
    } | null;
    error: string | null;
    idToken: string | null;
    authToken: string | null;
};

const initialState: AuthState = {
    isAuthenticated: false,
    user: null, 
    idToken: null,
    authToken: null,
    error: null
};



const authSlice = createSlice({
    name: "auth",
    initialState,
    //this object contains the functions that can change the state
    //in the redux we can't directly change the state as it is not considered a good approach, we need to create a copy of the current state then update it and return the updated one
    //here in the reducer function it might seem that we are directly doing it but, in redux they have a library called immer that is acting internally and do this for us
    reducers:{
        setAuthState : (state, action: PayloadAction<{isAuthenticated:boolean, user:any, idToken:string|null, authToken:string|null, error:string|null}>) => {
            state.isAuthenticated = action.payload.isAuthenticated;
            state.user = action.payload.user;
            state.idToken = action.payload.idToken,
            state.error = action.payload.error,
            state.authToken = action.payload.authToken
        },
        logout : (state) => {
            state.isAuthenticated = false,
            state.user = null,
            state.error = null,
            state.idToken = null
            state.authToken = null
        },
    },

});


export const {setAuthState, logout} = authSlice.actions;

export const selectIsAuthenticated = (state:RootState) => state.auth.isAuthenticated;
export const selectUser = (state:RootState) => state.auth.user;
export const selectError = (state:RootState) => state.auth.error;
export const selectIdToken = (state:RootState) => state.auth.idToken;
export const selectAuthToken = (state:RootState) => state.auth.authToken;

export default authSlice.reducer;


