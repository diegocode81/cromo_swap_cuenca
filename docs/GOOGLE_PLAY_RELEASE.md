# CromoSwap Ecuador — Publicación en Google Play

Guía completa para generar el Android App Bundle (`.aab`) y publicar en Google Play Console.

---

## 📋 Resumen del proyecto Android

| Campo | Valor |
|---|---|
| **Application ID** | `com.codeconsultings.cromoswapcuenca` |
| **App Name** | CromoSwap Ecuador |
| **Version Name** | `3.4.0` |
| **Version Code** | `12` |
| **Min SDK** | 24 (Android 7.0) |
| **Target SDK** | 36 (Android 16) |
| **Compile SDK** | 36 |
| **Permisos** | Solo `INTERNET` |

---

## ✅ Requisitos previos

- Node.js 22.x
- JDK 17+ (`java --version`)
- Android SDK instalado y `ANDROID_HOME` configurado
- Gradle disponible (el proyecto incluye `gradlew`)
- Keystore de firma existente: `android/keystores/cromoswap-release.jks`
- Archivo de propiedades de firma: `android/release-signing.properties`

---

## 🔑 Variables de entorno

Crear `.env` desde `.env.example` y configurar:

```env
# Desactivar modal de actualización manual (Google Play gestiona actualizaciones)
NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK=false
```

> ⚠️ **IMPORTANTE:** Para publicación en Google Play, esta variable debe ser `false`.
> Solo activar con `true` para distribución manual de APK fuera de la tienda.

---

## 🔇 Modal "Nueva versión disponible" — Control por feature flag

El componente `components/android-update-checker.tsx` incluye un feature flag que controla
si se muestra el modal de actualización manual de APK.

### Comportamiento según la variable:

| `NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK` | Comportamiento |
|---|---|
| `false` (o no definida) | Modal **desactivado**. No consulta `android-version.json`. No muestra modal. |
| `true` | Modal **activado**. Verifica versión y muestra aviso si hay actualización. |

### Para Google Play (producción):
```env
NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK=false
```

### Para pruebas de distribución manual:
```env
NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK=true
```

---

## 🔐 Firma del APK — Keystore

El proyecto ya cuenta con keystore de release configurado:

```
android/keystores/cromoswap-release.jks     ← Keystore (NO subir a git)
android/release-signing.properties          ← Credenciales (NO subir a git)
```

Ambos archivos están protegidos en `android/.gitignore`.

### Formato de `release-signing.properties`:
```properties
storeFile=/ruta/absoluta/al/android/keystores/cromoswap-release.jks
storePassword=TU_STORE_PASSWORD
keyAlias=cromoswap
keyPassword=TU_KEY_PASSWORD
```

> ⚠️ **Guardar el keystore y contraseñas en un lugar seguro** (password manager, secrets manager).
> Si se pierde el keystore, no se puede actualizar la app en Google Play.

### Si necesitas crear un nuevo keystore (solo si no existe):
```bash
npm run android:create-keystore
```
O manualmente:
```bash
keytool -genkey -v \
  -keystore android/keystores/cromoswap-release.jks \
  -alias cromoswap \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

---

## 🏗️ Pasos para generar el `.aab`

### 1. Construir la app web (Next.js → `public/`)
```bash
npm run build
```

### 2. Sincronizar con Android
```bash
npx cap sync android
```
Esto copia los assets web al proyecto Android y registra los plugins nativos.

### 3. Generar el Android App Bundle de release
```bash
cd android
./gradlew bundleRelease
```

### 4. Ubicación del archivo generado
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Script completo (desde la raíz del proyecto):
```bash
npm run build && \
npx cap sync android && \
cd android && \
./gradlew bundleRelease && \
echo "✅ AAB generado en: android/app/build/outputs/bundle/release/app-release.aab"
```

---

## 📱 Subir a Google Play Console

### Pasos:

1. Ir a [Google Play Console](https://play.google.com/console)
2. Seleccionar la app **CromoSwap Ecuador** (o crearla si no existe)
3. En el menú lateral: **Producción → Versiones de la app → Crear nueva versión**
4. En **Android App Bundles**, subir:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```
5. Completar:
   - **Nombre de la versión**: `3.4.0`
   - **Notas de versión**: describir los cambios
6. Guardar y **Revisar versión**
7. Enviar para revisión

---

## 🧪 Recomendación: Internal Testing primero

Antes de publicar en Producción, usar **Internal Testing** para validar:

1. Google Play Console → **Pruebas internas → Crear nueva versión**
2. Subir el mismo `.aab`
3. Agregar emails de testers al grupo de prueba interna
4. Los testers descargan desde Play Store usando el enlace de prueba interno
5. Verificar que:
   - La app abre correctamente
   - El modal de actualización **NO aparece** (`NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK=false`)
   - Login, álbum, matches y perfil funcionan
6. Si todo está bien → promover a Producción

---

## 📂 Actualizar versión para próximos releases

Antes de cada release, actualizar en `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 13          // ← incrementar en 1 siempre
    versionName "3.5.0"     // ← actualizar según semver
}
```

> ⚠️ Google Play **rechaza** un nuevo AAB si `versionCode` no es mayor al anterior.

---

## 🔍 Verificaciones antes de publicar

- [ ] `versionCode` incrementado respecto al último publicado
- [ ] `versionName` actualizado
- [ ] `NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK=false` en el build
- [ ] `npm run build` pasa sin errores
- [ ] `npx cap sync android` pasa sin errores
- [ ] `./gradlew bundleRelease` genera el `.aab` correctamente
- [ ] El `.aab` está firmado con el keystore correcto
- [ ] Keystore y `release-signing.properties` NO están en git
- [ ] Probado en Internal Testing antes de Producción

---

## 🚫 Archivos que NUNCA deben estar en el repositorio

```
android/keystores/cromoswap-release.jks
android/release-signing.properties
.env
```

Todos están protegidos en `android/.gitignore` y `.gitignore` raíz.
