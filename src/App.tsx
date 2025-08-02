// App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./layouts/Home";
import DocumentPage from "./layouts/DocumentPage";
import UserAccount from "./layouts/UserAccount";
import { MsalProvider } from "@azure/msal-react";
// Import the *already initialized* msalInstance from auth-utils
import { msalInstance } from "./auth-utils"; // <<< Import the pre-initialized instance

import { Provider } from "react-redux";
import { store } from "./app/store";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  {path: "/documents", element:<DocumentPage/>},
  {path: "/account", element:<UserAccount/>},
]);

function App() {
  return (
    <Provider store={store}>
      <MsalProvider instance={msalInstance}> {/* Pass the *same* initialized instance */}
        <RouterProvider router={router} />
      </MsalProvider>
    </Provider>
  );
}

export default App;