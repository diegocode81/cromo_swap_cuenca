# CromoSwap Ecuador

Plataforma comunitaria gratuita para intercambiar cromos entre coleccionistas de Ecuador, organizada por ciudad. La primera temporada usa el album Mundial 2026, pero la arquitectura es multi-ciudad y multi-album, y permite reiniciar temporadas sin borrar usuarios, inventarios ni matches historicos.

## Stack

- Next.js 14 App Router, React, TypeScript y TailwindCSS
- API Route Handlers de Next.js
- PostgreSQL en Neon con Prisma
- NextAuth credentials con JWT
- bcrypt para hash de contrasenas
- Zod para validaciones
- Vercel Cron Jobs para el agente de intercambios

## Instalacion

```bash
npm install
cp .env.example .env
```

Configura `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DB?sslmode=require"
NEXTAUTH_SECRET="un-secreto-largo"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="otro-secreto-largo"
RESEND_API_KEY="re_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SEED_ADMIN_EMAIL="admin@cromoswap.ec"
SEED_ADMIN_PASSWORD="usa-una-contrasena-segura-solo-para-seed"
```

En Neon usa `DATABASE_URL` con pooling para la app y `DIRECT_URL` sin pooling para migraciones.
`RESEND_API_KEY` se usa para enviar enlaces de recuperacion de contrasena. En produccion configura `NEXT_PUBLIC_APP_URL` como `https://cromoswapcuenca.vercel.app`.

## Base de datos

```bash
npm run prisma:migrate
npm run prisma:seed
```

El seed crea:

- Album `Mundial 2026`; lo deja activo solo si no existe otro album activo
- Catalogo inicial parametrizado por secciones/equipos
- Catalogo inicial de ciudades/cantones de Ecuador
- Usuario admin usando `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`

`SEED_ADMIN_PASSWORD` es obligatorio solo cuando el admin inicial no existe. No uses una contrasena publica ni reutilizada.

## Gestion de ciudades

El campo ciudad se selecciona desde un catalogo persistente en la tabla `cities`. El administrador puede crear, editar, activar/desactivar y eliminar ciudades desde `/admin/cities`.

`User.city` se mantiene como texto normalizado para conservar compatibilidad con usuarios existentes y con el algoritmo de matching. Las ciudades inactivas dejan de aparecer como opcion nueva en registro/perfil, pero no rompen usuarios existentes.

Antes de aplicar migraciones en produccion, verifica un backup actualizado. Ver `docs/CITY_CATALOG.md`.

## Gestion de albumes

El administrador puede crear y actualizar albumes desde `/admin/albums`, dejarlos en borrador y activarlos cuando esten listos para usuarios. El catalogo se parametriza por secciones con este formato, una linea por seccion:

```text
HAI,Haiti,20
ECU,Ecuador,20
GEN,General,40
```

Cada codigo reinicia su numeracion desde 1, por ejemplo `HAI 1`, `HAI 2`, `ECU 1`. Al activar un album, el album activo anterior pasa a historico. El catalogo solo se puede regenerar si el album aun no tiene inventarios ni matches. Al eliminar un album se borran sus cromos, inventarios y matches relacionados; tambien se eliminan cuentas `USER` que no tengan actividad fuera de ese album.

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Pruebas

```bash
npm run test
```

Incluye una prueba basica del `ExchangeAgent`. Para ampliar cobertura, agrega fixtures con usuarios, inventarios y matches esperados.

## Build

```bash
npm run build
```

## Release Workflow

El flujo diario separa el versionado automatico de la generacion de artefactos Android.

### Desarrollo diario

```bash
git add .
git commit -m "mensaje"
git push
```

Resultado:

- El commit incrementa automaticamente la version Android.
- `public/downloads/android-version.json` se actualiza y sigue siendo la fuente de verdad.
- `android/app/build.gradle` queda sincronizado con la version generada.
- El push despliega automaticamente la web en Vercel.
- No se generan APKs.
- No se generan AABs.
- No se agregan binarios Android al repositorio.

### Generar APK

```bash
npm run android:apk
```

Resultado:

- Genera un APK release firmado.
- Usa la version ya generada por los commits previos.
- Se usa para distribucion manual fuera de Google Play.
- No incrementa la version y no hace `git add`.

Salida esperada:

```text
public/downloads/cromoswap-ecuador.apk
```

### Generar Android App Bundle

```bash
npm run android:bundle
```

Resultado:

- Genera el Android App Bundle release firmado.
- Usa la version ya generada por los commits previos.
- Produce el artefacto listo para subir a Google Play Console.
- No incrementa la version y no hace `git add`.

Ruta esperada:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

### Google Play

Google Play sera el mecanismo principal de distribucion de la app Android. Para produccion, el modal de actualizacion manual de APK esta desactivado por defecto mediante `NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK=false` o dejando la variable sin definir.

Google Play gestionara las actualizaciones de usuarios. El modal de APK solo debe activarse con `NEXT_PUBLIC_ENABLE_APK_UPDATE_CHECK=true` para distribucion manual fuera de Google Play.

## Versioning

- Cada commit incrementa automaticamente la version Android mediante `.githooks/pre-commit`.
- `public/downloads/android-version.json` es la fuente de verdad de la version.
- `android/app/build.gradle` se mantiene sincronizado con `android-version.json`.
- La web desplegada en Vercel y la app Android usan la misma version publicada.
- Los releases Android no generan una version nueva: `npm run android:apk` y `npm run android:bundle` usan la version ya creada por los commits.

Para omitir el versionado en un commit puntual:

```bash
SKIP_ANDROID_RELEASE=1 git commit -m "mensaje"
```

## Artefactos Android

| Artefacto | Comando | Salida | Uso | En git |
|---|---|---|---|---|
| APK release | `npm run android:apk` | `public/downloads/cromoswap-ecuador.apk` | Distribucion manual | No |
| AAB release | `npm run android:bundle` | `android/app/build/outputs/bundle/release/app-release.aab` | Google Play Console | No |

No deben subirse al repositorio:

- `public/downloads/cromoswap-ecuador.apk`
- `android/app/build/`
- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/release-signing.properties`
- `android/keystores/`

La configuracion de `.gitignore` excluye los artefactos generados y las credenciales de firma Android.

## Deploy en Vercel

1. Crea una base PostgreSQL en Neon.
2. Configura las variables de entorno en Vercel: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.
3. Ejecuta migraciones contra Neon desde local o CI: `npm run prisma:migrate`.
4. Ejecuta seed una vez: `npm run prisma:seed`.
5. Despliega en Vercel.

`vercel.json` ejecuta `/api/cron/exchange-agent` una vez al dia para ser compatible con Vercel Hobby. En Vercel Pro puedes cambiar el schedule a `0 * * * *` para ejecutarlo cada hora. El endpoint valida `CRON_SECRET` por header `Authorization: Bearer <secret>`.

## Arquitectura

- `prisma/schema.prisma`: modelos multi-album y relaciones principales.
- `lib/auth.ts`: NextAuth credentials, sesiones JWT y helpers `requireUser`/`requireAdmin`.
- `lib/exchange-agent.ts`: agente server-side que revisa solo el album activo, calcula compatibilidad, evita duplicados y archiva matches obsoletos.
- `app/api/*`: endpoints para auth, usuarios, albumes, cromos, inventario, matches, reportes, admin y cron.
- `components/*`: formularios y pantallas interactivas client-side.
- `app/*`: rutas frontend protegidas por `middleware.ts`.

## Reglas importantes

- Cada usuario pertenece a una ciudad.
- Solo un album activo a la vez.
- El reinicio de temporada es logico: no borra usuarios, inventarios anteriores ni historial de matches.
- Los matches nuevos se generan solo para el album activo.
- No se muestran telefonos, direcciones exactas ni datos sensibles.

## Scripts

```bash
npm run dev
npm run build
npm run android:apk
npm run android:bundle
npm run android:apk-debug
npm run android:sync
npm run android:create-keystore
npm run db:cities:seed
npm run prisma:migrate
npm run prisma:seed
npm run test
```
