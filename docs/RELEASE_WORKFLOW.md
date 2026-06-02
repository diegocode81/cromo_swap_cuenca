# CromoSwap Ecuador — Workflow de Release

Guía del flujo de trabajo diario y de generación de artefactos Android.

---

## 🔄 Flujo antiguo vs flujo nuevo

### ❌ Flujo anterior (problemático)
```
git commit
  └── .githooks/pre-commit
        └── npm run android:release-apk
              └── scripts/prepare-android-release.mjs
                    ├── bump versión
                    ├── npx cap sync android      ← lento
                    ├── ./gradlew assembleRelease  ← muy lento (~5-10s)
                    ├── copia APK al repo
                    └── git add APK binario        ← repositorio crece ~30 MB/commit
```
**Problema:** cada commit, incluso de documentación, ejecutaba Gradle completo.

### ✅ Flujo nuevo (separación de responsabilidades)
```
git commit
  └── .githooks/pre-commit
        └── scripts/version-bump.mjs    ← solo JSON + Gradle versión, < 1s
              ├── detecta tipo de bump
              ├── actualiza android-version.json
              ├── actualiza build.gradle
              └── git add (solo 2 archivos de texto)

npm run android:apk                     ← manual, cuando se necesita
  └── scripts/prepare-android-release.mjs
        ├── lee versión actual
        ├── npx cap sync android
        ├── ./gradlew assembleRelease   → APK firmado
        └── copia APK (NO a git)

npm run android:bundle                  ← manual, cuando se necesita
  └── scripts/prepare-android-bundle.mjs
        ├── lee versión actual
        ├── npx cap sync android
        ├── ./gradlew bundleRelease     → AAB firmado
        └── muestra ruta del .aab
```

---

## 📅 Desarrollo diario

Para cualquier cambio de código (UI, funcionalidad, correcciones, documentación):

```bash
git add .
git commit -m "descripción del cambio"
git push
```

### ¿Qué ocurre automáticamente?

| Acción | Resultado |
|---|---|
| `git commit` | Hook detecta archivos cambiados → determina bump (major/minor/patch) |
| | `android-version.json` se actualiza con nueva versión |
| | `android/app/build.gradle` se actualiza con nueva versión |
| | Ambos archivos se añaden al commit automáticamente |
| `git push` | Vercel despliega la nueva versión web |
| | `android-version.json` queda disponible en producción |

### ¿Qué NO ocurre en el commit?

- ❌ Gradle / assembleRelease / bundleRelease
- ❌ Generación de APK o AAB
- ❌ Binarios añadidos al repositorio

---

## 📱 Release Android — APK (distribución manual)

Para generar un APK firmado para distribución directa (sideloading, pruebas):

```bash
# 1. Hacer commit de los cambios primero (versión ya queda bumpeada)
git add .
git commit -m "versión lista para release"
git push

# 2. Generar el APK
npm run android:apk
```

**Resultado:**
```
[android:apk] ✅ APK listo: 3.6.0 (16)
[android:apk]    Ruta: public/downloads/cromoswap-ecuador.apk
```

El APK queda en `public/downloads/cromoswap-ecuador.apk` (no se sube a git).

> ⚠️ **Nota:** `public/downloads/cromoswap-ecuador.apk` está en `.gitignore`.
> El APK debe distribuirse manualmente (email, WhatsApp, servidor propio, etc.).

---

## 🏪 Release Android — AAB (Google Play)

Para generar un Android App Bundle firmado para subir a Google Play Console:

```bash
# 1. Hacer commit de los cambios primero (versión ya queda bumpeada)
git add .
git commit -m "versión lista para Google Play"
git push

# 2. Generar el AAB
npm run android:bundle
```

**Resultado:**
```
[android:bundle] ✅ AAB listo: 3.6.0 (16)
[android:bundle]    Ruta: android/app/build/outputs/bundle/release/app-release.aab
[android:bundle]    → Subir a Google Play Console: android/app/build/outputs/bundle/release/app-release.aab
```

El `.aab` queda en `android/app/build/outputs/bundle/release/app-release.aab`.
**Este archivo está en `.gitignore` — no se sube al repositorio.**

---

## 📦 Ejemplo de ciclo completo de versiones

