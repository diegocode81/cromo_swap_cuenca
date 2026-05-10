"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

export function PwaInstallButton() {
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    setIsNativeApp(Boolean(window.Capacitor?.isNativePlatform?.()));
  }, []);

  if (isNativeApp) return null;

  return (
    <div className="mx-auto mt-4 max-w-md">
      <a className="btn-secondary w-full" href="/downloads/cromoswap-cuenca.apk" download>
        Descargar APK
      </a>
      <p className="mt-2 text-center text-xs font-semibold text-slate-500">
        En Android permite instalar apps desconocidas cuando el sistema lo solicite.
      </p>
    </div>
  );
}
