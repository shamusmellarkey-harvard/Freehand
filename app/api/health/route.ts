import { DEMO_MODE, STORAGE_MODE } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "OK",
    app: "freehand",
    storage: STORAGE_MODE,
    demoMode: DEMO_MODE,
    time: new Date().toISOString(),
  });
}
