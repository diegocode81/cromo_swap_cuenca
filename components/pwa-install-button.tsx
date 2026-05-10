"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [message, setMessage] = useState("");
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(standalone);

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMessage("");
    }

    function onInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
      setMessage("App instalada correctamente.");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (isInstalled) {
      setMessage("La app ya esta instalada en este dispositivo.");
      return;
    }

    if (!installPrompt) {
      setMessage("En Android abre esta pagina con Chrome y usa Instalar app desde el menu.");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setMessage(choice.outcome === "accepted" ? "Instalacion iniciada." : "Instalacion cancelada.");
  }

  return (
    <div className="mx-auto mt-4 max-w-md">
      <button className="btn-secondary w-full" type="button" onClick={installApp}>
        Descargar app
      </button>
      {message ? <p className="mt-2 text-center text-xs font-semibold text-slate-500">{message}</p> : null}
    </div>
  );
}
