
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { ThemeProvider } from "./app/components/ThemeProvider.tsx";
  import { startVersionWatcher } from "./lib/version.ts";
  import "./styles/index.css";

  // Fuerza recarga si hay un deploy nuevo (evita quedarse en caché viejo).
  startVersionWatcher();

  // Tema OSCURO forzado, aplicado ANTES del primer render → sin destello claro
  // ni en la pantalla de "Sincronizando".
  document.documentElement.classList.remove("light");
  document.documentElement.classList.add("dark");

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark" storageKey="mundial-ui-theme">
      <App />
    </ThemeProvider>
  );
  