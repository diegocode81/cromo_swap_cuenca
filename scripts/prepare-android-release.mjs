/**
 * scripts/prepare-android-release.mjs
 *
 * Genera el APK release firmado — ejecutar MANUALMENTE con:
 *   npm run android:apk
 *
 * Lee la versión actual desde android-version.json.
 * NO incrementa versión (el bump ya ocurrió en el commit previo).
 *
 * Hace:
 *   ✅ Capacitor sync
 *   ✅ ./gradlew assembleRelease  → APK firmado
 *   ✅ Copia APK a public/downloads/cromoswap-ecuador.apk (distribución local)
 *
 * NO hace:
 *   ❌ Incremento de versión
 *   ❌ git add / git commit
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const versionPath = join(root, "public/downloads/android-version.json");
const releaseApkSrc = join(root, "android/app/build/outputs/apk/release/app-release.apk");
const releaseApkDst = join(root, "public/downloads/cromoswap-ecuador.apk");
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
    "[android:apk] ❌ Falta android/release-signing.properties."
  );
  console.error(
    "[android:apk]    Ejecuta: npm run android:create-keystore"
  );
  process.exit(1);
}

const version = JSON.parse(readFileSync(versionPath, "utf8"));

console.log(
  `[android:apk] Construyendo APK release: ${version.versionName} (${version.versionCode})`
);

run("npx", ["cap", "sync", "android"]);
run("./gradlew", ["assembleRelease"], { cwd: join(root, "android") });

if (!existsSync(releaseApkSrc)) {
  console.error(`[android:apk] ❌ APK no encontrado en: ${releaseApkSrc}`);
  process.exit(1);
}

writeFileSync(releaseApkDst, readFileSync(releaseApkSrc));

console.log(`[android:apk] ✅ APK listo: ${version.versionName} (${version.versionCode})`);
console.log(`[android:apk]    Ruta: ${releaseApkDst}`);
