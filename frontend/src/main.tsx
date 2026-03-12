import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-react/dist/Assets.js";
import "@ui5/webcomponents-icons/dist/AllIcons.js";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js";
import App from "./App";
import "@/styles/design-tokens.css";
import { apiUrl } from "@/utils/basePath";

setTheme("sap_horizon_dark");

// Auto-reload when HA shows/hides the ingress iframe with a stale version
let knownVersion: string | null = null;
fetch(`${apiUrl("/api")}/health`).then(r => r.json()).then(d => { knownVersion = d.version; }).catch(() => {});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !knownVersion) return;
  fetch(`${apiUrl("/api")}/health`, { cache: "no-store" })
    .then(r => r.json())
    .then(d => {
      if (d.version && d.version !== knownVersion) {
        window.location.reload();
      }
    })
    .catch(() => {});
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
