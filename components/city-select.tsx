"use client";

import { useEffect, useMemo, useState } from "react";

type CityOption = {
  id: string;
  name: string;
  province: string;
  slug: string;
};

function normalizeCity(value: string) {
  return value.trim().toLowerCase();
}

export function CitySelect({
  name = "city",
  currentCity,
  required = true
}: {
  name?: string;
  currentCity?: string;
  required?: boolean;
}) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [value, setValue] = useState(currentCity ?? "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/cities", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: CityOption[]) => {
        if (!isMounted) return;
        setCities(Array.isArray(data) ? data : []);

        if (currentCity) {
          const match = data.find((city) => normalizeCity(city.name) === normalizeCity(currentCity));
          setValue(match?.name ?? currentCity);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentCity]);

  const hasCurrentCity = useMemo(
    () => Boolean(currentCity && !cities.some((city) => normalizeCity(city.name) === normalizeCity(currentCity))),
    [cities, currentCity]
  );

  return (
    <select name={name} value={value} onChange={(event) => setValue(event.target.value)} required={required}>
      <option value="" disabled>
        {isLoading ? "Cargando ciudades..." : "Selecciona tu ciudad"}
      </option>
      {hasCurrentCity ? (
        <option value={currentCity}>
          {currentCity} — ciudad actual
        </option>
      ) : null}
      {cities.map((city) => (
        <option key={city.id} value={city.name}>
          {city.name} — {city.province}
        </option>
      ))}
    </select>
  );
}

