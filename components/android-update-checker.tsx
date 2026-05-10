"use client";

import { useEffect, useState } from "react";

type AndroidVersion = {
  versionName: string;
  versionCode: number;
  apkUrl: string;
  required: boolean;
  notes?: string;
};

type CapacitorAppInfo = {
  version?: string;
  build?: string;
};

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

function resolveApkUrl(apkUrl: string) {
  if (apkUrl.startsWith("http")) return apkUrl;
  return `${window.location.origin}${apkUrl}`;
}

export function AndroidUpdateChecker() {
  const [latestVersion, setLatestVersion] = useState<AndroidVersion | null>(null);
  const [currentVersion, setCurrentVersion] = useState<CapacitorAppInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkVersion() {
      if (!window.Capacitor?.isNativePlatform?.()) return;

      const [{ App }, response] = await Promise.all([
        import("@capacitor/app"),
        fetch("/downloads/android-version.json", { cache: "no-store" })
      ]);

      if (!response.ok) return;

      const [appInfo, versionInfo] = await Promise.all([
        App.getInfo() as Promise<CapacitorAppInfo>,
        response.json() as Promise<AndroidVersion>
      ]);
      const currentCode = Number(appInfo.build ?? 0);

      if (!isMounted || !Number.isFinite(versionInfo.versionCode)) return;
      if (versionInfo.versionCode > currentCode) {
        setCurrentVersion(appInfo);
        setLatestVersion(versionInfo);
      }
    }

    checkVersion().catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, []);

  if (!latestVersion) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
        <h2 className="text-xl font-black text-ink">Nueva version disponible</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Tienes la version {currentVersion?.version ?? "instalada"}. La ultima version es {latestVersion.versionName}.
        </p>
        {latestVersion.notes ? <p className="mt-3 text-sm text-slate-600">{latestVersion.notes}</p> : null}
        <a className="btn-primary mt-5 w-full" href={resolveApkUrl(latestVersion.apkUrl)}>
          Actualizar APK
        </a>
        {!latestVersion.required ? (
          <button className="btn-secondary mt-3 w-full" type="button" onClick={() => setLatestVersion(null)}>
            Mas tarde
          </button>
        ) : null}
      </div>
    </div>
  );
}
