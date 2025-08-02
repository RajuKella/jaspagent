This is a full-stack React + Redux application featuring Azure AD authentication, chat with document and image support, user profile management, and an admin dashboard for user/document management.

## Features

- **Azure AD Authentication** (via MSAL)
- **Chatbot** with support for:
  - Text and image input
  - Source citations (documents and internet)
  - Persistent chat history
- **User Profile** page
- **Document Management** (upload, delete, status)
- **Admin Dashboard** for user management (list, update limits, delete users)
- **Dark/Light Theme Toggle**
- **State Persistence** (localStorage)
- **TypeScript** throughout

---

## Project Structure

```
src/
  App.tsx                # Main app entry, routing, providers
  main.tsx               # ReactDOM root
  auth-config.ts         # Azure AD/MSAL config
  vite-env.d.ts          # Vite types
  index.css              # Tailwind + global styles
  App.css                # (optional, app-specific styles)
  app/
    store.ts             # Redux store setup
    hook.ts              # Typed Redux hooks
    statePersistence.ts  # State persistence logic
    types.ts             # RootState/AppDispatch types
  components/
    AdminUserList.tsx    # Admin: user list, edit limits, delete
    Button.tsx           # Reusable button component
    ChatInput.tsx        # Chat input (text/image)
    MessageList.tsx      # Chat message display
    Sidebar.tsx          # Chat session sidebar
    ThemeToggleButton.tsx# Light/dark mode toggle
  features/
    auth/
      authSlice.ts       # Redux slice for authentication
    chat/
      chatApi.ts         # API calls for chat
      chatSelectors.ts   # Chat selectors
      chatSlice.ts       # Redux slice for chat state
    user/
      userSlice.ts       # Redux slice for user/admin/documents
    admin/               # (reserved for admin features)
  hooks/
    userLogout.ts        # Custom hook for login/logout logic
  layouts/
    Header.tsx           # Top navigation/header
    Home.tsx             # Main chat page
    DocumentPage.tsx     # Document management UI
    UserAccount.tsx      # User profile/account page
  services/
    afterLogin.ts        # API: fetch user profile
    adminUsers.ts        # API: admin user management
    documents.ts         # API: document management
  assets/
    react.svg            # (example asset)
```

---

## Getting Started

### 1. Install Dependencies

```sh
npm install
```

### 2. Environment Variables

Create a `.env` file in the root with your Azure AD and API config:

```
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_AUTHORITY=your-authority-url
VITE_AZURE_REDIRECT_URI=http://localhost:5173
VITE_AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
VITE_AZURE_API_SCOPE=api://your-api-scope/.default
```

### 3. Run the App

```sh
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

---

## Key Files & Folders

- **[src/App.tsx](src/App.tsx):** App entry, routing, providers
- **[src/app/store.ts](src/app/store.ts):** Redux store setup
- **[src/features/auth/authSlice.ts](src/features/auth/authSlice.ts):** Auth state
- **[src/features/chat/chatSlice.ts](src/features/chat/chatSlice.ts):** Chat state
- **[src/features/user/userSlice.ts](src/features/user/userSlice.ts):** User/admin/documents state
- **[src/layouts/Home.tsx](src/layouts/Home.tsx):** Main chat UI
- **[src/layouts/DocumentPage.tsx](src/layouts/DocumentPage.tsx):** Document management
- **[src/layouts/UserAccount.tsx](src/layouts/UserAccount.tsx):** User profile
- **[src/components/AdminUserList.tsx](src/components/AdminUserList.tsx):** Admin user management

---

## Tech Stack

- **React 19** + **TypeScript**
- **Redux Toolkit**
- **MSAL (Azure AD)**
- **Axios** (API calls)
- **Tailwind CSS**
- **Vite** (build tool)

---

## Customization

- Update API endpoints in `src/services/` as needed.
- Adjust authentication scopes/config in [`src/auth-config.ts`](src/auth-config.ts).
- Add new features in `features/`, `components/`, or `layouts/` as needed.

---

## License

This project is private and for internal use.

---

## Credits

- Built with [React](https://react.dev/), [Redux Toolkit](https://redux-toolkit.js.org/), [MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-js), and [Tailwind CSS](https://tailwindcss.com/).