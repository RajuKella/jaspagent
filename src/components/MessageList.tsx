import React, { useEffect, useRef } from 'react';
import { useAppSelector } from '../app/hook';
import ReactMarkdown from 'react-markdown';
import { type Citation } from '../features/chat/chatSlice'; // Only import base Citation type
import axios from 'axios';

const MessageList: React.FC = () => {
  const messages = useAppSelector((state) => state.chat.currentChat);
  const userProfile = useAppSelector((state) => state.user.profile);
  const authToken = useAppSelector((state) => state.auth.authToken);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Automatically scroll down to the newest message whenever the list updates
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up Object URLs when messages change or component unmounts
  useEffect(() => {
    const objectUrls: string[] = [];
    messages.forEach(message => {
      if (message.imageUrl && message.imageUrl.startsWith('blob:')) {
        objectUrls.push(message.imageUrl);
      }
    });

    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [messages]);


  // Function to handle citation click
  const handleCitationClick = async (citation: Citation) => {
    console.log("Citation clicked (MessageList):", citation); // DEBUG LOG

    if (citation.doc_id) { // Check for doc_id to identify document citations
      if (!userProfile || !authToken) {
        console.error("User not logged in or auth token missing. Cannot fetch document.");
        // Replaced alert with a custom notification logic if available, or just a console error
        // For now, let's keep the alert as per the original code.
        alert("Please log in to view documents.");
        return;
      }

      try {
        const baseUrl = "http://localhost:8000/jasp-api/docs";
        const url = `${baseUrl}/citation-doc/${citation.doc_id}`;

        const params: { user_id: number; page?: number } = {
          user_id: userProfile.id
        };
        if (citation.page !== undefined) {
          params.page = citation.page;
        }

        console.log(`Attempting to fetch document for doc_id: ${citation.doc_id}, page: ${citation.page || 'N/A'}`);

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${authToken}`
          },
          params: params
        });

        const sasUrl = response.data.url;
        const documentName = response.data.document_name;

        if (sasUrl) {
          window.open(sasUrl, '_blank');
          console.log(`Opened document: "${documentName}" (Doc ID: ${citation.doc_id})`);
        } else {
          console.error("SAS URL not received for citation:", citation);
          alert("Failed to get document URL. Please try again.");
        }

      } catch (error) {
        console.error("Error fetching citation document:", error);
        if (axios.isAxiosError(error) && error.response) {
          console.error("API Error Response:", error.response.data);
          alert(`Error viewing document: ${error.response.data.detail || 'An unexpected error occurred.'}`);
        } else {
          alert("An error occurred while trying to open the document.");
        }
      }
    } else if (citation.internet_url) { // Check for internet_url to identify internet citations
      console.log("Handling internet citation (MessageList):", citation); // DEBUG LOG
      if (citation.internet_url) {
        window.open(citation.internet_url, '_blank');
        console.log(`Opened internet source: "${citation.internet_title}" (URL: ${citation.internet_url})`);
      } else {
        console.warn("Internet citation has no URL:", citation);
        alert("No URL available for this internet source.");
      }
    } else {
        console.warn("Unknown citation type or missing identifying properties:", citation); // DEBUG LOG for unexpected types
        alert("This source is currently unavailable or in an unknown format.");
    }
  };

  return (
    <div className="flex-grow w-full overflow-y-auto p-4 space-y-6">
      {messages.map((message) => {
        const isUser = message.sender === 'user';

        const wrapperClasses = `flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`;

        const bubbleClasses = `max-w-xl px-4 py-3 rounded-2xl shadow-sm`;
        const userBubbleClasses = 'bg-blue-100 text-gray-900 dark:bg-blue-900/60 dark:text-blue-50';
        const botBubbleClasses = 'bg-gray-100 text-gray-800 dark:bg-zinc-700 dark:text-gray-200';

        return (
          <div key={message.id} className={wrapperClasses}>
            {!isUser && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 dark:bg-zinc-600 flex items-center justify-center text-lg">
                ✨
              </div>
            )}

            <div className={`${bubbleClasses} ${isUser ? userBubbleClasses : botBubbleClasses}`}>
              {/* Display image if imageUrl exists */}
              {message.imageUrl && (
                <div className="mb-2">
                  <img
                    src={message.imageUrl}
                    alt="Attached"
                    className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-zinc-600"
                    style={{ maxHeight: '200px' }} // Limit image height for chat display
                  />
                </div>
              )}

              {/* Display message text if it exists and isn't just whitespace */}
              {message.text.trim() && (
                <ReactMarkdown>
                  {message.text}
                </ReactMarkdown>
              )}


              {/* Conditionally render citations for bot messages */}
              {!isUser && message.citations && message.citations.length > 0 && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-300 dark:border-zinc-600 pt-2">
                  <strong className="block mb-1">Sources:</strong>
                  <ul className="list-disc list-inside space-y-1">
                    {message.citations.map((citation, index) => {
                      // Check for document citations with a doc_id and a name
                      const isDocumentCitation = !!citation.doc_id && !!citation.document_name;
                      // Check for internet citations with both a title and a URL
                      const isInternetCitation = !!citation.internet_url && !!citation.internet_title;

                      // If neither condition is met, don't render anything for this citation.
                      if (!isDocumentCitation && !isInternetCitation) {
                        return null;
                      }

                      let citationTitle;
                      if (isDocumentCitation) {
                        citationTitle = `${citation.document_name}${citation.page ? ` (Page ${citation.page})` : ''}`;
                      } else { // It must be an internet citation due to the check above
                        citationTitle = citation.internet_title;
                      }

                      return (
                        <li key={index} className="flex items-center">
                          <button
                            type="button"
                            className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                            onClick={() => handleCitationClick(citation)}
                            title={isDocumentCitation
                              ? `Click to view ${citation.document_name}${citation.page ? ` (page ${citation.page})` : ''}`
                              : `Click to visit ${citation.internet_title}${citation.internet_url ? ` (${citation.internet_url})` : ''}`}
                          >
                            {citationTitle}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageList;
