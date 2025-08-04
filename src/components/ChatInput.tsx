import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Button from './Button';
import { useAppDispatch, useAppSelector } from '../app/hook';
import {
  addMessage,
  addChatSession,
  setActiveChat,
  type Message,
} from '../features/chat/chatSlice';
import { selectActiveChatId } from '../features/chat/chatSelectors';
import apiClient from '../api-client'; // Assuming this is your configured Axios instance
import { generateImages } from '../features/chat/chatApi'; // Import the new API call

interface ChatInputProps {
  placeholder?: string;
}

/**
 * Formats the chat message array into a list of [question, answer] tuples
 * for the backend API.
 * @param chat - The array of message objects from the Redux store.
 * @returns An array of [string, string] tuples.
 */
const formatHistory = (chat: Message[]): [string, string][] => {
  const history: [string, string][] = [];
  for (let i = 0; i < chat.length; i += 2) {
    // Only include text messages for history
    if (chat[i]?.sender === 'user' && chat[i + 1]?.sender === 'bot') {
      history.push([chat[i].text, chat[i + 1].text]);
    }
  }
  return history;
};

const ChatInput: React.FC<ChatInputProps> = ({ placeholder = "Ask your question.." }) => {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  // New state for dropdown and web search
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState<boolean>(false); // Defaults to false
  const [isImageGenerationEnabled, setIsImageGenerationEnabled] = useState<boolean>(false); // New state for image generation

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentChat = useAppSelector((state) => state.chat.currentChat);
  const activeChatId = useAppSelector(selectActiveChatId);

  // Ref for the dropdown to handle clicks outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("ChatInput - Redux activeChatId updated to:", activeChatId);
  }, [activeChatId]);

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setAttachedImage(file);
        console.log("Image attached:", file.name);
      } else {
        alert("Please select an image file.");
        event.target.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  // Handle Web Search option click
  const handleWebSearchToggle = () => {
    setIsWebSearchEnabled(prev => !prev);
    setIsImageGenerationEnabled(false); // Disable image generation when web search is toggled
    setShowDropdown(false); // Close dropdown after selection
  };

  // Handle Generate Image option click
  const handleGenerateImageClick = () => {
    setIsImageGenerationEnabled(prev => !prev);
    setIsWebSearchEnabled(false); // Disable web search when image generation is toggled
    setShowDropdown(false); // Close dropdown after selection
  };


  const handleSend = useCallback(async () => {
    console.log("ChatInput - handleSend: activeChatId from Redux when send is triggered:", activeChatId);
    console.log("ChatInput - handleSend: Current sessionId before check:", activeChatId);

    if ((message.trim() || attachedImage) && userProfile) {
      setLoading(true);
      const userMessageId = uuidv4();
      const userMessage: Message = {
        id: userMessageId,
        text: message,
        sender: 'user',
        imageUrl: attachedImage ? URL.createObjectURL(attachedImage) : undefined,
        webSearch: isWebSearchEnabled,
      };
      dispatch(addMessage(userMessage));

      try {
        let currentSessionId = activeChatId;
        let image_urls_for_upload: string[] = []; // Renamed to avoid confusion with bot response image_urls

        if (attachedImage) {
          try {
            const base64Image = await fileToBase64(attachedImage);
            image_urls_for_upload.push(base64Image);
            console.log("Attached image converted to Base64.");
          } catch (conversionError) {
            console.error("Error converting image to Base64:", conversionError);
            throw new Error("Failed to process image attachment.");
          }
        }

        // --- Session ID Handling ---
        // If there's no active session, create a new one. This applies to both regular chat and image generation.
        if (!currentSessionId) {
          console.log("ChatInput - handleSend: activeChatId is null, creating new chat session...");
          const regResponse = await apiClient.post('https://jaspgptdev.azurewebsites.net/jasp-api/chat/session/register', {
            title: message.substring(0, 50) || "New Chat",
            user_id: userProfile.id
          });

          console.log("ChatInput - handleSend: Backend register response data:", regResponse.data);

          currentSessionId = regResponse.data.chat_id;
          const newChatTitle = regResponse.data.chat_title || message.substring(0, 50) || "New Chat";

          if (currentSessionId) {
            console.log("ChatInput - handleSend: New session created:", currentSessionId);
            dispatch(setActiveChat(currentSessionId));
            dispatch(addChatSession({ chatTitle: newChatTitle, chatId: currentSessionId }));
          } else {
            console.error("ChatInput - handleSend: Backend registered session but did not return 'chat_id'. Response:", regResponse.data);
          }
        }

        if (!currentSessionId) {
          throw new Error("Could not create or identify the chat session. (Missing chat_id from response or API error)");
        }

        console.log("ChatInput - handleSend: Using sessionId for interaction:", currentSessionId);

        // --- Conditional API Call based on Feature Selection ---
        if (isImageGenerationEnabled) {
          console.log("ChatInput - handleSend: Calling image generation API.");
          const imageGenResponse = await generateImages(currentSessionId, userProfile.id, message);
          console.log("Image generation response:", imageGenResponse);

          const botMessage: Message = {
            id: uuidv4(),
            text: imageGenResponse.answer, // The generated description
            sender: 'bot',
            imageUrl: imageGenResponse.image_urls && imageGenResponse.image_urls.length > 0 ? imageGenResponse.image_urls[0] : undefined,
            citations: imageGenResponse.citations || [], // Should be empty per backend spec, but good to include
          };
          dispatch(addMessage(botMessage));

        } else { // Default to text interaction with agent (including web search if enabled)
          console.log("ChatInput - handleSend: Calling interact-with-agent API.");
          const historyForBackend = formatHistory(currentChat);

          const agentResponse = await apiClient.post('https://jaspgptdev.azurewebsites.net/jasp-api/chat/interact-with-agent', {
            user_id: userProfile.id,
            session_id: currentSessionId,
            user_input: message,
            history: historyForBackend,
            image_urls: image_urls_for_upload,
            search_internet: isWebSearchEnabled,
          });

          const botMessage: Message = {
            id: uuidv4(),
            text: agentResponse.data.answer,
            sender: 'bot',
            citations: agentResponse.data.citations || [],
          };
          dispatch(addMessage(botMessage));
          console.log("ChatInput - handleSend: Bot response received:", botMessage);
        }

      } catch (error) {
        console.error("ChatInput - Error sending message:", error);
        let errorMessageText = 'Sorry, I ran into an issue. Please try again.';
        if (axios.isAxiosError(error) && error.response) {
          console.error("ChatInput - Axios Error Response Data:", error.response.data);
          console.error("ChatInput - Axios Error Status:", error.response.status);
          errorMessageText = error.response.data.detail || `Error ${error.response.status}: ${error.response.statusText || 'Unknown API Error'}`;
        } else if (error instanceof Error) {
          errorMessageText = `Error: ${error.message}`;
        } else {
          errorMessageText = 'An unknown error occurred.';
        }
        const errorMessage = { id: uuidv4(), text: errorMessageText, sender: 'bot' as const };
        dispatch(addMessage(errorMessage));
      } finally {
        setLoading(false);
        setMessage('');
        setAttachedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Reset web search and image generation to false after sending a message
        // setIsWebSearchEnabled(false);
        // setIsImageGenerationEnabled(false);
      }
    }
  }, [message, attachedImage, userProfile, activeChatId, currentChat, dispatch, isWebSearchEnabled, isImageGenerationEnabled]); // Added isImageGenerationEnabled to dependencies

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (!loading && (message.trim() || attachedImage))) {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-gray-100 dark:bg-gray-700 rounded-3xl shadow-lg flex items-center p-2 relative"> {/* Added relative for dropdown positioning */}
        {/* Paperclip SVG for file upload */}
        <label htmlFor="image-upload" className="cursor-pointer p-2 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageAttach}
            className="hidden"
            disabled={loading || isImageGenerationEnabled} // Disable image upload if image generation is active
          />
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.485L20.5 13.5"></path>
          </svg>
        </label>

        {/* New Plus Button for Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            disabled={loading}
            className="p-2 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 rounded-full"
            aria-label="More options"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </button>

          {/* Dropdown Content */}
          {showDropdown && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 z-10">
              <button
                onClick={handleWebSearchToggle}
                className={`w-full text-left px-4 py-2 text-sm ${isWebSearchEnabled ? 'bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white' : 'text-gray-700 dark:text-gray-200'} hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                Web Search {isWebSearchEnabled && (
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </button>
              <button
                onClick={handleGenerateImageClick}
                className={`w-full text-left px-4 py-2 text-sm ${isImageGenerationEnabled ? 'bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white' : 'text-gray-700 dark:text-gray-200'} hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                Generate Image {isImageGenerationEnabled && (
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        <input
          type="text"
          value={message}
          onChange={handleChange}
          onKeyUp={handleKeyPress}
          placeholder={loading ? 'JaspAI is thinking...' : placeholder}
          className="flex-grow p-2.5 rounded-2xl focus:outline-none bg-transparent text-gray-900 dark:text-gray-100"
          disabled={loading}
        />

        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={(!message.trim() && !attachedImage) || loading}
          className="!p-2.5 !w-10 !h-10 rounded-full shadow-md"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg viewBox="-19.04 0 75.804 75.804" xmlns="http://www.w3.org/2000/svg" fill="#000000">
              <g id="SVGRepo_iconCarrier">
                <g id="Group_65" data-name="Group 65" transform="translate(-831.568 -384.448)">
                  <path id="Path_57" data-name="Path 57" d="M833.068,460.252a1.5,1.5,0,0,1-1.061-2.561l33.557-33.56a2.53,2.53,0,0,0,0-3.564l-33.557-33.558a1.5,1.5,0,0,1,2.122-2.121l33.556,33.558a5.53,5.53,0,0,1,0,7.807l-33.557,33.56A1.5,1.5,0,0,1,833.068,460.252Z" fill="#ffffff"></path>
                </g>
              </g>
            </svg>
          )}
        </Button>
      </div>
      {/* Display attached image name */}
      {attachedImage && (
        <div className="w-full max-w-2xl mx-auto mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between text-sm text-gray-700 dark:text-gray-200 shadow-md">
          <span>Attached: <span className="font-semibold">{attachedImage.name}</span></span>
          <button
            onClick={handleRemoveImage}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 ml-2"
            title="Remove attachment"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}
      {/* Display web search enabled indicator */}
      {isWebSearchEnabled && (
        <div className="w-full max-w-2xl mx-auto mt-2 p-1 bg-blue-100 dark:bg-blue-700 rounded-lg text-sm text-blue-700 dark:text-blue-100 shadow-md text-center">
          Web Search is ON for the next query.
        </div>
      )}
      {/* Display image generation enabled indicator */}
      {isImageGenerationEnabled && (
        <div className="w-full max-w-2xl mx-auto mt-2 p-1 bg-green-100 dark:bg-green-700 rounded-lg text-sm text-green-700 dark:text-green-100 shadow-md text-center">
          Image Generation is ON for the next query.
        </div>
      )}
    </div>
  );
};

export default ChatInput;