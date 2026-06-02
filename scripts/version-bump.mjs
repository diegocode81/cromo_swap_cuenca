/**
 * scripts/version-bump.mjs
 *
 * Versionado automático ligero — invocado desde .githooks/pre-commit.
 *
 * Hace ÚNICAMENTE:
 *   ✅ Detecta el tipo de bump (major / minor / patch) según archivos cambiados
 *   ✅ Incrementa versionCode y versionName
 *   ✅ Actualiza public/downloads/android-version.json
 *   ✅ Actualiza android/app/build.gradle
 *   ✅ git add de esos dos archivos (sin artefactos binarios)
 *
 * NO hace:
 *   ❌ Gradle / assembleRelease / bundleRelease
 *   ❌ Capacitor sync
 *   ❌ Generación de APK o AAB
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const versionPath = join(root, "public/downloads/android-version.json");
const gradlePath = join(root, "android/app/build.gradle");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit"
  });
}

function gitLines(args) {
  try {
    return run("git", args, { capture: true })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function unique(values) {
  return [...new Set(values)];
}

function detectBump(changedFiles) {
  const forced = process.env.ANDROID_VERSION_BUMP?.trim().toLowerCase();
  if (["major", "minor", "patch"].includes(forced)) return forced;

  // Ignorar archivos que no son relevantes para el versionado
  const relevantFiles = changedFiles.filter(
    (file) =>
      !file.startsWith("public/downloads/") &&
      !file.startsWith("android/app/build/") &&
      !file.startsWith("android/.gradle/") &&
      !file.endsWith(".log")
  );

  // Major: cambios en base de datos, auth o middleware
  if (
    relevantFiles.some(
      (file) =>
        file === "prisma/schema.prisma" ||
        file.startsWith("prisma/migrations/") ||
        file.startsWith("app/api/auth/") ||
        file.startsWith("app/api/user-stickers/") ||
        file === "middleware.ts"
    )
  ) {
    return "major";
  }

  // Minor: archivos nuevos o cambios en app, components, lib, android
  const newFiles = gitLines(["diff", "--cached", "--name-only", "--diff-filter=A"]);
  if (
    newFiles.length > 0 ||
    relevantFiles.some(
      (file) =>
        file.startsWith("app/") ||
        file.startsWith("components/") ||
        file.startsWith("lib/") ||
        file.startsWith("android/") ||
        file === "capacitor.config.ts" ||
        file === "package.json"
    )
  ) {
    return "minor";
  }

  // Patch: resto de cambios (docs, config, scripts, etc.)
  return "patch";
}

function bumpVersion(versionName, bump) {
  const parts = versionName.split(".").map((part) => Number(part));
  const [major = 0, minor = 0, patch = 0] = parts;

  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function updateGradleVersion(versionCode, versionName) {
  const gradle = readFileSync(gradlePath, "utf8")
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);
  writeFileSync(gradlePath, gradle);
}

// ── Ejecución principal ──────────────────────────────────────────────────────

const version = JSON.parse(readFileSync(versionPath, "utf8"));

const changedFiles = unique([
  ...gitLines(["diff", "--cached", "--name-only"]),
  ...gitLines(["diff", "--name-only"])
]);

const bump = detectBump(changedFiles);
const nextVersionName = bumpVersion(version.versionName, bump);
const nextVersionCode = Number(version.versionCode) + 1;

version.versionName = nextVersionName;
version.versionCode = nextVersionCode;
version.apkUrl = "/downloads/cromoswap-cuenca.apk";
version.required =
  process.env.ANDROID_UPDATE_REQUIRED === "true" ? true : Boolean(version.required);
version.notes = `Actualizacion ${nextVersionName} (${bump}).`;

updateGradleVersion(nextVersionCode, nextVersionName);
writeFileSync(versionPath, `${JSON.stringify(version, null, 2)}\n`);

// Solo añadir los archivos de versión — sin APK ni AAB binarios
run("git", ["add", gradlePath, versionPath]);

console.log(
  `[version-bump] ✅ ${nextVersionName} (${nextVersionCode}) — bump: ${bump}`
);
