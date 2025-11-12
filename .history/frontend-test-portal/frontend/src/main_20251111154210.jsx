import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
  console.warn(
    "VITE_GOOGLE_CLIENT_ID is not set; Google Sign-In will not render correctly."
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId || ""}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
