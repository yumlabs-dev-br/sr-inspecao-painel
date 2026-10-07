import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// TODO Etapa 4: registre o service worker (public/sw.js) para o painel abrir sem internet —
// só no build (import.meta.env.PROD), porque no npm run dev ele atrapalharia o Vite:
//   if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/sw.js")
