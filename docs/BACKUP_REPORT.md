# Backup Report

Fecha: 2026-06-01

## Motor de base de datos

PostgreSQL, identificado en `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

La configuracion local apunta a Neon PostgreSQL mediante `DATABASE_URL` / `DIRECT_URL`.

## Metodo utilizado

`pg_dump` no esta disponible en este entorno (`command not found`), por lo que se genero un backup logico completo de las tablas actuales usando Prisma Client contra la base configurada.

El backup incluye datos de:

- `User`
- `PasswordResetToken`
- `Album`
- `Sticker`
- `UserSticker`
- `ExchangeMatch`
- `Conversation`
- `Message`
- `Report`

Tambien se guardo una copia de `prisma/` con schema y migraciones vigentes al momento del backup.

## Archivo de backup

Archivo principal:

```text
backups/20260601_225026/cromo_swap_prisma_backup_20260601_225026.json
```

Copia de schema y migraciones:

```text
backups/20260601_225026/prisma_schema_and_migrations/
```

Conteo de registros respaldados:

| Tabla | Registros |
|---|---:|
| User | 9 |
| PasswordResetToken | 1 |
| Album | 1 |
| Sticker | 993 |
| UserSticker | 3034 |
| ExchangeMatch | 0 |
| Conversation | 0 |
| Message | 0 |
| Report | 0 |

## Instrucciones de restauracion

Restauracion recomendada en un entorno limpio:

1. Configurar `DATABASE_URL` y `DIRECT_URL` hacia una base PostgreSQL vacia.
2. Restaurar la estructura del schema vigente al momento del backup:

   ```bash
   cp -R backups/20260601_225026/prisma_schema_and_migrations ./prisma
   npm run prisma:migrate
   ```

3. Cargar los datos del JSON respetando dependencias:

   - `User`
   - `PasswordResetToken`
   - `Album`
   - `Sticker`
   - `UserSticker`
   - `ExchangeMatch`
   - `Conversation`
   - `Message`
   - `Report`

   Puede hacerse con un script temporal de Prisma que lea `tables` desde:

   ```text
   backups/20260601_225026/cromo_swap_prisma_backup_20260601_225026.json
   ```

   y ejecute `createMany` o `create` por tabla en el orden anterior.

4. Verificar conteos contra la tabla de este reporte.

## Resultado

Backup completado correctamente antes de modificar estructura o funcionalidad.
