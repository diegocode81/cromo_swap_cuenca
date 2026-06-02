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

function resolveApkUrl(apkUrl: string): string {
  if (!apkUrl) return "";
  if (apkUrl.startsWith("http")) return apkUrl;
  return `${window.location.origin}${apkUrl}`;
}

/**
 * Abre una URL externamente.
 * En Capacitor/Android, window.open(url, "_system") fuerza el navegador del
 * sistema operativo (fuera del WebView), lo cual permite descargar el APK.
 * Si falla, intenta con "_blank" y luego con window.location.href.
 * Devuelve true si se pudo abrir, false si todos los intentos fallaron.
 */
function openExternalUrl(url: string): boolean {
  try {
    // _system: Capacitor/Cordova estándar para abrir en navegador externo (Android & iOS)
    const ref = window.open(url, "_system");
    if (ref) {
      console.log("[CromoSwap] APK abierto con _system:", url);
      return true;
    }
  } catch (e) {
    console.warn("[CromoSwap] window.open(_system) falló:", e);
  }

  try {
    const ref = window.open(url, "_blank");
    if (ref) {
      console.log("[CromoSwap] APK abierto con _blank:", url);
      return true;
    }
  } catch (e) {
    console.warn("[CromoSwap] window.open(_blank) falló:", e);
  }

  try {
    window.location.href = url;
    console.log("[CromoSwap] APK abierto con location.href:", url);
    return true;
  } catch (e) {
    console.error("[CromoSwap] location.href también falló:", e);
  }

  return false;
}

export function AndroidUpdateChecker() {
  const [latestVersion, setLatestVersion] = useState<AndroidVersion | null>(null);
  const [currentVersion, setCurrentVersion] = useState<CapacitorAppInfo | null>(null);
  const [downloadError, setDownloadError] = useState(false);

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

  function handleUpdatePress() {
    if (!latestVersion) return;

    const url = resolveApkUrl(latestVersion.apkUrl);

    // Validación: URL no vacía
    if (!url) {
      console.error("[CromoSwap] URL de descarga del APK está vacía o inválida.");
      setDownloadError(true);
      return;
    }

    console.log("[CromoSwap] Botón 'Actualizar APK' presionado.");
    console.log("[CromoSwap] URL de descarga resuelta:", url);

    setDownloadError(false);

    const success = openExternalUrl(url);

    if (!success) {
      console.error("[CromoSwap] No se pudo abrir la URL de descarga del APK.");
      setDownloadError(true);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
        <h2 className="text-xl font-black text-ink">Nueva version disponible</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Tienes la version {currentVersion?.version ?? "instalada"}. La ultima version es {latestVersion.versionName}.
        </p>
        {latestVersion.notes ? (
          <p className="mt-3 text-sm text-slate-600">{latestVersion.notes}</p>
        ) : null}

        {downloadError && (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            No pudimos abrir la descarga automáticamente. Intenta desde el navegador.
          </p>
        )}

        <button
          className="btn-primary mt-5 w-full"
          type="button"
          onClick={handleUpdatePress}
        >
          Actualizar APK
        </button>

        {!latestVersion.required ? (
          <button
            className="btn-secondary mt-3 w-full"
            type="button"
            onClick={() => {
              setDownloadError(false);
              setLatestVersion(null);
            }}
          >
            Mas tarde
          </button>
        ) : null}
      </div>
    </div>
  );
}
