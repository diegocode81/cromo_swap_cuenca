# Catalogo de ciudades de Ecuador

## Objetivo

El campo ciudad se gestiona desde la tabla `cities` para que registro, perfil y administracion usen un catalogo normalizado.

`User.city` se mantiene como texto por compatibilidad. No se migra a `cityId` todavia y no se modifican usuarios existentes.

## Migracion

La tabla se crea con:

```bash
npx prisma migrate deploy
```

Migracion:

```text
prisma/migrations/20260602152000_create_cities/migration.sql
```

Campos:

- `id`
- `name`
- `province`
- `slug`
- `isActive`
- `createdAt`
- `updatedAt`

La migracion no borra usuarios, cromos, albumes ni matches.

## Seed

El catalogo inicial vive en `lib/city-catalog.ts` y se carga desde `prisma/seed.ts`.

Para ejecutar:

```bash
npm run prisma:seed
```

El seed es idempotente:

- Usa `slug` unico.
- No duplica ciudades si se ejecuta varias veces.
- Actualiza `name` y `province` si el catalogo cambia.
- No reactiva ciudades desactivadas manualmente por un administrador.

## Cuenca y usuarios existentes

Cuenca esta incluida como:

```text
Cuenca — Azuay
```

Los usuarios existentes con `city = "Cuenca"` siguen funcionando porque `User.city` conserva el nombre de ciudad. Registro y perfil guardan el `name` normalizado del catalogo, por ejemplo `Cuenca`.

El matching actual sigue comparando `user.city`; no se cambia el algoritmo.

## Admin -> Ciudades

La pantalla `/admin/cities` permite:

- Ver ciudades activas e inactivas.
- Buscar por nombre, provincia o slug.
- Crear ciudad.
- Editar ciudad.
- Activar/desactivar ciudad.
- Eliminar ciudad solo si no tiene usuarios asociados.

Si la migracion no esta aplicada y falta la tabla `cities`, la pantalla muestra un mensaje controlado en lugar de romper la app.

## Produccion

Antes de aplicar cambios en produccion, verificar o generar backup actualizado.

Luego:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

