import { json } from "@/lib/http";
import { getActiveAlbum } from "@/lib/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  const album = await getActiveAlbum();
  return json({ album });
}
