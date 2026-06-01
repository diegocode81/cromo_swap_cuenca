# WhatsApp Contact Feature

Fecha: 2026-06-01

## Objetivo

Permitir que, cuando un usuario encuentre un match de intercambio, pueda contactar por WhatsApp a la otra persona sin reactivar chat interno ni crear solicitudes formales de intercambio.

## Campo `phone`

Se agrega `User.phone` como campo nullable en base de datos para preservar usuarios existentes:

```prisma
phone String?
```

Para nuevos usuarios, el formulario de registro y la validacion backend lo tratan como obligatorio.

En perfil, el usuario puede editar su celular. Usuarios antiguos sin celular siguen pudiendo iniciar sesion, pero al guardar perfil deberan completar un valor valido.

## Validaciones

El celular:

- Es obligatorio en registro.
- No puede estar vacio.
- Permite numeros, espacios, `+`, guiones y parentesis.
- Se normaliza al guardar quitando espacios, guiones y parentesis.
- Mantiene `+` inicial si existe.
- Debe tener longitud razonable entre 9 y 16 caracteres normalizados.

Ejemplos validos:

- `0987654321`
- `+593987654321`
- `099 999 9999`

## Formato WhatsApp

Para abrir WhatsApp se usa:

```text
https://wa.me/NUMERO?text=MENSAJE_CODIFICADO
```

Reglas de conversion:

- Se quitan espacios, guiones y parentesis.
- Se quita `+` para `wa.me`.
- Si el numero local ecuatoriano empieza con `0` y tiene 10 digitos, se convierte a `593` + numero sin el `0`.

Ejemplo:

```text
0987654321 -> 593987654321
```

## Mensaje

El mensaje generado incluye:

- Saludo.
- Nombre de la app.
- Cromos que el usuario entrega.
- Cromos que desea recibir.

Ejemplo:

```text
Hola, vi en CromoSwap que podemos intercambiar cromos. Yo puedo entregarte ALG 1 y me interesaria recibir ALG 4.
```

## Matches

`GET /api/swaps/matches` ahora devuelve `phone` del usuario compatible:

```json
{
  "userId": "id",
  "userName": "Admin CromoSwap",
  "city": "Cuenca",
  "phone": "+593987654321",
  "exchangeQuantity": 1,
  "youGive": [],
  "youReceive": []
}
```

El numero no se imprime en pantalla. Solo se muestra el boton de WhatsApp cuando existe un celular utilizable.

Si el usuario compatible no tiene celular, se muestra:

```text
Este usuario aun no agrego celular.
```

Si el usuario actual no tiene celular, la busqueda no se bloquea, pero se muestra un aviso recomendando completar el perfil.

## Riesgos

- Usuarios antiguos pueden no tener celular hasta que actualicen perfil.
- La calidad del contacto depende de que el usuario ingrese un numero real.
- El celular queda disponible para construir enlaces de WhatsApp en resultados de match; no se muestra como texto visible para reducir exposicion innecesaria.

## Pruebas realizadas

- Registro con celular valido.
- Registro sin celular rechazado por validacion.
- Registro con caracteres invalidos rechazado por validacion.
- Perfil permite actualizar celular.
- Normalizacion de celular.
- Conversion de numero local ecuatoriano a formato `wa.me`.
- Construccion de mensaje con cromos entregados y recibidos.
- Match devuelve `phone` del usuario compatible.
- URL de WhatsApp no se genera si no hay celular.
- Algoritmo de matching existente sigue pasando sus pruebas.

Comandos ejecutados:

```bash
npm test
npm run lint
npm run build
```

Resultado: 22 tests pasan, lint sin errores y build de produccion exitoso.