```
Estado inicial:
  android-version.json → versionName: "3.5.0", versionCode: 14

Commit 1 (cambio en components/):
  git commit -m "fix modal de álbum"
  → bump: minor
  → android-version.json → 3.6.0 (15)

Commit 2 (cambio en docs/):
  git commit -m "actualizar README"
  → bump: patch
  → android-version.json → 3.6.1 (16)

Commit 3 (cambio en prisma/schema.prisma):
  git commit -m "migración nueva columna"
  → bump: major
  → android-version.json → 4.0.0 (17)

Release para Google Play:
  npm run android:bundle
  → AAB: 4.0.0 (17)
  → Subir a Google Play Console
```

---

## 🔢 Reglas de versionado automático

El script `scripts/version-bump.mjs` determina el tipo de bump según los archivos cambiados:

| Tipo | Archivos que lo disparan |
|---|---|
| **major** | `prisma/schema.prisma`, `prisma/migrations/`, `app/api/auth/`, `app/api/user-stickers/`, `middleware.ts` |
| **minor** | `app/`, `components/`, `lib/`, `android/`, `capacitor.config.ts`, `package.json`, archivos nuevos |
| **patch** | Todo lo demás (docs, scripts, config, etc.) |

### Forzar un tipo de bump:
```bash
ANDROID_VERSION_BUMP=major git commit -m "breaking change"
ANDROID_VERSION_BUMP=patch git commit -m "forzar patch aunque sea minor"
```

### Omitir el versionado completamente:
```bash
SKIP_ANDROID_RELEASE=1 git commit -m "commit sin bump de versión"
```

---

## 🛠️ Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run android:apk` | Genera APK release firmado (sin bump de versión) |
| `npm run android:bundle` | Genera AAB release firmado para Google Play (sin bump) |
| `npm run android:apk-debug` | Genera APK debug para pruebas rápidas |
| `npm run android:sync` | Solo sincroniza Capacitor con Android |
| `npm run android:create-keystore` | Crea el keystore de firma |

---

## 📁 Archivos involucrados

| Archivo | Propósito | ¿En git? |
|---|---|---|
| `.githooks/pre-commit` | Hook que dispara version-bump en cada commit | ✅ Sí |
| `scripts/version-bump.mjs` | Versionado ligero, sin build Android | ✅ Sí |
| `scripts/prepare-android-release.mjs` | Build APK release | ✅ Sí |
| `scripts/prepare-android-bundle.mjs` | Build AAB para Google Play | ✅ Sí |
| `public/downloads/android-version.json` | Versión actual publicada | ✅ Sí |
| `android/app/build.gradle` | Versión nativa Android | ✅ Sí |
| `public/downloads/cromoswap-ecuador.apk` | APK generado | ❌ .gitignore |
| `android/app/build/outputs/bundle/release/app-release.aab` | AAB generado | ❌ .gitignore |
| `android/release-signing.properties` | Credenciales de firma | ❌ .gitignore |
| `android/keystores/cromoswap-release.jks` | Keystore | ❌ .gitignore |

---

## 🔗 Sincronización web/app

La sincronización entre la versión web (Vercel) y la app Android funciona así:

```
git push
  │
  ├── Vercel despliega automáticamente
  │     └── https://cromoswapcuenca.vercel.app/downloads/android-version.json
  │           ← versión actualizada disponible en producción
  │
  └── La app Android (Capacitor) consulta ese endpoint al abrir
        └── AndroidUpdateChecker compara versionCode
              └── Si hay nueva versión → muestra modal (si el flag está activo)
```

La variable `NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK` controla si el modal se muestra:
- `false` (default) → Google Play gestiona las actualizaciones
- `true` → Modal de actualización activo (distribución manual)

---

## ✅ Checklist antes de un release

- [ ] Todos los cambios commiteados y pusheados
- [ ] `android-version.json` tiene la versión correcta
- [ ] `android/app/build.gradle` tiene versionCode y versionName correctos
- [ ] Para Google Play: `NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK=false`
- [ ] Keystore disponible en `android/keystores/cromoswap-release.jks`
- [ ] `android/release-signing.properties` configurado
- [ ] Ejecutar `npm run android:bundle` → verificar que el .aab se genera
- [ ] Subir `.aab` a Google Play Console → Internal Testing primero
