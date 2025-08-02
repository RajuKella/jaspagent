import { useMsal } from "@azure/msal-react";
import { useAppDispatch } from "../app/hook";
import { loginRequest } from "../auth-config"; // Assuming auth-config path
import { clearState as clearPersistedState } from "../app/statePersistence"; // Assuming statePersistence path
import { logout as reduxLogout } from "../features/auth/authSlice"; // Renamed to avoid conflict
import { clearUserData } from "../features/user/userSlice";
// If you want to clear chat state on logout, uncomment:
// import { clearCurrentChat } from "../features/chat/chatSlice";

const useLogout = () => {
  const { instance } = useMsal();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(clearUserData());
    // If you want to clear chat state on logout, uncomment:
    // dispatch(clearCurrentChat());
    dispatch(reduxLogout()); // Dispatch the Redux logout action
    clearPersistedState(); // Clear persisted state if you're using redux-persist
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  };

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => console.error(e));
  };

  return { handleLogout, handleLogin };
};

export default useLogout;