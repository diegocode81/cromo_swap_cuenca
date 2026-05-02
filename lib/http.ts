import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(error: unknown) {
  if (error instanceof ZodError) {
    return json({ error: "Datos invalidos", issues: error.flatten() }, { status: 400 });
  }
  return json({ error: error instanceof Error ? error.message : "Solicitud invalida" }, { status: 400 });
}

export function forbidden() {
  return json({ error: "No autorizado" }, { status: 403 });
}

export function notFound(message = "No encontrado") {
  return json({ error: message }, { status: 404 });
}
