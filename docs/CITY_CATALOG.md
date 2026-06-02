# Catalogo de ciudades

CromoSwap Ecuador usa un catalogo persistente de ciudades para normalizar el valor de `User.city` sin cambiar todavia el modelo de usuarios a `cityId`.

## Migracion

La migracion `prisma/migrations/20260602152000_create_cities/migration.sql` crea la tabla `cities` con:

- `id`
- `name`
- `province`
- `slug`
- `isActive`
- `createdAt`
- `updatedAt`

La migracion no modifica ni borra usuarios existentes.

## Seed

`prisma/seed.ts` inserta un catalogo inicial de 221 ciudades/cantones de Ecuador, ordenado alfabeticamente por nombre, y tambien preserva ciudades ya existentes en usuarios como entradas activas con provincia `Sin definir` si no estan en el catalogo inicial.

El seed es idempotente: no duplica ciudades, actualiza `name` y `province` si cambia el catalogo, y no reactiva ciudades que el administrador haya desactivado manualmente.

## Compatibilidad

`User.city` sigue siendo texto. Registro y perfil guardan el nombre normalizado de la ciudad activa elegida desde el catalogo. Esto mantiene funcionando el matching actual porque el algoritmo sigue comparando `user.city`.

Las ciudades inactivas no aparecen en registro ni como nueva opcion de perfil, pero no rompen usuarios existentes que ya tengan ese valor.

## Backup

Antes de aplicar esta migracion en produccion, generar o verificar un backup actualizado de la base. El repositorio ya documenta backups previos en `docs/BACKUP_REPORT.md`, pero esta migracion no fue aplicada desde Codex contra la base remota.
