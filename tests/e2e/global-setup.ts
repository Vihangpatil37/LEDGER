import { createMockSupabaseServer } from "./mock-supabase";
import http from "node:http";

let mockServer: http.Server | null = null;

export default async function globalSetup() {
  // Check if port 54321 is already in use (e.g. real Supabase container running)
  const isRunning = await new Promise<boolean>((resolve) => {
    const req = http.get("http://127.0.0.1:54321/auth/v1/health", () => {
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });

  if (!isRunning) {
    mockServer = createMockSupabaseServer();
    await new Promise<void>((resolve, reject) => {
      mockServer!.listen(54321, "127.0.0.1", () => {
        resolve();
      });
      mockServer!.on("error", reject);
    });
    (globalThis as any).__MOCK_SUPABASE_SERVER__ = mockServer;
  }
}
