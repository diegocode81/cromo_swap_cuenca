export const CITIES = ["Cuenca", "Quito", "Guayaquil", "Loja", "Ambato", "Manta"] as const;

export type City = (typeof CITIES)[number];

export function normalizeCity(value: string) {
  return value.trim();
}

export function isValidCity(value: string): value is City {
  return CITIES.includes(normalizeCity(value) as City);
}
