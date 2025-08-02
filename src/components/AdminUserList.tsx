// components/AdminUserList.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import {
  fetchAllUsersThunk,
  updateLimitThunk,
  deleteUserThunk,
  selectUserList,
  selectUserListStatus,
  selectUserListError,
  selectUserProfile,
  selectActionStatus,
  selectActionError,
  selectCurrentActionUserId,
  type UserListItem
} from '../features/user/userSlice';
import { selectAuthToken } from '../features/auth/authSlice';

// REPLACE THIS SVG with a Material Symbols icon or directly import from a library
// You MUST add the Material Symbols stylesheet link to your public/index.html or equivalent
const ReloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <span className={`material-symbols-outlined ${className}`}>
    refresh
  </span>
);

// SVG for update icon (e.g., checkmark or floppy disk)
const UpdateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// SVG for delete icon (e.g., trash can)
const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.708 6.713M14.74 9V5.25a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25V9m9.228 3.382c.304.075.64.148.981.223V12h.75M9.256 12H9.75v-.75m-4.5 0h-.75" />
  </svg>
);


const AdminUserList: React.FC = () => {
  const dispatch = useAppDispatch();
  const userList = useAppSelector(selectUserList);
  const userListStatus = useAppSelector(selectUserListStatus);
  const userListError = useAppSelector(selectUserListError);
  const authToken = useAppSelector(selectAuthToken);
  const currentUserProfile = useAppSelector(selectUserProfile);

  const actionStatus = useAppSelector(selectActionStatus);
  const actionError = useAppSelector(selectActionError);
  const currentActionUserId = useAppSelector(selectCurrentActionUserId);

  const [editedLimits, setEditedLimits] = useState<{ [key: number]: number }>({});
  const [limitChanged, setLimitChanged] = useState<{ [key: number]: boolean }>({});

  const handleFetchUsers = () => {
    if (authToken && currentUserProfile?.id) {
      dispatch(fetchAllUsersThunk({userId: String(currentUserProfile.id) }));
    } else {
      console.warn("Cannot fetch users: Authentication token or current user ID is missing.");
    }
  };

  useEffect(() => {
    if (userListStatus === 'idle') {
      handleFetchUsers();
    }
  }, [userListStatus, authToken, currentUserProfile?.id]); // Added authToken and currentUserProfile.id to dependencies

  useEffect(() => {
    if (actionStatus === 'succeeded' && currentActionUserId === null) {
      handleFetchUsers();
      setEditedLimits({});
      setLimitChanged({});
    }
  }, [actionStatus, currentActionUserId]);

  const handleLimitChange = (userId: number, value: string) => {
    const newLimit = parseInt(value, 10);
    if (!isNaN(newLimit) && newLimit >= 0) {
      setEditedLimits(prev => ({ ...prev, [userId]: newLimit }));
      const originalUser = userList.find((user: UserListItem) => user.id === userId);
      if (originalUser && originalUser.total_documents_allowed !== newLimit) {
        setLimitChanged(prev => ({ ...prev, [userId]: true }));
      } else {
        setLimitChanged(prev => ({ ...prev, [userId]: false }));
      }
    } else if (value === '') {
        setEditedLimits(prev => ({ ...prev, [userId]: NaN }));
        setLimitChanged(prev => ({ ...prev, [userId]: true }));
    }
  };

  const handleUpdateLimit = (user: UserListItem) => {
    if (authToken && user.id && editedLimits[user.id] !== undefined && !isNaN(editedLimits[user.id])) {
      const newLimit = editedLimits[user.id];
      const documentsUploaded = user.documents_uploaded; // Use current value from the list
      dispatch(updateLimitThunk({userId: user.id, newLimit, documentsUploaded }));
    } else {
        console.warn("Attempted to update limit with invalid data.", { userId: user.id, newLimit: editedLimits[user.id] });
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (authToken && userId && window.confirm(`Are you sure you want to delete user ID: ${userId}?`)) {
      dispatch(deleteUserThunk({userId }));
    }
  };

  const isFetchingUsers = userListStatus === 'loading';
  const canPerformActions = authToken && currentUserProfile?.id;

  return (
    <div className="container mx-auto p-4 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-purple-700 dark:text-purple-400">
        Admin User List
      </h1>

      <div className="flex justify-center mb-8">
        <button
          onClick={handleFetchUsers}
          disabled={isFetchingUsers || !canPerformActions}
          className={`p-3 rounded-full flex items-center justify-center transition-all duration-200
            ${isFetchingUsers || !canPerformActions
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'
            }`}
          aria-label={isFetchingUsers ? 'Fetching user list' : 'Refresh user list'}
        >
          <ReloadIcon className={`w-6 h-6 ${isFetchingUsers ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {(isFetchingUsers || actionStatus === 'pending') && (
        <p className="text-center text-lg text-gray-600 dark:text-gray-400 mt-8">
          {isFetchingUsers ? 'Loading users...' : 'Performing action...'}
        </p>
      )}

      {(userListError || actionError) && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-md relative text-center mt-8" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{userListError || actionError}</span>
        </div>
      )}

      {userListStatus === 'succeeded' && userList.length > 0 && (
        <div className="overflow-x-auto shadow-xl rounded-lg mt-8">
          <table className="min-w-full bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
            <thead className="bg-purple-600 dark:bg-purple-800 text-white">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">ID</th>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Username</th>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Email</th>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Docs Uploaded</th>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Doc Limit</th>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              {userList.map((user: UserListItem) => {
                // Determine if a specific action (update/delete) is pending for this user
                const isActionPendingForThisUser = actionStatus === 'pending' && currentActionUserId === user.id;

                // Determine the current value for the input, prioritize edited over original
                const currentLimitValue = editedLimits[user.id] !== undefined
                                        ? editedLimits[user.id]
                                        : user.total_documents_allowed;
                // Check if the limit has truly changed from the original for enabling update button
                const hasLimitChanged = limitChanged[user.id] || false;

                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors duration-150">
                    <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-200">{user.id}</td>
                    <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-200">{user.username}</td>
                    <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-200">{user.email}</td>
                    <td className="py-4 px-6 whitespace-nowrap text-gray-700 dark:text-gray-300">{user.documents_uploaded}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={isNaN(currentLimitValue) ? '' : currentLimitValue}
                        onChange={(e) => handleLimitChange(user.id, e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 dark:border-zinc-700 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={isActionPendingForThisUser} // Disable input if action is pending for THIS user
                      />
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateLimit(user)}
                          disabled={!hasLimitChanged || isActionPendingForThisUser || !canPerformActions}
                          className={`p-2 rounded-md transition-all duration-200
                            ${(!hasLimitChanged || isActionPendingForThisUser || !canPerformActions)
                              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          aria-label={`Update limit for ${user.username}`}
                        >
                          <UpdateIcon className={`w-5 h-5 ${isActionPendingForThisUser ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isActionPendingForThisUser || !canPerformActions}
                          className={`p-2 rounded-md transition-all duration-200
                            ${(isActionPendingForThisUser || !canPerformActions)
                              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          aria-label={`Delete user ${user.username}`}
                        >
                          <DeleteIcon className={`w-5 h-5 ${isActionPendingForThisUser ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {userListStatus === 'succeeded' && userList.length === 0 && (
        <p className="text-center text-lg text-gray-600 dark:text-gray-400 mt-8">No users found.</p>
      )}
    </div>
  );
};

export default AdminUserList;