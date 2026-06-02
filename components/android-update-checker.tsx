"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Feature flag: controla si se activa el chequeo de actualización manual de APK.
 *
 * - En producción Google Play debe estar en FALSE (la tienda gestiona actualizaciones).
 * - Poner en TRUE solo para distribución manual de APK fuera de Google Play.
 *
 * Variable de entorno: NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK=true|false
 */
const APK_UPDATE_CHECK_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK === "true";

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

function resolveApkUrl(apkUrl: string): string {
  if (!apkUrl) return "";
  if (apkUrl.startsWith("http")) return apkUrl;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://cromoswapcuenca.vercel.app";
  return `${origin}${apkUrl}`;
}

export function AndroidUpdateChecker() {
  const [latestVersion, setLatestVersion] = useState<AndroidVersion | null>(null);
  const [currentVersion, setCurrentVersion] = useState<CapacitorAppInfo | null>(null);
  const [downloadError, setDownloadError] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    // Si el feature flag está desactivado, no hacer nada.
    // En Google Play el sistema gestiona las actualizaciones.
    if (!APK_UPDATE_CHECK_ENABLED) return;

    let isMounted = true;

    async function checkVersion() {
      if (!Capacitor.isNativePlatform()) return;

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

  // Si el flag está desactivado o no hay nueva versión, no renderizar nada.
  if (!APK_UPDATE_CHECK_ENABLED || !latestVersion) return null;

  async function handleUpdatePress() {
    if (!latestVersion || isOpening) return;

    const url = resolveApkUrl(latestVersion.apkUrl);

    console.log("[CromoSwap] Actualizar APK presionado");

    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      console.error("[CromoSwap] URL de descarga inválida o vacía:", url);
      setDownloadError(true);
      return;
    }

    console.log("[CromoSwap] URL a abrir:", url);
    setDownloadError(false);
    setIsOpening(true);

    try {
      if (Capacitor.isNativePlatform()) {
        console.log("[CromoSwap] Entorno nativo detectado");
        console.log("[CromoSwap] Abriendo URL con Capacitor Browser");
        await Browser.open({ url });
        console.log("[CromoSwap] URL abierta correctamente");
      } else {
        console.log("[CromoSwap] Entorno web detectado, usando window.open");
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("[CromoSwap] Error abriendo URL:", err);
      try {
        window.open(url, "_blank");
      } catch {
        setDownloadError(true);
      }
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
        <h2 className="text-xl font-black text-ink">Nueva version disponible</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Tienes la version {currentVersion?.version ?? "instalada"}. La ultima version es{" "}
          {latestVersion.versionName}.
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
          disabled={isOpening}
          onClick={handleUpdatePress}
        >
          {isOpening ? "Abriendo..." : "Actualizar APK"}
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
