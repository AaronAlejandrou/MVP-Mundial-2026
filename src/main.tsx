
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { ThemeProvider } from "./app/components/ThemeProvider.tsx";
  import { startVersionWatcher } from "./lib/version.ts";
  import "./styles/index.css";

  // Fuerza recarga si hay un deploy nuevo (evita quedarse en caché viejo).
  startVersionWatcher();

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="system" storageKey="mundial-ui-theme">
      <App />
    </ThemeProvider>
  );
  