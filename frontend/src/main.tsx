import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-react/dist/Assets.js";
import "@ui5/webcomponents-icons/dist/AllIcons.js";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js";
import App from "./App";

setTheme("sap_horizon_dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
