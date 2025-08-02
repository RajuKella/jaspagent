// Home.tsx
import React, { useEffect } from "react";
import Header from "./Header";
import { useMsal } from "@azure/msal-react";
// Remove loginRequest import, it's now in useLogout
import { loginRequest } from "../auth-config";
import ChatInput from "../components/ChatInput";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
// Remove clearState import, it's now in useLogout

import { useAppDispatch, useAppSelector } from "../app/hook";
import {
  setAuthState,
  selectIsAuthenticated,
  selectAuthToken,
  // Remove logout import, it's now in useLogout
} from "../features/auth/authSlice";
import {
    fetchChatHistory,
    setActiveChat,
    clearCurrentChat,
    fetchChatConversation,
} from "../features/chat/chatSlice";
import { selectActiveChatId, selectChatHistory, selectCurrentChat } from "../features/chat/chatSelectors";
import {
  fetchUserProfileThunk,
  selectUserProfile,
  // Remove clearUserData import, it's now in useLogout
} from "../features/user/userSlice";

const Home: React.FC = () => {
  const { instance, accounts } = useMsal();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authToken = useAppSelector(selectAuthToken);

  const chatHistory = useAppSelector(selectChatHistory);
  const currentChat = useAppSelector(selectCurrentChat);

  const userProfile = useAppSelector(selectUserProfile);
  const activeChatId = useAppSelector(selectActiveChatId);


  useEffect(() => {
    const handleAuthenticationAndDataFetch = async () => {
      if (accounts.length > 0 && !isAuthenticated) {
        const request = {
          // loginRequest is now internal to useLogout if needed for silent acquisition,
          // but for acquireTokenSilent, you might still need to import it here or pass it.
          // For simplicity, let's assume loginRequest is passed if needed.
          // Or, better, refactor the initial auth logic into its own hook too.
          ...loginRequest,
          account: accounts[0],
        };

        try {
          const response = await instance.acquireTokenSilent(request);
          dispatch(
            setAuthState({
              isAuthenticated: true,
              user: {
                name: response.account?.name,
                email: response.account?.username,
              },
              idToken: response.idToken,
              authToken: response.accessToken,
              error: null,
            })
          );

          const profileResult = await dispatch(
            fetchUserProfileThunk()
          ).unwrap();

          let userId = profileResult.id;
          if (!userId) throw new Error("User ID not found in profile data.");

          await dispatch(
            fetchChatHistory({
              userId: String(userId)
            })
          ).unwrap();

        } catch (error: any) {
          console.error("Authentication or data fetching failed:", error);
          if (error.errorCode) {
            // Original loginRequest might still be needed here for redirect
            // For now, let's keep loginRequest import in Home if this part is separate
            // but ideally, initial auth too goes into a hook.
            // instance.loginRedirect(loginRequest);
          } else {
            console.error("API call error:", error);
          }
        }
      }
    };

    if (accounts.length > 0 && !isAuthenticated) {
      handleAuthenticationAndDataFetch();
    }
  }, [accounts, instance, isAuthenticated, dispatch]);


  const handleChatSelect = (chatId: string | null) => {
    dispatch(setActiveChat(chatId));
    dispatch(clearCurrentChat());

    if (chatId && userProfile?.id && authToken) {
      dispatch(fetchChatConversation({
        chatId: chatId,
        userId: userProfile.id
      }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-800">
      {isAuthenticated && (
        <Sidebar
          chats={chatHistory}
          activeChatId={activeChatId}
          onChatSelect={handleChatSelect}
        />
      )}
      <main className="flex-grow flex flex-col h-screen">
        <Header
          appname="JaspAI"
          isAuthenticated={isAuthenticated}
        />

        <div className="flex-grow w-full max-w-3xl mx-auto flex flex-col overflow-y-hidden">
          {isAuthenticated ? (
            <>
              {currentChat.length === 0 && !activeChatId ? (
                <div className="flex-grow flex flex-col justify-center items-center px-4 text-center">
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-300 mb-2">
                    JaspAI
                  </h1>
                  {userProfile ? (
                    <p className="text-gray-700 dark:text-gray-300">
                      Welcome, {userProfile.username}! How can I help you today?
                    </p>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      Loading user data...
                    </p>
                  )}
                </div>
              ) : (
                <MessageList />
              )}

              <div className="w-full px-4">
                <ChatInput/>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-300 mb-4">
                Welcome to JaspAI
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Please log in to use the chatbot.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;