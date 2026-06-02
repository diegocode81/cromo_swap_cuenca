# Fix Admin Ciudades

## Causa encontrada

La pantalla `/admin/cities` ejecutaba `prisma.city.findMany()` directamente en un Server Component. En la base configurada, la migracion `20260602152000_create_cities` no estaba aplicada, por lo que Prisma lanzaba una excepcion server-side al intentar leer la tabla `cities`.

Verificacion ejecutada:

```bash
npx prisma migrate status
```

Resultado relevante:

```text
Following migration have not yet been applied:
20260602152000_create_cities
```

## Archivo responsable

- `app/admin/cities/page.tsx`

## Solucion aplicada

- `/admin/cities` ahora captura errores de catalogo no disponible y renderiza un mensaje controlado en lugar de tumbar la app.
- `GET /api/cities` devuelve una lista vacia si la tabla todavia no existe, para evitar romper selects publicos.
- APIs admin de ciudades devuelven JSON controlado `503` cuando falta la tabla.
- APIs admin devuelven `403` para usuarios no autorizados o sin sesion.
- Registro/perfil no lanzan excepcion Prisma si el catalogo no esta disponible; mantienen error controlado de ciudad.

## Validaciones

```bash
npm run test
npm run build
npx prisma migrate status
```

## Pasos para produccion

Antes de tocar produccion, verificar o generar backup actualizado de la base.

Luego aplicar la migracion y poblar el catalogo:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

La migracion es no destructiva: crea la tabla `cities` y no modifica ni borra usuarios existentes. `User.city` sigue siendo texto para mantener compatibilidad con el matching actual.

