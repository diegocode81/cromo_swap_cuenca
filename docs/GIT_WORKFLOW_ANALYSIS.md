# CromoSwap — Análisis del Workflow de Git / Build Android Automático

**Fecha de análisis:** Enero 2026  
**Estado:** Solo diagnóstico — sin cambios aplicados

---

## 🎯 Respuesta directa

> **¿Qué dispara el build Android en cada `git commit`?**

El archivo `.githooks/pre-commit` — un hook de Git personalizado que se activa **antes de cada commit** y ejecuta el build completo de Android Release.

---

## 📁 Componente responsable

| Campo | Detalle |
|---|---|
| **Archivo** | `.githooks/pre-commit` |
| **Tipo** | Git hook pre-commit personalizado |
| **Activación** | Automática en cada `git commit` |
| **Mecanismo** | `core.hooksPath = .githooks` en `.git/config` |

---

## 🔍 Contenido exacto del hook

**Ruta:** `.githooks/pre-commit`

```sh
#!/bin/sh
set -e

if [ "$SKIP_ANDROID_RELEASE" = "1" ]; then
  exit 0
fi

npm run android:release-apk
```

**Fragmento responsable del trigger:**
```sh
npm run android:release-apk
```

---

## ⚙️ Cómo está configurado Git para usar este hook

El repositorio tiene configurado en `.git/config` (configuración **local** del repo):

```ini
[core]
    hooksPath = .githooks
```

Esto sobreescribe el directorio de hooks por defecto (`.git/hooks/`) y apunta a `.githooks/` en la raíz del proyecto. Por eso `.git/hooks/` solo contiene archivos `.sample` inactivos — Git ni los mira.

---

## 🗺️ Grafo de ejecución completo

```
git commit -m "mensaje"
    │
    ▼
Git verifica: core.hooksPath = .githooks
    │
    ▼
.githooks/pre-commit  ←── DISPARADOR
    │
    │  ¿SKIP_ANDROID_RELEASE=1?  →  SÍ → exit 0 (omitir)
    │  NO ↓
    ▼
npm run android:release-apk
    │
    ▼
node scripts/prepare-android-release.mjs
    │
    ├── 1. Lee public/downloads/android-version.json (versión actual)
    ├── 2. git diff --cached --name-only  (archivos en staging)
    ├── 3. git diff --name-only           (archivos modificados)
    ├── 4. Detecta tipo de bump: major | minor | patch
    │         major → cambios en prisma, migraciones, auth, middleware
    │         minor → cambios en app/, components/, lib/, android/, package.json
    │         patch → resto de cambios
    ├── 5. Calcula nextVersionName y nextVersionCode (+1)
    ├── 6. Actualiza android/app/build.gradle (versionCode + versionName)
    ├── 7. Actualiza public/downloads/android-version.json
    ├── 8. npx cap sync android            (sincroniza Capacitor)
    ├── 9. ./gradlew assembleRelease       (compila APK release firmado)
    ├── 10. Copia APK → public/downloads/cromoswap-cuenca.apk
    └── 11. git add build.gradle + android-version.json + cromoswap-cuenca.apk
    │
    ▼
Git continúa con el commit (incluyendo los archivos añadidos en paso 11)
    │
    ▼
Commit finalizado con versión bumpeada y APK actualizado
```

---

## 🔎 Inventario de archivos involucrados

| Archivo | Rol |
|---|---|
| `.git/config` | Configura `hooksPath = .githooks` |
| `.githooks/pre-commit` | Hook que dispara el proceso |
| `scripts/prepare-android-release.mjs` | Script principal de build Android |
| `public/downloads/android-version.json` | Fuente de verdad de versión del APK |
| `android/app/build.gradle` | Actualizado con nueva versión en cada commit |
| `android/app/build/outputs/apk/release/app-release.apk` | APK compilado |
| `public/downloads/cromoswap-cuenca.apk` | APK publicado (accesible vía web) |
| `android/release-signing.properties` | Credenciales de firma (local, no en git) |
| `android/keystores/cromoswap-release.jks` | Keystore de firma (local, no en git) |

---

## 🚪 Escape hatch (bypass del hook)

El hook tiene un mecanismo de omisión:

```sh
SKIP_ANDROID_RELEASE=1 git commit -m "mensaje"
```

Con esta variable de entorno, el hook hace `exit 0` inmediatamente sin ejecutar el build Android.

---

## ⚠️ Riesgos de mantenerlo tal como está

### 1. **Lentitud en todos los commits**
Cada `git commit` dispara un build Gradle completo (~5-10 segundos mínimo en caché, más en cold build). Commits de documentación, typos o config pasan por el mismo proceso que un cambio funcional.

