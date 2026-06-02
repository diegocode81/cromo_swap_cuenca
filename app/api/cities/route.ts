import { cityResponse } from "@/lib/city-catalog";
import { json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    orderBy: [{ name: "asc" }, { province: "asc" }],
    select: { id: true, name: true, province: true, slug: true }
  });

  return json(cities.map(cityResponse));
}
