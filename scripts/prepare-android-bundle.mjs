/**
 * scripts/prepare-android-bundle.mjs
 *
 * Genera el Android App Bundle (.aab) para Google Play — ejecutar MANUALMENTE con:
 *   npm run android:bundle
 *
 * Lee la versión actual desde android-version.json.
 * NO incrementa versión (el bump ya ocurrió en el commit previo).
 *
 * Hace:
 *   ✅ Capacitor sync
 *   ✅ ./gradlew bundleRelease  → AAB firmado
 *   ✅ Muestra ruta del .aab para subir a Google Play Console
 *
 * NO hace:
 *   ❌ Incremento de versión
 *   ❌ git add / git commit
 *   ❌ Genera APK (para APK usar: npm run android:apk)
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const versionPath = join(root, "public/downloads/android-version.json");
const bundlePath = join(
  root,
  "android/app/build/outputs/bundle/release/app-release.aab"
);
const signingPath = join(root, "android/release-signing.properties");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    stdio: "inherit"
  });
}

if (!existsSync(signingPath)) {
  console.error(
    "[android:bundle] ❌ Falta android/release-signing.properties."
  );
  console.error(
    "[android:bundle]    Ejecuta: npm run android:create-keystore"
  );
  process.exit(1);
}

const version = JSON.parse(readFileSync(versionPath, "utf8"));

console.log(
  `[android:bundle] Construyendo AAB release: ${version.versionName} (${version.versionCode})`
);

run("npx", ["cap", "sync", "android"]);
run("./gradlew", ["bundleRelease"], { cwd: join(root, "android") });

if (!existsSync(bundlePath)) {
  console.error(`[android:bundle] ❌ AAB no encontrado en: ${bundlePath}`);
  process.exit(1);
}

console.log(
  `[android:bundle] ✅ AAB listo: ${version.versionName} (${version.versionCode})`
);
console.log(`[android:bundle]    Ruta: ${bundlePath}`);
console.log(
  `[android:bundle]    → Subir a Google Play Console: android/app/build/outputs/bundle/release/app-release.aab`
);
