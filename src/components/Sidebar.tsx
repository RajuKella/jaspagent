import React from 'react';
import type { ChatHistory } from '../features/chat/chatSlice';

interface SidebarProps {
  chats: ChatHistory[];
  activeChatId: string | null;
  onChatSelect: (id: string | null) => void;
  onChatDelete: (id: string) => void;
  deletingChatId: string | null; // New prop for tracking the chat being deleted
}

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, onChatSelect, onChatDelete, deletingChatId }) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-100 dark:bg-zinc-900 p-4 flex flex-col">
      <button
        onClick={() => onChatSelect(null)}
        className="mb-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + New Chat
      </button>
      <nav className="flex-grow overflow-y-auto">
        {chats.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 p-4">
            <p className="mb-2">No chats available.</p>
            <p>Send a message to start a new conversation!</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {chats.map((chat) => {
              const isDeleting = deletingChatId === chat.chatId;

              return (
                <li key={chat.chatId}>
                  <div
                    className={`flex items-center justify-between p-2 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200
                      ${activeChatId === chat.chatId ? 'bg-gray-200 dark:bg-zinc-700 font-medium' : 'hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                  >
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onChatSelect(chat.chatId);
                      }}
                      className="flex-grow flex items-center min-w-0"
                    >
                      <svg className="w-5 h-5 mr-3 flex-shrink-0 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                      </svg>
                      <span className="truncate">{chat.chatTitle}</span>
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDeleting) { // Prevent multiple clicks
                            onChatDelete(chat.chatId);
                        }
                      }}
                      className={`p-1 text-red-200 hover:text-red-700 flex-shrink-0 ${isDeleting ? 'cursor-not-allowed' : ''}`}
                      disabled={isDeleting} // Disable the button while deleting
                      aria-label="Delete chat"
                    >
                      {isDeleting ? (
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;