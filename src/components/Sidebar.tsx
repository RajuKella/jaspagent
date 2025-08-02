import React from 'react';
import type { ChatHistory } from '../features/chat/chatSlice';

interface SidebarProps {
  chats: ChatHistory[];
  activeChatId: string | null;
  onChatSelect: (id: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, onChatSelect }) => {
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
            {chats.map((chat) => (
              <li key={chat.chatId}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onChatSelect(chat.chatId);
                  }}
                  className={`flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200
                    ${activeChatId === chat.chatId ? 'bg-gray-200 dark:bg-zinc-700 font-medium' : 'hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                >
                  <svg className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                  </svg>
                  <span className="truncate">{chat.chatTitle}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
