"use client";

import { useEffect, useState } from "react";

type AndroidVersion = {
  versionName: string;
  versionCode: number;
};

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

export function AppVersionLabel() {
  const [version, setVersion] = useState<AndroidVersion | null>(null);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsNativeApp(Boolean(window.Capacitor?.isNativePlatform?.()));

    fetch("/downloads/android-version.json", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: AndroidVersion | null) => {
        if (isMounted && data?.versionName) setVersion(data);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  if (!version) return null;

  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-5 text-center text-[11px] font-semibold text-slate-400 sm:px-6">
      CromoSwap {isNativeApp ? "Android" : "Web"} v{version.versionName}
    </footer>
  );
}