### 2. **El build genera APK, no AAB**
El script ejecuta `./gradlew assembleRelease` (APK). Para **Google Play** se requiere `bundleRelease` (AAB). El hook está optimizado para distribución directa de APK, no para Google Play.

### 3. **Modifica archivos durante el commit**
El script hace `git add` en medio del proceso de commit (paso 11 del grafo). Esto es técnicamente válido en pre-commit, pero hace que cada commit incluya automáticamente cambios de `build.gradle`, `android-version.json` y el APK binario (~30 MB). **El repositorio crece con cada commit.**

### 4. **APK binario en git**
`public/downloads/cromoswap-cuenca.apk` se sube al repositorio en cada commit. Los binarios grandes en git no son eliminables sin reescritura de historia (`git filter-branch` / `git-filter-repo`).

### 5. **Falla bloquea el commit**
Si Gradle falla (sin Android SDK, sin keystore, sin conexión para descargar dependencias), el commit **no se puede completar**. Cualquier colaborador sin el entorno Android configurado no puede hacer commits.

### 6. **`core.hooksPath` está en `.git/config` (local)**
La configuración está en `.git/config` (no en un archivo versionado como `.gitattributes`). Cualquier desarrollador que clone el repo NO tendrá activado este hook automáticamente — deben configurarlo manualmente. Esto genera comportamiento inconsistente entre entornos.

---

## ✅ Beneficios de mantenerlo

### 1. **Auto-versionado semántico inteligente**
El script detecta automáticamente si el bump debe ser `major`, `minor` o `patch` según los archivos modificados. No requiere intervención manual.

### 2. **APK siempre sincronizado con el código**
El APK descargable en producción siempre corresponde al último commit. No hay riesgo de servir un APK obsoleto.

### 3. **Integración completa en un solo paso**
`git commit` hace todo: versiona, compila, firma, publica. Para un developer en solitario con distribución directa de APK, es muy eficiente.

### 4. **Ya tiene bypass**
`SKIP_ANDROID_RELEASE=1` permite omitirlo cuando se necesita.

---

## 📊 Recomendación técnica

### Contexto actual
El proyecto está **migrando a Google Play**. La distribución directa de APK ya no es el canal principal.

### Recomendación: **Modificar** (no eliminar, no mantener igual)

| Opción | Descripción | Recomendado para |
|---|---|---|
| **Mantener igual** | Build APK en cada commit | ❌ Innecesario si se usa Google Play |
| **Eliminar hook** | Sin build automático | ⚠️ Se pierde auto-versionado |
| **Modificar** ✅ | Hook condicional por variable o rama | ✅ Flexible para ambos flujos |
| **Deshabilitar temporalmente** | `SKIP_ANDROID_RELEASE=1` en commits habituales | ✅ Solución inmediata sin cambios |

### Cambios sugeridos (a aplicar en una tarea separada):

1. **Cambiar `assembleRelease` → `bundleRelease`** en `prepare-android-release.mjs` para generar `.aab` compatible con Google Play.

2. **Hacer el hook condicional** por variable de entorno permanente:
   ```sh
   # .githooks/pre-commit
   #!/bin/sh
   set -e
   
   if [ "$SKIP_ANDROID_RELEASE" = "1" ]; then
     exit 0
   fi
   
   if [ "$ANDROID_AUTO_BUILD" != "1" ]; then
     exit 0  # Desactivado por defecto
   fi
   
   npm run android:release-apk
   ```

3. **Excluir el APK binario del repositorio** (`public/downloads/cromoswap-cuenca.apk`) añadiéndolo a `.gitignore`. En Google Play, el APK no necesita estar en el repo.

4. **Documentar** que `core.hooksPath = .githooks` debe configurarse manualmente por cada colaborador:
   ```bash
   git config core.hooksPath .githooks
   ```

---

## 📋 Resumen ejecutivo

| Pregunta | Respuesta |
|---|---|
| ¿Qué dispara Android en cada commit? | `.githooks/pre-commit` |
| ¿Cómo está activado ese directorio? | `core.hooksPath = .githooks` en `.git/config` |
| ¿Qué script ejecuta? | `npm run android:release-apk` → `scripts/prepare-android-release.mjs` |
| ¿Se puede omitir? | Sí: `SKIP_ANDROID_RELEASE=1 git commit` |
| ¿Es compatible con Google Play? | ❌ Genera APK, Google Play requiere AAB |
| ¿Recomendación? | **Modificar** — no eliminar, no dejar igual |
