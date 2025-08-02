import React from 'react';
import Header from './Header';
import { useAppSelector } from '../app/hook';
import {
  selectUserProfile,
  selectUserStatus,
  selectUserError,
} from '../features/user/userSlice';
import { selectIsAuthenticated } from '../features/auth/authSlice';
import AdminUserList from '../components/AdminUserList';

// A simple interface to help with type hinting, based on your provided payload structure
interface UserProfileData {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  total_documents_allowed: number;
  documents_uploaded: number;
}

const UserAccount: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userProfile = useAppSelector(selectUserProfile) as UserProfileData | null;
  const userStatus = useAppSelector(selectUserStatus);
  const userError = useAppSelector(selectUserError);

  // Random placeholder image for all users
  const profilePicUrl = "https://api.dicebear.com/7.x/pixel-art/svg?seed=JaspAIUser&size=64&scale=90";

  // Function to format the created_at date
  const formatCreatedAt = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString; // Return as is if formatting fails
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header
        appname="JaspAI User Profile"
        isAuthenticated={isAuthenticated}
      />

      {/* Main content area: Flex container for sidebar and main content */}
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-8 max-w-7xl mx-auto w-full"> {/* Added gap, max-width, and mx-auto */}
        {/* Sidebar for User Profile */}
        <aside className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0"> {/* Sidebar takes 1/3 or 1/4 width on medium/large screens */}
          <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8 transform hover:scale-105 transition-transform duration-300 ease-in-out">
            <div className="flex flex-col items-center mb-8">
              <img
                src={profilePicUrl}
                alt="User Profile"
                className="w-24 h-24 rounded-full border-4 border-purple-500 dark:border-purple-400 object-cover mb-4 shadow-lg"
              />
              <h1 className="text-3xl font-extrabold text-center mb-2">
                {userProfile?.username || "Guest User"}
              </h1>
              <p className="text-md text-gray-600 dark:text-gray-400">
                {userProfile?.role ? userProfile.role.toUpperCase() : "UNKNOWN ROLE"}
              </p>
            </div>

            <div className="space-y-4 text-lg">
              {userStatus === "loading" && (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading profile data...</p>
              )}

              {userError && (
                <p className="text-center text-red-500 font-medium">Error: {userError}</p>
              )}

              {userProfile ? (
                <>
                  <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-zinc-700">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">User ID:</span>
                    <span className="text-purple-600 dark:text-purple-300">{userProfile.id}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-zinc-700">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span>
                    <span className="text-gray-800 dark:text-gray-200">{userProfile.email}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-zinc-700">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Member Since:</span>
                    <span className="text-gray-800 dark:text-gray-200">{formatCreatedAt(userProfile.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-zinc-700">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Documents Uploaded:</span>
                    <span className="text-gray-800 dark:text-gray-200">{userProfile.documents_uploaded}</span>
                  </div>
                  {/* <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Document Limit:</span>
                    <span className="text-green-600 dark:text-green-400">{userProfile.total_documents_allowed}</span>
                  </div> */}
                </>
              ) : (
                userStatus !== "loading" && !userError && (
                  <p className="text-center text-gray-500 dark:text-gray-400">No user profile data available. Please log in.</p>
                )
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area for AdminUserList */}
        <section className="flex-grow"> {/* Takes remaining space */}
          <AdminUserList />
        </section>
      </main>
    </div>
  );
};

export default UserAccount;