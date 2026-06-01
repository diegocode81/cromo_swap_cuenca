# Swap Matching Algorithm

Fecha: 2026-06-01

## Regla de negocio

Un intercambio sugerido solo es valido si ambas personas intercambian la misma cantidad de cromos.

Ademas, los usuarios solo pueden aparecer como compatibles si pertenecen a la misma ciudad.

## Flujo del algoritmo

1. Obtener el usuario autenticado.
2. Validar que el usuario tenga ciudad.
3. Obtener el album activo.
4. Obtener todos los cromos del album activo.
5. Obtener los cromos del usuario actual:
   - Repetidos: `UserSticker.status = REPEATED` y `quantity > 0`.
   - Faltantes: cromos del album que no tiene como `HAVE` o `REPEATED`.
6. Obtener usuarios activos de la misma ciudad.
7. Excluir al usuario actual.
8. Para cada candidato:
   - Calcular que cromos repetidos del usuario actual le faltan al candidato.
   - Calcular que cromos repetidos del candidato le faltan al usuario actual.
   - Crear sugerencia solo si ambos lados tienen al menos un cromo compatible.
   - Limitar ambos lados al menor numero de opciones disponibles.

## Ejemplo valido

Usuario A puede entregar 2 cromos repetidos que le faltan al Usuario B.  
Usuario B puede entregar 2 cromos repetidos que le faltan al Usuario A.

Resultado: intercambio valido de 2 cromos por 2 cromos.

## Ejemplo invalido

Usuario A puede entregar 3 cromos.  
Usuario B solo puede entregar 1 cromo.

No se muestra como 3 contra 1. El algoritmo lo limita a 1 contra 1.

## Restriccion por ciudad

Si el usuario actual esta en `Cuenca`, solo se comparan usuarios activos con `city = "Cuenca"`.

Usuarios de otras ciudades no se incluyen aunque tengan cromos compatibles.

## Por que la cantidad debe ser igual

La plataforma busca sugerir intercambios simples y justos. Si una persona entrega mas cromos que la otra, el intercambio queda desequilibrado y puede generar reclamos o negociaciones fuera del flujo esperado.

La igualdad por cantidad hace que cada sugerencia sea accionable sin negociacion adicional.

## Endpoint

```http
GET /api/swaps/matches
```

El endpoint usa la sesion actual y responde:

```json
{
  "matches": [
    {
      "userId": "user_id",
      "userName": "Nombre",
      "city": "Cuenca",
      "exchangeQuantity": 3,
      "youGive": [
        {
          "stickerId": "sticker_id",
          "stickerNumber": 10,
          "stickerCode": "GEN",
          "stickerName": "Cromo 10",
          "section": "General",
          "quantity": 1,
          "availableQuantity": 2
        }
      ],
      "youReceive": []
    }
  ]
}
```

`quantity` representa la cantidad sugerida para ese cromo en el intercambio.  
`availableQuantity` representa cuantos repetidos tiene disponible quien entrega ese cromo.

## Alcance no incluido

- No se implementa chat.
- No se implementa solicitud formal de intercambio.
- No se implementa aceptacion/rechazo.
- No se persisten los matches generados por esta busqueda.
