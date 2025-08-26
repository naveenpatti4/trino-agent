import "server-only";
import { trinoTools, getConnectionStatus } from "@/lib/trino";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Get connection status
    const status = await getConnectionStatus();
    
    const toolCount = trinoTools.length;
      
    return Response.json({ 
      ok: true, 
      connection: status,
      url: status.endpoint, 
      toolCount, 
      tools: trinoTools 
    }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ 
      ok: false, 
      error: msg 
    }, { status: 500 });
  }
}
