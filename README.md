# CromoSwap Cuenca

Plataforma comunitaria gratuita para intercambiar cromos en Cuenca, Ecuador. La primera temporada usa el album Mundial 2026, pero la arquitectura es multi-album y permite reiniciar temporadas sin borrar usuarios, chats, inventarios ni matches historicos.

## Stack

- Next.js 14 App Router, React, TypeScript y TailwindCSS
- API Route Handlers de Next.js
- PostgreSQL en Neon con Prisma
- NextAuth credentials con JWT
- bcryptjs para hash de contrasenas
- Zod para validaciones
- Vercel Cron Jobs para el agente de intercambios
- Chat interno persistido con polling simple

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
```

En Neon usa `DATABASE_URL` con pooling para la app y `DIRECT_URL` sin pooling para migraciones.

## Base de datos

```bash
npm run prisma:migrate
npm run prisma:seed
```

El seed crea:

- Album activo `Mundial 2026`
- Catalogo inicial parametrizado por secciones/equipos
- Usuario admin `admin@cromoswap.ec` con contrasena `Admin12345!`

Cambia esa contrasena despues del primer acceso.

## Gestion de albumes

El administrador puede crear albumes en borrador desde `/admin/albums` y activarlos cuando esten listos para usuarios. El catalogo se parametriza por secciones con este formato, una linea por seccion:

```text
HAI,Haiti,20
ECU,Ecuador,20
GEN,General,40
```

Cada codigo reinicia su numeracion desde 1, por ejemplo `HAI 1`, `HAI 2`, `ECU 1`. Al activar un album, el album activo anterior pasa a historico. Al eliminar un album se borran sus cromos, inventarios, matches, conversaciones, mensajes y reportes relacionados; las cuentas de usuario se conservan.

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

## Deploy en Vercel

1. Crea una base PostgreSQL en Neon.
2. Configura las variables de entorno en Vercel: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`.
3. Ejecuta migraciones contra Neon desde local o CI: `npm run prisma:migrate`.
4. Ejecuta seed una vez: `npm run prisma:seed`.
5. Despliega en Vercel.

`vercel.json` ejecuta `/api/cron/exchange-agent` una vez al dia para ser compatible con Vercel Hobby. En Vercel Pro puedes cambiar el schedule a `0 * * * *` para ejecutarlo cada hora. El endpoint valida `CRON_SECRET` por header `Authorization: Bearer <secret>` o query `?secret=<secret>`.

## Arquitectura

- `prisma/schema.prisma`: modelos multi-album y relaciones principales.
- `lib/auth.ts`: NextAuth credentials, sesiones JWT y helpers `requireUser`/`requireAdmin`.
- `lib/exchange-agent.ts`: agente server-side que revisa solo el album activo, calcula compatibilidad, evita duplicados y archiva matches obsoletos.
- `app/api/*`: endpoints para auth, usuarios, albumes, cromos, inventario, matches, chat, reportes, admin y cron.
- `components/*`: formularios y pantallas interactivas client-side.
- `app/*`: rutas frontend protegidas por `middleware.ts`.

## Reglas importantes

- Solo una ciudad permitida: Cuenca.
- Solo un album activo a la vez.
- El reinicio de temporada es logico: no borra usuarios, chats, inventarios anteriores ni historial de matches.
- Los matches nuevos se generan solo para el album activo.
- No se muestran telefonos, direcciones exactas ni datos sensibles.
- El chat no envia mensajes automaticos y no usa WhatsApp como canal principal.

## Scripts

```bash
npm run dev
npm run build
npm run prisma:migrate
npm run prisma:seed
npm run test
```
